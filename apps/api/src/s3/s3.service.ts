import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { extname } from 'path';
import { RedisService } from '../redis/redis.service';
import type { RedisClientType } from 'redis';
import {
  S3_BROWSER_CACHE_TTL_SECONDS,
  S3_CLIENT,
  UPLOAD_POLICIES,
  type UploadAssetType,
} from './s3.constants';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface PendingUpload {
  uploadKey: string;
}

export interface SignedResource {
  url: string;
  fileName: string | null;
  contentType: string | null;
  expiresAt: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly readExpiresIn: number;
  private readonly redis: RedisClientType;

  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject('S3_BUCKET') private readonly bucket: string,
    @Inject('S3_READ_EXPIRES_IN') readExpiresIn: number,
    private readonly redisService: RedisService,
  ) {
    this.readExpiresIn = Math.min(Math.max(readExpiresIn, 60), 60 * 60 * 24 * 7);
    this.redis = redisService.getClient();
  }

  async uploadPending(
    userId: string,
    assetType: UploadAssetType,
    file: UploadedFile,
  ): Promise<PendingUpload> {
    this.validateUploadInput(assetType, file.originalname, file.mimetype, file.size);
    const uploadKey = `pending/${userId}/${randomUUID()}/${this.safeFileName(file.originalname)}`;
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: uploadKey,
        Body: createReadStream(file.path),
        ContentType: file.mimetype,
        CacheControl: `private, max-age=${S3_BROWSER_CACHE_TTL_SECONDS}, immutable`,
        Metadata: { 'owner-id': userId, 'asset-type': assetType },
      }));
      return { uploadKey };
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  async promotePendingObject(
    userId: string,
    assetType: UploadAssetType,
    uploadKey: string,
    destinationId: string,
  ) {
    const policy = UPLOAD_POLICIES[assetType];
    this.assertOwnedPendingKey(userId, uploadKey);
    const object = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: uploadKey }));
    this.assertObjectMatchesPolicy(object, userId, assetType, policy.maxBytes);

    const destinationKey = `${policy.prefix}/${destinationId}/${randomUUID()}${this.safeExtension(uploadKey)}`;
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: destinationKey,
        CopySource: `${this.bucket}/${uploadKey}`,
        MetadataDirective: 'COPY',
      }),
    );
    await this.deleteObject(uploadKey);
    return {
      objectKey: destinationKey,
      fileName: this.fileNameFromKey(uploadKey),
      contentType: object.ContentType ?? null,
    };
  }

  async signedResource(
    objectKey: string | null,
    fileName: string | null,
    contentType: string | null,
  ): Promise<SignedResource | null> {
    if (!objectKey) return null;
    const cachedResource = await this.getCachedSignedResource(objectKey);
    if (cachedResource) {
      return { ...cachedResource, fileName, contentType };
    }

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: this.readExpiresIn },
    );
    const resource = {
      url,
      expiresAt: new Date(Date.now() + this.readExpiresIn * 1000).toISOString(),
    };
    await this.cacheSignedResource(objectKey, resource);
    return { ...resource, fileName, contentType };
  }

  async deleteObject(objectKey: string | null | undefined) {
    if (!objectKey) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      await this.deleteCachedSignedResource(objectKey);
    } catch (error) {
      this.logger.error(`No se pudo eliminar el objeto S3 ${objectKey}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private validateUploadInput(
    assetType: UploadAssetType,
    fileName: string,
    contentType: string,
    size: number,
  ) {
    const policy = UPLOAD_POLICIES[assetType];
    if (!policy || !policy.contentTypes.includes(contentType)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > policy.maxBytes) {
      throw new BadRequestException('El tamaño del archivo no está permitido');
    }
    if (!fileName.trim()) throw new BadRequestException('El archivo necesita un nombre');
    return policy;
  }

  private assertOwnedPendingKey(userId: string, objectKey: string) {
    if (!objectKey.startsWith(`pending/${userId}/`)) {
      throw new BadRequestException('La carga no pertenece al usuario actual');
    }
  }

  private assertObjectMatchesPolicy(
    object: { ContentLength?: number; ContentType?: string; Metadata?: Record<string, string> },
    userId: string,
    assetType: UploadAssetType,
    maxBytes: number,
  ) {
    if (!object.ContentLength || object.ContentLength > maxBytes) {
      throw new BadRequestException('El objeto subido no cumple el límite de tamaño');
    }
    if (!UPLOAD_POLICIES[assetType].contentTypes.includes(object.ContentType ?? '')) {
      throw new BadRequestException('El objeto subido no tiene un tipo válido');
    }
    if (object.Metadata?.['owner-id'] !== userId || object.Metadata?.['asset-type'] !== assetType) {
      throw new NotFoundException('No se encontró una carga válida para este recurso');
    }
  }

  private safeFileName(fileName: string) {
    return fileName
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120);
  }

  private safeExtension(key: string) {
    const extension = extname(key).toLowerCase();
    return /^[.][a-z0-9]{1,5}$/.test(extension) ? extension : '';
  }

  private fileNameFromKey(key: string) {
    return key.slice(key.lastIndexOf('/') + 1);
  }

  private async getCachedSignedResource(objectKey: string) {
    if (!this.redisService.isReady()) return null;
    try {
      const cached = await this.redis.get(this.signedResourceCacheKey(objectKey));
      return cached ? JSON.parse(cached) as Omit<SignedResource, 'fileName' | 'contentType'> : null;
    } catch (error) {
      this.logger.warn(`No se pudo leer la caché de avatar ${objectKey}: ${String(error)}`);
      return null;
    }
  }

  private async cacheSignedResource(
    objectKey: string,
    resource: Omit<SignedResource, 'fileName' | 'contentType'>,
  ) {
    if (!this.redisService.isReady()) return;
    const ttl = Math.max(1, Math.min(S3_BROWSER_CACHE_TTL_SECONDS, this.readExpiresIn - 60));
    try {
      await this.redis.set(this.signedResourceCacheKey(objectKey), JSON.stringify(resource), {
        expiration: { type: 'EX', value: ttl },
      });
    } catch (error) {
      this.logger.warn(`No se pudo guardar la caché de avatar ${objectKey}: ${String(error)}`);
    }
  }

  private async deleteCachedSignedResource(objectKey: string) {
    if (!this.redisService.isReady()) return;
    try {
      await this.redis.del(this.signedResourceCacheKey(objectKey));
    } catch (error) {
      this.logger.warn(`No se pudo invalidar la caché de avatar ${objectKey}: ${String(error)}`);
    }
  }

  private signedResourceCacheKey(objectKey: string) {
    return `s3:signed-resource:${encodeURIComponent(objectKey)}`;
  }
}
