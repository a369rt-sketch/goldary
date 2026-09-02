"use client";

import { useT } from "@/app/lib/i18n";
import GalleryGrid from "@/app/components/GalleryGrid";

type Props = {
  images: string[];
  shopName: string;
};

export default function ShopGallery({ images, shopName }: Props) {
  const { t } = useT();
  if (images.length === 0) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 10 }}>{t.gallery}</div>
      <GalleryGrid
        tiles={images.map((url, i) => ({
          key: url,
          thumb: url,
          images, // العارض المكبّر يتنقّل عبر كل صور المعرض
          start: i,
          alt: `صورة من ${shopName}`,
        }))}
      />
    </div>
  );
}
