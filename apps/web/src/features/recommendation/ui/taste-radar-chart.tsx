import type { UserTasteSummary } from "@cocktail-taste-test/contracts";

import { DIMENSION_LABELS } from "../components/result-labels";

type TasteRadarChartProps = {
  dimensions: UserTasteSummary["dimensions"];
};

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 82;

function point(index: number, count: number, radius: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  return `${CENTER + Math.cos(angle) * radius},${CENTER + Math.sin(angle) * radius}`;
}

export function TasteRadarChart({ dimensions }: TasteRadarChartProps) {
  if (dimensions.length < 3) return null;

  const count = dimensions.length;
  const outline = dimensions.map((_, index) => point(index, count, RADIUS)).join(" ");
  const values = dimensions.map(({ score }, index) => point(index, count, (RADIUS * score) / 5)).join(" ");
  const description = dimensions.map(({ dimension, score }) => `${DIMENSION_LABELS[dimension]} ${score}점`).join(", ");

  return (
    <figure className="mx-auto w-full max-w-[17rem]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label={`취향 레이더 차트: ${description}`}>
        <g aria-hidden="true">
          {[1, 0.75, 0.5, 0.25].map((scale) => <polygon key={scale} points={dimensions.map((_, index) => point(index, count, RADIUS * scale)).join(" ")} fill="none" stroke="rgba(48,35,43,0.16)" strokeWidth="1" />)}
          {dimensions.map((_, index) => <line key={index} x1={CENTER} y1={CENTER} x2={point(index, count, RADIUS).split(",")[0]} y2={point(index, count, RADIUS).split(",")[1]} stroke="rgba(48,35,43,0.13)" />)}
          <polygon points={outline} fill="none" stroke="rgba(48,35,43,0.2)" />
          <polygon points={values} fill="rgba(255,116,94,0.28)" stroke="#FF745E" strokeWidth="2.5" strokeLinejoin="round" />
          {dimensions.map(({ dimension, score }, index) => {
            const [x, y] = point(index, count, (RADIUS * score) / 5).split(",");
            const [labelX, labelY] = point(index, count, RADIUS + 26).split(",");
            return (
              <g key={dimension}>
                <circle cx={x} cy={y} r="4" fill="#FF745E" />
                <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#30232B" fontSize="12" fontWeight="700">{DIMENSION_LABELS[dimension]}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </figure>
  );
}
