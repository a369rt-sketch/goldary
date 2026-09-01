// ضغط الصور في المتصفح قبل الرفع:
// - تصغير أقصى عرض/ارتفاع إلى maxSize (افتراضي 1200px)
// - إعادة الترميز JPEG بجودة quality لتقليل الحجم
// يعيد الملف الأصلي كما هو إذا فشل الضغط أو لم يكن صورة نقطية.

export async function compressImage(
  file: File,
  maxSize = 1200,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    // لا فائدة إن كبُر الحجم بعد الضغط (صور صغيرة أصلاً)
    if (blob.size >= file.size && scale === 1) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
