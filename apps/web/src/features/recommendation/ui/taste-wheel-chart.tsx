import { useId } from "react";
import type { UserTasteSummary } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS } from "../components/result-labels";

type TasteWheelChartProps = {
  dimensions: UserTasteSummary["dimensions"];
};

const SIZE = 400;
const CENTER = SIZE / 2;
const INNER_RADIUS = 24;
const MAX_RADIUS = 128;
const LABEL_RADIUS = 148;
const VALUE_RADIUS = 181;

const COLORS = ["#2A103D", "#6327C6", "#FD4890", "#FF7043", "#E7AF24"];

function polarPoint(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function createArcPath(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const innerStart = polarPoint(innerRadius, startAngle);
  const outerStart = polarPoint(outerRadius, startAngle);
  const outerEnd = polarPoint(outerRadius, endAngle);
  const innerEnd = polarPoint(innerRadius, endAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${innerStart.x} ${innerStart.y}`,
    `L ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function createLabelArcPath(radius: number, startAngle: number, endAngle: number) {
  const middleAngle = ((startAngle + endAngle) / 2 + 360) % 360;
  const reverse = middleAngle > 0 && middleAngle < 180;
  const start = polarPoint(radius, reverse ? endAngle : startAngle);
  const end = polarPoint(radius, reverse ? startAngle : endAngle);

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${reverse ? 0 : 1} ${end.x} ${end.y}`;
}

export function TasteWheelChart({ dimensions }: TasteWheelChartProps) {
  const id = useId();

  if (dimensions.length === 0) {
    return null;
  }

  const sectorAngle = 360 / dimensions.length;
  const description = dimensions.map(({ dimension, score }) => `${DIMENSION_LABELS[dimension]} ${score}점`).join(", ");

  return (
    <figure className="mx-auto w-full max-w-[440px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>나의 칵테일 취향 원형 차트</title>
        <desc id={`${id}-desc`}>{description}. 각 바의 길이는 5점 만점의 취향 점수를 나타냅니다.</desc>

        {/* 취향별 부채꼴 */}
        <g aria-hidden="true">
          {dimensions.map(({ dimension, score }, index) => {
            const startAngle = -90 + index * sectorAngle;
            const endAngle = startAngle + sectorAngle;
            const middleAngle = (startAngle + endAngle) / 2;
            const outerRadius = INNER_RADIUS + ((MAX_RADIUS - INNER_RADIUS) * score) / 5;
            const valuePoint = polarPoint(VALUE_RADIUS, middleAngle);
            const labelPathId = `${id}-label-${index}`;

            return (
              <g key={dimension}>
                <path
                  d={createArcPath(INNER_RADIUS, outerRadius, startAngle + 0.35, endAngle - 0.35)}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                <defs>
                  <path id={labelPathId} d={createLabelArcPath(LABEL_RADIUS, startAngle + 8, endAngle - 8)} />
                </defs>

                <text fill="#332B35" fontSize="11" fontWeight="600" letterSpacing="0.08em">
                  <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">
                    {DIMENSION_LABELS[dimension]}
                  </textPath>
                </text>

                <circle cx={valuePoint.x} cy={valuePoint.y} r="14" fill="#F1EFED" />

                <text x={valuePoint.x} y={valuePoint.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="#211D22">
                  {score}
                </text>
              </g>
            );
          })}
        </g>

        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#FFFFFF" />
      </svg>

      <figcaption className="mt-1 text-center text-xs text-muted-foreground">바가 길수록 해당 취향 점수가 높아요.</figcaption>
    </figure>
  );
}
