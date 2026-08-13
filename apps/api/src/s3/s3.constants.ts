export const S3_CLIENT = Symbol('S3_CLIENT');

export const S3_READ_URL_TTL_SECONDS = 60 * 60 * 24;
export const S3_BROWSER_CACHE_TTL_SECONDS = 60 * 60 * 23;

export type UploadAssetType = 'avatar' | 'lesson-pdf' | 'lesson-video';

export interface UploadPolicy {
  contentTypes: readonly string[];
  maxBytes: number;
  prefix: string;
}

export const UPLOAD_POLICIES: Record<UploadAssetType, UploadPolicy> = {
  avatar: {
    contentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
    prefix: 'avatars',
  },
  'lesson-pdf': {
    contentTypes: ['application/pdf'],
    maxBytes: 25 * 1024 * 1024,
    prefix: 'lessons',
  },
  'lesson-video': {
    contentTypes: ['video/mp4', 'video/webm'],
    maxBytes: 500 * 1024 * 1024,
    prefix: 'lessons',
  },
};
