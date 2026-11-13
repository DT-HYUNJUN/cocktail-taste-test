import type { RecommendationResponse } from "@cocktail-taste-test/contracts";

import { DIMENSION_LABELS, FLAVOR_LABELS, getCocktailDescription, getCocktailDisplayName, getRecommendationReasonText, SCORE_LABELS, SPIRIT_LABELS } from "../components/result-labels";

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;
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

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const characters = [...text];
  const lines: string[] = [];
  let line = "";

  for (const character of characters) {
    const nextLine = line + character;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines - 1) break;
    } else {
      line = nextLine;
    }
  }

  if (line && lines.length < maxLines) {
    const consumedLength = lines.join("").length + line.length;
    lines.push(consumedLength < text.length ? `${line.trimEnd()}…` : line);
  }

  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Image encoding failed"));
    }, "image/png");
  });
}

function drawTag(context: CanvasRenderingContext2D, text: string, x: number, y: number, background: string, color: string) {
  context.font = "700 20px sans-serif";
  const width = context.measureText(text).width + 36;
  roundedRect(context, x, y, width, 42, 21, background);
  context.fillStyle = color;
  context.fillText(text, x + 18, y + 28);
  return width;
}

export async function createResultImage(result: RecommendationResponse) {
  const recommendation = result.recommendations[0];
  if (!recommendation) throw new Error("Recommendation is required");

  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const { cocktail } = recommendation;
  const displayName = getCocktailDisplayName(cocktail.id, cocktail.name);
  const description = getCocktailDescription(cocktail.id);
  const imageSource = LOCAL_COCKTAIL_IDS.has(cocktail.id) ? `/cocktails/${cocktail.id}.png` : cocktail.imageUrl;
  const cocktailImage = imageSource ? await loadImage(imageSource) : null;
  context.fillStyle = "#FCF7F2";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  roundedRect(context, 32, 32, 1536, 936, 38, "#FFFFFF");

  context.save();
  context.beginPath();
  context.roundRect(32, 32, 680, 936, [38, 0, 0, 38]);
  context.clip();
  context.fillStyle = "#FFF0E6";
  context.fillRect(32, 32, 680, 936);
  if (cocktailImage) {
    const scale = Math.max(680 / cocktailImage.width, 936 / cocktailImage.height);
    const width = cocktailImage.width * scale;
    const height = cocktailImage.height * scale;
    context.drawImage(cocktailImage, 32 + (680 - width) / 2, 32 + (936 - height) / 2, width, height);
  } else {
    context.fillStyle = "#B74716";
    context.font = "700 110px sans-serif";
    context.textAlign = "center";
    context.fillText("🍸", 372, 540);
    context.textAlign = "start";
  }
  context.restore();

  context.fillStyle = "#B74716";
  context.font = "700 20px sans-serif";
  context.letterSpacing = "3px";
  context.fillText("YOUR COCKTAIL", 764, 104);
  context.letterSpacing = "0px";

  context.fillStyle = "#201B18";
  context.font = "800 54px sans-serif";
  wrapText(context, displayName, 764, 166, 740, 62, 2);

  let tagX = 764;
  cocktail.flavors.forEach((flavor) => {
    tagX += drawTag(context, FLAVOR_LABELS[flavor], tagX, 202, "#FFF0E6", "#A94417") + 12;
  });
  cocktail.baseSpirits.forEach((spirit) => {
    tagX += drawTag(context, SPIRIT_LABELS[spirit], tagX, 202, "#FFF3CC", "#705200") + 12;
  });

  if (description) {
    context.fillStyle = "#6E625C";
    context.font = "400 22px sans-serif";
    wrapText(context, description, 764, 292, 740, 34, 4);
  }

  context.fillStyle = "#E8DED6";
  context.fillRect(764, 412, 740, 2);

  context.fillStyle = "#201B18";
  context.font = "700 25px sans-serif";
  context.fillText("이 칵테일이 어울리는 이유", 764, 464);

  recommendation.reasons.slice(0, 3).forEach((reason, index) => {
    const y = 512 + index * 40;
    context.fillStyle = "#FFF0E6";
    context.beginPath();
    context.arc(778, y - 7, 11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#B74716";
    context.font = "700 15px sans-serif";
    context.fillText("✓", 772, y - 2);
    context.fillStyle = "#554B46";
    context.font = "400 21px sans-serif";
    context.fillText(getRecommendationReasonText(reason), 806, y);
  });

  context.fillStyle = "#E8DED6";
  context.fillRect(764, 626, 740, 2);

  context.fillStyle = "#201B18";
  context.font = "700 25px sans-serif";
  context.fillText("이 칵테일의 맛", 764, 680);

  Object.entries(cocktail.dimensions).forEach(([dimension, score], index) => {
    const y = 730 + index * 45;
    const label = DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS];
    context.fillStyle = "#201B18";
    context.font = "600 19px sans-serif";
    context.fillText(label, 764, y);
    context.fillStyle = "#EEE7E2";
    context.fillRect(870, y - 13, 480, 12);
    context.fillStyle = "#FF632E";
    context.fillRect(870, y - 13, (480 * score) / 5, 12);
    context.fillStyle = "#6E625C";
    context.textAlign = "right";
    context.fillText(SCORE_LABELS[score], 1504, y);
    context.textAlign = "start";
  });

  return { blob: await canvasToBlob(canvas), fileName: `cocktail-taste-${cocktail.id}.png` };
}
