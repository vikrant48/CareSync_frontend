/**
 * Phone camera photos are often 4-8 MB. Large JPG/PNG images are scaled down in the browser (longest side 2000 px,
 * JPEG 85%), which keeps a report readable at a fraction of the size. Other files, and images that are already
 * small or that the browser can't decode, are returned unchanged.
 */
export async function shrinkImageIfLarge(file: File, maxBytes = 1.5 * 1024 * 1024, maxSide = 2000): Promise<File> {
  if (!/^image\/(jpeg|png)$/.test(file.type) || file.size <= maxBytes || typeof document === 'undefined') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff'; // PNG transparency becomes white, not black, in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
