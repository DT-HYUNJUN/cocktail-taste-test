"use client";

import { useState } from "react";

interface CocktailImageProps {
  imageUrl: string | null;
  name: string;
}

export function CocktailImage({ imageUrl, name }: CocktailImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showFallback = !imageUrl || failedUrl === imageUrl;

  return (
    <div className="relative aspect-[4/5] bg-[#FFF0E6] md:aspect-auto md:min-h-[420px]">
      {showFallback ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="img" aria-label={`${name} 이미지 준비 중`}>
          <span aria-hidden="true" className="text-7xl">
            🍸
          </span>
          <span className="text-sm font-medium text-[#A94417]">이미지 준비 중</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`${name} 칵테일`} className="absolute inset-0 h-full w-full object-cover object-center" onError={() => setFailedUrl(imageUrl)} />
      )}
    </div>
  );
}
