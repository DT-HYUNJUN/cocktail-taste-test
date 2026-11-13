"use client";

import Image from "next/image";
import { useState } from "react";

interface CocktailImageProps {
  cocktailId: string;
  imageUrl: string | null;
  name: string;
}

const LOCAL_COCKTAIL_IDS = new Set([
  "americano",
  "dry-martini",
  "espresso-martini",
  "manhattan",
  "margarita",
  "mezcal-margarita",
  "mojito",
  "negroni",
  "old-fashioned",
  "pina-colada",
  "tequila-sunrise",
  "tom-collins",
]);

export function CocktailImage({ cocktailId, imageUrl, name }: CocktailImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const hasLocalImage = LOCAL_COCKTAIL_IDS.has(cocktailId);
  const resolvedImageUrl = hasLocalImage ? `/cocktails/${cocktailId}.png` : imageUrl;

  const showFallback = !resolvedImageUrl || failedUrl === resolvedImageUrl;
  const showLoading = Boolean(resolvedImageUrl) && !showFallback && loadedUrl !== resolvedImageUrl;

  return (
    <div className="h-full bg-[#FFF0E6]">
      <div className="relative aspect-[4/5] overflow-hidden md:h-full md:aspect-auto">
        {showFallback ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="img" aria-label={`${name} 이미지 준비 중`}>
            <span aria-hidden="true" className="text-7xl">
              🍸
            </span>
            <span className="text-sm font-medium text-[#A94417]">이미지 준비 중</span>
          </div>
        ) : (
          <Image
            src={resolvedImageUrl}
            alt={`${name} 칵테일`}
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className={`object-contain object-center transition-opacity duration-200 md:object-cover ${showLoading ? "opacity-0" : "opacity-100"}`}
            unoptimized={!hasLocalImage}
            onLoad={() => setLoadedUrl(resolvedImageUrl)}
            onError={() => setFailedUrl(resolvedImageUrl)}
          />
        )}

        {showLoading ? (
          <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-[#FFF0E6]" role="status" aria-label="칵테일 이미지 불러오는 중">
            <span aria-hidden="true" className="text-5xl opacity-40">
              🍸
            </span>
          </div>
        ) : null}
      </div>

    </div>
  );
}
