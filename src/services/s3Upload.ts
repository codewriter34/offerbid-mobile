import {Platform} from 'react-native';
import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';

export type UploadPurpose = 'AVATAR' | 'LISTING' | 'IDENTITY';

interface PresignSlot {
  uploadUrl: string;
  publicUrl: string;
}

function contentTypeFromUri(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function parseSlots(data: unknown, count: number): PresignSlot[] {
  const raw = (data ?? {}) as Record<string, any>;
  const list = raw.uploads ?? raw.files ?? raw.slots ?? (Array.isArray(data) ? data : []);
  if (!Array.isArray(list)) return [];
  return list.slice(0, count).map((item: Record<string, any>) => ({
    uploadUrl: item.uploadUrl ?? item.url ?? item.putUrl,
    publicUrl: item.publicUrl ?? item.url,
  }));
}

async function putFile(uploadUrl: string, uri: string, contentType: string): Promise<void> {
  const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
  const fileRes = await fetch(fileUri.startsWith('file') || fileUri.startsWith('/') ? uri : fileUri);
  const body = await fileRes.blob();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`S3 upload failed (${response.status}): ${text}`);
  }
}

export async function uploadImagesToS3(
  imageUris: string[],
  purpose: UploadPurpose,
): Promise<string[]> {
  if (imageUris.length === 0) return [];

  const files = imageUris.map(uri => ({contentType: contentTypeFromUri(uri)}));
  const {data} = await apiClient.post(ENDPOINTS.UPLOADS.PRESIGN, {purpose, files});
  const slots = parseSlots(data, imageUris.length);

  if (slots.length < imageUris.length) {
    throw new Error('Presign did not return enough upload slots');
  }

  const urls: string[] = [];
  for (let i = 0; i < imageUris.length; i++) {
    await putFile(slots[i].uploadUrl, imageUris[i], files[i].contentType);
    urls.push(slots[i].publicUrl);
  }
  return urls;
}

export async function uploadImageToS3(
  imageUri: string,
  purpose: UploadPurpose,
): Promise<string> {
  const [url] = await uploadImagesToS3([imageUri], purpose);
  return url;
}
