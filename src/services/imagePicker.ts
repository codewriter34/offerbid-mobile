import * as ImagePicker from 'expo-image-picker';

export async function pickImagesFromLibrary(options?: {
  selectionLimit?: number;
  quality?: number;
}): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return [];
  }

  const limit = options?.selectionLimit ?? 1;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled) return [];
  return result.assets.map(asset => asset.uri).filter(Boolean);
}

export async function pickOneImage(quality = 0.8): Promise<string | null> {
  const [uri] = await pickImagesFromLibrary({selectionLimit: 1, quality});
  return uri ?? null;
}
