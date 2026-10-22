import type { MultiQuestion } from "../model/questions";

type MultiChoiceQuestionProps = {
  question: MultiQuestion;
  selections: string[];
  conflictingSelections: string[];
  onToggle: (value: string) => void;
};

export function MultiChoiceQuestion({ question, selections, conflictingSelections, onToggle }: MultiChoiceQuestionProps) {
  const atLimit = question.maxSelections !== undefined && selections.length >= question.maxSelections;
  const countMessage = question.maxSelections === undefined
    ? `${selections.length}개 선택됨`
    : `${selections.length}/${question.maxSelections}개 선택됨`;
  const limitMessage = atLimit ? " 최대 선택 개수에 도달해 다른 항목은 선택할 수 없습니다." : "";

  return (
    <>
      <p id="question-help" className="text-sm leading-6 text-stone-600">{question.description}</p>
      <p id="selection-status" className="mt-1 text-sm font-medium text-stone-700" aria-live="polite">{countMessage}{limitMessage}</p>
      <fieldset className="mt-7 grid gap-3" aria-describedby="question-help selection-status">
        <legend className="sr-only">{question.title}</legend>
        {question.options.map((option) => {
          const checked = selections.includes(option.id);
          const conflicts = conflictingSelections.includes(option.id);
          const disabled = conflicts || (atLimit && !checked);
          const reason = conflicts ? "선호와 회피에 같은 풍미를 동시에 선택할 수 없어요." : atLimit && !checked ? "최대 선택 개수에 도달했어요." : undefined;
          return (
            <label key={option.id} title={reason} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${checked ? "border-amber-700 bg-amber-50 ring-1 ring-amber-700" : "border-stone-300 bg-white hover:border-stone-500"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
              <input type="checkbox" name={question.id} value={option.id} checked={checked} disabled={disabled} aria-describedby={reason ? `${question.id}-${option.id}-reason` : undefined} onChange={() => onToggle(option.id)} className="h-4 w-4 accent-amber-700" />
              <span className="leading-6 text-stone-900">{option.label}</span>
              {reason && <span id={`${question.id}-${option.id}-reason`} className="sr-only">{reason}</span>}
            </label>
          );
        })}
      </fieldset>
    </>
  );
}
