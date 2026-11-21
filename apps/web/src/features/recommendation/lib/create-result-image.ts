import type { RecommendationResponse, UserTasteSummary } from "@cocktail-taste-test/contracts";

import { DIMENSION_LABELS, FLAVOR_LABELS, getCocktailDescription, getCocktailDisplayName, getRecommendationReasonText, SPIRIT_LABELS } from "../components/result-labels";

const WIDTH = 1600;
const HEIGHT = 1200;
const FONT = '"Pretendard Variable", Pretendard, Arial, sans-serif';
const COLORS = {
  vanilla: "#FFF9F1",
  coral: "#FF745E",
  coralDeep: "#B43C2F",
  lime: "#D8F36A",
  lilac: "#C8B6FF",
  plum: "#30232B",
  surface: "#FFFDF9",
  border: "#E8DBD2",
  muted: "#706168",
};

const LOCAL_COCKTAIL_IDS = new Set(["americano", "dry-martini", "espresso-martini", "manhattan", "margarita", "mezcal-margarita", "mojito", "negroni", "old-fashioned", "pina-colada", "tequila-sunrise", "tom-collins"]);

function setFont(context: CanvasRenderingContext2D, weight: number, size: number) {
  context.font = `${weight} ${size}px ${FONT}`;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.stroke();
  }
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const characters = [...text];
  const lines: string[] = [];
  let line = "";

  for (const character of characters) {
    const next = line + character;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }

  if (line && lines.length < maxLines) {
    const consumed = lines.join("").length + line.length;
    lines.push(consumed < text.length ? `${line.trimEnd()}…` : line);
  }

  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image encoding failed")), "image/png");
  });
}

function drawContainedImage(context: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, width: number, height: number, radius: number) {
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();
  context.fillStyle = "#FFF0E6";
  context.fillRect(x, y, width, height);

  if (image) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawnWidth = image.width * scale;
    const drawnHeight = image.height * scale;
    context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  } else {
    context.fillStyle = COLORS.coralDeep;
    context.textAlign = "center";
    setFont(context, 700, 90);
    context.fillText("🍸", x + width / 2, y + height / 2 + 28);
    context.textAlign = "start";
  }
  context.restore();

  context.strokeStyle = COLORS.border;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
}

function drawTag(context: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string) {
  setFont(context, 700, 19);
  const width = context.measureText(text).width + 42;
  roundedRect(context, x, y, width, 44, 22, fill);
  context.fillStyle = COLORS.plum;
  context.fillText(text, x + 21, y + 29);
  return width;
}

function drawFittedTitle(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  let size = 88;
  do {
    setFont(context, 900, size);
    if (context.measureText(text).width <= maxWidth) break;
    size -= 4;
  } while (size > 52);
  context.fillStyle = COLORS.plum;
  context.fillText(text, x, y);
  return context.measureText(text).width;
}

function radarPoint(index: number, count: number, radius: number, centerX: number, centerY: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
}

