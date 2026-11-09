import {Platform} from 'react-native';
import {API_CONFIG} from '@api/endpoints';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

let config: CloudinaryConfig | null = null;

export function configureCloudinary(
  cloudName: string,
  uploadPreset: string,
) {
  config = {cloudName, uploadPreset};
}

export async function uploadImage(imageUri: string): Promise<string> {
  if (!config) {
    throw new Error(
      'Cloudinary not configured. Call configureCloudinary() first.',
    );
  }

  const formData = new FormData();

  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1] ?? 'jpg';

  formData.append('file', {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    name: `upload_${Date.now()}.${fileType}`,
  } as unknown as Blob);

  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', 'offerbid/listings');

  const response = await fetch(
    `${CLOUDINARY_UPLOAD_URL}/${config.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
      headers: {'Content-Type': 'multipart/form-data'},
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url;
}

export async function uploadMultipleImages(
  imageUris: string[],
): Promise<string[]> {
  const results = await Promise.allSettled(
    imageUris.map(uri => uploadImage(uri)),
  );

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      urls.push(result.value);
    } else {
      errors.push(`Image ${index + 1}: ${result.reason}`);
    }
  });

  if (urls.length === 0 && errors.length > 0) {
    throw new Error(`All uploads failed: ${errors.join('; ')}`);
  }

  return urls;
}
