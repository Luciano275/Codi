import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';

const ISLAND_MODEL_KEY_PATTERN = /^islands\/[0-9a-f-]{36}\.glb$/;

@Injectable()
export class IslandModelService {
  constructor(private readonly s3: S3Service) {}

  async promote(userId: string, uploadKey: string | undefined, islandId: string) {
    if (!uploadKey) return undefined;
    const model = await this.s3.promotePendingObject(userId, 'island-model', uploadKey, islandId);
    if (!ISLAND_MODEL_KEY_PATTERN.test(model.objectKey)) {
      await this.s3.deleteObject(model.objectKey);
      throw new BadRequestException('La key generada para el modelo no es válida');
    }
    return model;
  }

  delete(objectKey: string | null | undefined) {
    return this.s3.deleteObject(objectKey);
  }

  async resolve<T extends { modelObjectKey: string | null; modelPath: string }>(island: T) {
    const { modelObjectKey, modelPath, ...publicIsland } = island;
    const model = await this.s3.signedResource(modelObjectKey, null, 'model/gltf-binary');
    return {
      ...publicIsland,
      hasCustomModel: Boolean(modelObjectKey),
      modelPath: model?.url ?? modelPath,
    };
  }
}
