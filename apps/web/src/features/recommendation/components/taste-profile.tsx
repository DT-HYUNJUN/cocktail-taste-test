import type { UserTasteSummary } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";

const Empty = () => <span className="text-stone-500">선택 없음</span>;

export function TasteProfile({ profile }: { profile: UserTasteSummary }) {
  return (
    <section aria-labelledby="taste-profile-title" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 id="taste-profile-title" className="text-2xl font-semibold text-stone-950">나의 취향 프로필</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {profile.dimensions.map(({ dimension, score }) => (
          <div key={dimension} className="rounded-xl bg-amber-50 p-4">
            <dt className="text-sm font-medium text-stone-600">{DIMENSION_LABELS[dimension]}</dt>
            <dd className="mt-1 font-semibold text-stone-950">{SCORE_LABELS[score]} · {score}/5</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-6 grid gap-5 sm:grid-cols-3">
        <div><dt className="text-sm font-semibold text-stone-900">선호 풍미</dt><dd className="mt-2 text-sm text-stone-700">{profile.preferredFlavors.length ? profile.preferredFlavors.map((value) => FLAVOR_LABELS[value]).join(" · ") : <Empty />}</dd></div>
        <div><dt className="text-sm font-semibold text-stone-900">피하고 싶은 풍미</dt><dd className="mt-2 text-sm text-stone-700">{profile.avoidedFlavors.length ? profile.avoidedFlavors.map((value) => FLAVOR_LABELS[value]).join(" · ") : <Empty />}</dd></div>
        <div><dt className="text-sm font-semibold text-stone-900">선호 베이스</dt><dd className="mt-2 text-sm text-stone-700">{profile.preferredBaseSpirits.length ? profile.preferredBaseSpirits.map((value) => SPIRIT_LABELS[value]).join(" · ") : <Empty />}</dd></div>
      </dl>
    </section>
  );
}