function drawRadar(context: CanvasRenderingContext2D, dimensions: UserTasteSummary["dimensions"], centerX: number, centerY: number) {
  if (dimensions.length < 3) return;
  const radius = 105;
  const count = dimensions.length;

  [1, 0.75, 0.5, 0.25].forEach((scale) => {
    context.beginPath();
    dimensions.forEach((_, index) => {
      const point = radarPoint(index, count, radius * scale, centerX, centerY);
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.strokeStyle = "rgba(48,35,43,0.16)";
    context.lineWidth = 1;
    context.stroke();
  });

  context.beginPath();
  dimensions.forEach(({ score }, index) => {
    const point = radarPoint(index, count, (radius * score) / 5, centerX, centerY);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.fillStyle = "rgba(255,116,94,0.28)";
  context.fill();
  context.strokeStyle = COLORS.coral;
  context.lineWidth = 3;
  context.stroke();

  setFont(context, 700, 15);
  context.fillStyle = COLORS.plum;
  dimensions.forEach(({ dimension }, index) => {
    const point = radarPoint(index, count, radius + 30, centerX, centerY);
    context.textAlign = "center";
    context.fillText(DIMENSION_LABELS[dimension], point.x, point.y + 5);
  });
  context.textAlign = "start";
}

function drawProfile(context: CanvasRenderingContext2D, profile: UserTasteSummary) {
  roundedRect(context, 64, 678, 950, 350, 28, COLORS.surface, COLORS.border);
  context.fillStyle = COLORS.plum;
  setFont(context, 800, 27);
  context.fillText("▥  당신의 취향 프로필", 100, 728);

  drawRadar(context, profile.dimensions, 285, 866);

  const barX = 500;
  profile.dimensions.forEach(({ dimension, score }, index) => {
    const y = 765 + index * 49;
    context.fillStyle = COLORS.plum;
    setFont(context, 650, 17);
    context.fillText(DIMENSION_LABELS[dimension], barX, y);
    roundedRect(context, barX + 95, y - 12, 260, 10, 5, COLORS.border);
    roundedRect(context, barX + 95, y - 12, (260 * score) / 5, 10, 5, COLORS.coral);
    context.textAlign = "right";
    setFont(context, 750, 17);
    context.fillText(`${score}/5`, 920, y);
    context.textAlign = "start";
  });
}

function drawBartenderNote(context: CanvasRenderingContext2D) {
  roundedRect(context, 1040, 678, 496, 350, 28, COLORS.surface, COLORS.border);
  roundedRect(context, 1156, 728, 264, 50, 12, "rgba(216,243,106,0.7)", COLORS.lime);
  context.fillStyle = COLORS.plum;
  context.textAlign = "center";
  setFont(context, 850, 21);
  context.fillText("바텐더의 한마디!", 1288, 761);
  setFont(context, 700, 23);
  wrapText(context, "“가볍게 첫 모금을 즐기고, 천천히 이어지는 풍미를 느껴보세요. 오늘의 취향에 딱 맞는 한 잔이에요!”", 1288, 834, 380, 38, 4);
  context.fillStyle = COLORS.lime;
  roundedRect(context, 1228, 973, 120, 8, 4, COLORS.lime);
  context.textAlign = "start";
}

export async function createResultImage(result: RecommendationResponse) {
  const recommendation = result.recommendations[0];
  if (!recommendation) throw new Error("Recommendation is required");

  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const { cocktail } = recommendation;
  const displayName = getCocktailDisplayName(cocktail.id, cocktail.name);
  const description = getCocktailDescription(cocktail.id);
  const imageSource = LOCAL_COCKTAIL_IDS.has(cocktail.id) ? `/cocktails/${cocktail.id}.png` : cocktail.imageUrl;
  const [cocktailImage, brandIcon] = await Promise.all([imageSource ? loadImage(imageSource) : null, loadImage("/icon.svg")]);

  context.fillStyle = COLORS.vanilla;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "rgba(200,182,255,0.35)";
  context.beginPath();
  context.arc(1460, 190, 230, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(216,243,106,0.3)";
  context.beginPath();
  context.arc(50, 1160, 210, 0, Math.PI * 2);
  context.fill();

  if (brandIcon) context.drawImage(brandIcon, 64, 50, 48, 48);
  context.fillStyle = COLORS.plum;
  setFont(context, 800, 22);
  context.fillText("칵테일 취향 테스트", 128, 82);

  const heroX = 100;
  context.fillStyle = COLORS.plum;
  setFont(context, 800, 29);
  context.fillText("당신과 가장 잘 어울리는 칵테일은", heroX, 210);
  const titleWidth = drawFittedTitle(context, displayName, heroX, 310, 720);
  roundedRect(context, heroX, 326, Math.min(titleWidth, 720), 10, 5, COLORS.lime);
  context.fillStyle = COLORS.coral;
  setFont(context, 800, 28);
  context.fillText(cocktail.name, heroX, 375);

  if (description) {
    context.fillStyle = COLORS.muted;
    setFont(context, 450, 22);
    wrapText(context, description, heroX, 432, 710, 34, 3);
  }

  let tagX = heroX;
  cocktail.flavors.forEach((flavor) => { tagX += drawTag(context, FLAVOR_LABELS[flavor], tagX, 545, "rgba(216,243,106,0.62)") + 12; });
  cocktail.baseSpirits.forEach((spirit) => { tagX += drawTag(context, SPIRIT_LABELS[spirit], tagX, 545, "rgba(200,182,255,0.55)") + 12; });

  drawContainedImage(context, cocktailImage, 1080, 140, 400, 500, 32);
  drawProfile(context, result.profile);
  drawBartenderNote(context);

  roundedRect(context, 64, 1054, 1472, 92, 24, "rgba(216,243,106,0.16)", "rgba(216,243,106,0.8)");
  context.fillStyle = COLORS.plum;
  setFont(context, 850, 21);
  context.fillText("💡  취향 포인트", 100, 1109);
  recommendation.reasons.slice(0, 3).forEach((reason, index) => {
    const x = 370 + index * 375;
    context.fillStyle = COLORS.coralDeep;
    setFont(context, 800, 18);
    context.fillText("✓", x, 1109);
    context.fillStyle = COLORS.plum;
    setFont(context, 600, 17);
    wrapText(context, getRecommendationReasonText(reason), x + 30, 1109, 320, 25, 2);
  });

  return { blob: await canvasToBlob(canvas), fileName: `cocktail-taste-${cocktail.id}.png` };
}
