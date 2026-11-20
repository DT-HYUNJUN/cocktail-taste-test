"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const COCKTAILS = [
  { id: "americano", name: "아메리카노" },
  { id: "dry-martini", name: "드라이 마티니" },
  { id: "espresso-martini", name: "에스프레소 마티니" },
  { id: "manhattan", name: "맨해튼" },
  { id: "margarita", name: "마가리타" },
  { id: "mezcal-margarita", name: "메즈칼 마가리타" },
  { id: "mojito", name: "모히토" },
  { id: "negroni", name: "네그로니" },
  { id: "old-fashioned", name: "올드 패션드" },
  { id: "pina-colada", name: "피냐 콜라다" },
  { id: "tequila-sunrise", name: "테킬라 선라이즈" },
  { id: "tom-collins", name: "톰 콜린스" },
] as const;

const DESKTOP_QUERY = "(min-width: 768px)";
const SESSION_IMAGE_KEY = "cocktail-taste-test:landing-cocktail";

type CocktailId = (typeof COCKTAILS)[number]["id"];

function findCocktail(id: string | null) {
  return COCKTAILS.find((cocktail) => cocktail.id === id);
}

function selectCocktail(): (typeof COCKTAILS)[number] {
  const index = Math.floor(Math.random() * COCKTAILS.length);
  return COCKTAILS[index] ?? COCKTAILS[0];
}

export function SessionCocktailImage() {
  const [cocktailId, setCocktailId] = useState<CocktailId | null>(null);

  useEffect(() => {
    const desktopMedia = window.matchMedia(DESKTOP_QUERY);

    const updateCocktail = () => {
      if (!desktopMedia.matches) {
        setCocktailId(null);
        return;
      }

      const storedCocktail = findCocktail(window.sessionStorage.getItem(SESSION_IMAGE_KEY));
      const cocktail = storedCocktail ?? selectCocktail();

      if (!storedCocktail) window.sessionStorage.setItem(SESSION_IMAGE_KEY, cocktail.id);
      setCocktailId(cocktail.id);
    };

    updateCocktail();
    desktopMedia.addEventListener("change", updateCocktail);
    return () => desktopMedia.removeEventListener("change", updateCocktail);
  }, []);

  const cocktail = findCocktail(cocktailId);
  if (!cocktail) return null;

  return (
    <figure className="relative aspect-[4/5] overflow-hidden rounded-image border border-border bg-surface shadow-[0_24px_70px_rgba(48,35,43,0.16)]">
      <Image
        src={`/cocktails/${cocktail.id}.png`}
        alt={`${cocktail.name} 칵테일`}
        fill
        preload
        sizes="(min-width: 1280px) 420px, (min-width: 768px) 36vw, 0px"
        className="object-cover object-center"
      />

      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/90 via-plum/45 to-transparent px-5 pb-5 pt-20 text-vanilla">
        <p className="font-mono text-[0.65rem] font-bold tracking-[0.18em] text-lime">NOW POURING</p>
        <p className="mt-1 text-xl font-bold">{cocktail.name}</p>
      </figcaption>
    </figure>
  );
}
