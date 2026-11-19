/** Decodifica la imagen. createImageBitmap es más rápido, usa menos memoria y respeta la orientación EXIF. */
async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // Algunos formatos (p. ej. HEIC en Safari) solo los decodifica <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Formato de imagen no compatible. Prueba con una foto JPG o PNG."));
      i.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** Reduce una imagen a JPEG con lado máximo `max` px. Devuelve un data URL. */
export async function compressImage(file: File | Blob, max = 1024, quality = 0.8): Promise<string> {
  const img = await decode(file);
  try {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img.source, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    img.close();
  }
}

/** Miniatura más pequeña para guardar en el diario. */
export const makeThumb = (dataUrl: string) => dataUrlToBlob(dataUrl).then((b) => compressImage(b, 480, 0.72));

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
