import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_EDGE_PX = 2048; // D5 [Proposed]

/**
 * Re-encodes a picked photo as a fresh JPEG (≤2048px long edge) before
 * upload. Always re-encoding — even when no resize is needed — is what
 * strips EXIF, including GPS, since the storage buckets are public-read.
 */
export async function prepareUploadJpeg(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  let image = await context.renderAsync();
  if (Math.max(image.width, image.height) > MAX_EDGE_PX) {
    context.resize(image.width >= image.height ? { width: MAX_EDGE_PX } : { height: MAX_EDGE_PX });
    image = await context.renderAsync();
  }
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return saved.uri;
}
