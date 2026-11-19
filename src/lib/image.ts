/** Reduce una imagen a JPEG con lado máximo `max` px. Devuelve un data URL. */
export async function compressImage(file: File | Blob, max = 1024, quality = 0.8): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo leer la imagen"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Miniatura más pequeña para guardar en el diario. */
export const makeThumb = (dataUrl: string) => dataUrlToBlob(dataUrl).then((b) => compressImage(b, 480, 0.72));

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
