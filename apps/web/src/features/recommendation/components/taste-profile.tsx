import type { UserTasteSummary } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";
import { TasteWheelChart } from "../ui/taste-wheel-chart";

const Empty = () => <span className="text-sm text-muted-foreground">선택 없음</span>;

type TagGroupProps = {
  title: string;
  values: string[];
  variant: "primary" | "neutral" | "lemon";
};

function TagGroup({ title, values, variant }: TagGroupProps) {
  const variantClasses = {
    primary: "bg-[#FFF0E6] text-[#A94417]",
    neutral: "bg-[#F5F0EB] text-[#6E625C]",
    lemon: "bg-[#FFF3CC] text-[#705200]",
  };

  return (
    <div>
      <dt className="text-sm font-semibold text-foreground">{title}</dt>

      <dd className="mt-3">
        {values.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {values.map((value) => (
              <li
                key={value}
                className={`
                  rounded-full px-3 py-1.5
                  text-xs font-semibold
                  ${variantClasses[variant]}
                `}
              >
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </dd>
    </div>
  );
}

export function TasteProfile({ profile }: { profile: UserTasteSummary }) {
  return (
    <section
      aria-labelledby="taste-profile-title"
      className="
        rounded-card border border-border
        bg-surface p-5
        sm:p-7
      "
    >
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-[#B74716]">MY TASTE PROFILE</p>

        <h2 id="taste-profile-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          나의 취향 프로필
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">내가 좋아하는 칵테일의 특징을 한눈에 확인해 보세요.</p>
      </div>

      {/* 취향 원형 차트 */}
      <div className="mt-7 border-b border-border pb-7">
        <TasteWheelChart dimensions={profile.dimensions} />
      </div>

      {/* 취향 점수 */}
      <dl className="mt-7 grid gap-3 sm:grid-cols-2">
        {profile.dimensions.map(({ dimension, score }) => (
          <div key={dimension} className="rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm font-semibold text-foreground">{DIMENSION_LABELS[dimension]}</dt>

              <dd className="text-sm font-bold tabular-nums text-[#B74716]">{score}/5</dd>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 5) * 100}%` }} />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">{SCORE_LABELS[score]}</p>
          </div>
        ))}
      </dl>

      {/* 풍미 및 베이스 */}
      <dl className="mt-7 grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
        <TagGroup title="선호 풍미" values={profile.preferredFlavors.map((value) => FLAVOR_LABELS[value])} variant="primary" />

        <TagGroup title="피하고 싶은 풍미" values={profile.avoidedFlavors.map((value) => FLAVOR_LABELS[value])} variant="neutral" />

        <TagGroup title="선호 베이스" values={profile.preferredBaseSpirits.map((value) => SPIRIT_LABELS[value])} variant="lemon" />
      </dl>
    </section>
  );
}
