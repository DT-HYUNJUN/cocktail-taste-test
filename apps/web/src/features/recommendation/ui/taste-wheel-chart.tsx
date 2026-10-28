import { useId } from "react";
import type { UserTasteSummary } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS } from "../components/result-labels";

type TasteWheelChartProps = {
  dimensions: UserTasteSummary["dimensions"];
};

const SIZE = 400;
const CENTER = SIZE / 2;
const INNER_RADIUS = 26;
const MAX_RADIUS = 132;
const LABEL_RADIUS = 157;
const VALUE_RADIUS = 182;

const COLORS = ["#FF8A80", "#FF6F2C", "#E3B341", "#6B9B77", "#6FAEC3"];

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
        <desc id={`${id}-desc`}>{description}. 각 부채꼴의 길이는 5점 만점의 취향 점수를 나타냅니다.</desc>

        {/* 원형 눈금 */}
        <g aria-hidden="true">
          {[1, 2, 3, 4, 5].map((level) => {
            const radius = INNER_RADIUS + ((MAX_RADIUS - INNER_RADIUS) * level) / 5;

            return <circle key={level} cx={CENTER} cy={CENTER} r={radius} fill="none" stroke="#E9E2DB" strokeWidth="1" strokeDasharray="3 5" />;
          })}
        </g>

        {/* 취향별 부채꼴 */}
        <g aria-hidden="true">
          {dimensions.map(({ dimension, score }, index) => {
            const startAngle = -90 + index * sectorAngle;
            const endAngle = startAngle + sectorAngle;
            const middleAngle = (startAngle + endAngle) / 2;

            const barStartAngle = startAngle + 1;
            const barEndAngle = endAngle - 1;

            const outerRadius = INNER_RADIUS + ((MAX_RADIUS - INNER_RADIUS) * score) / 5;

            const labelPoint = polarPoint(LABEL_RADIUS, middleAngle);

            const valuePoint = polarPoint(VALUE_RADIUS, middleAngle);

            return (
              <g key={dimension}>
                {/* 점수 부채꼴 */}
                <path d={createArcPath(INNER_RADIUS, outerRadius, barStartAngle, barEndAngle)} fill={COLORS[index % COLORS.length]} />

                {/* 항목 이름 */}
                <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="#24211F">
                  {DIMENSION_LABELS[dimension]}
                </text>

                {/* 점수 배지 */}
                <circle cx={valuePoint.x} cy={valuePoint.y} r="12" fill="#FFF0E6" />

                <text x={valuePoint.x} y={valuePoint.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#A94417">
                  {score}
                </text>
              </g>
            );
          })}
        </g>

        {/* 중앙 장식 */}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#FFFFFF" stroke="#F0E4D9" strokeWidth="1" />

        <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="central" fontSize="21" aria-hidden="true">
          🍸
        </text>
      </svg>

      <figcaption className="mt-2 text-center text-xs text-muted-foreground">부채꼴이 길수록 해당 취향 점수가 높아요.</figcaption>
    </figure>
  );
}
