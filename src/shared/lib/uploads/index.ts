import {UPLOAD_PROVIDER} from '@shared/config/env';
import {uploadImage, uploadMultipleImages} from './cloudinary';
import {uploadImageToS3, uploadImagesToS3, UploadPurpose} from './s3';

export async function uploadMedia(
  imageUri: string,
  purpose: UploadPurpose = 'LISTING',
): Promise<string> {
  if (UPLOAD_PROVIDER === 'cloudinary') {
    return uploadImage(imageUri);
  }
  return uploadImageToS3(imageUri, purpose);
}

export async function uploadMediaMany(
  imageUris: string[],
  purpose: UploadPurpose = 'LISTING',
): Promise<string[]> {
  if (UPLOAD_PROVIDER === 'cloudinary') {
    return uploadMultipleImages(imageUris);
  }
  return uploadImagesToS3(imageUris, purpose);
}
