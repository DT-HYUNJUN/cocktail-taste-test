import type { MultiQuestion } from "../model/questions";

type MultiChoiceQuestionProps = {
  question: MultiQuestion;
  selections: string[];
  conflictingSelections: string[];
  onToggle: (value: string) => void;
};

export function MultiChoiceQuestion({ question, selections, conflictingSelections, onToggle }: MultiChoiceQuestionProps) {
  const atLimit = question.maxSelections !== undefined && selections.length >= question.maxSelections;

  const countMessage = question.maxSelections === undefined ? `${selections.length}개 선택됨` : `${selections.length}/${question.maxSelections}개 선택됨`;

  const limitMessage = atLimit ? " 최대 선택 개수에 도달해 다른 항목은 선택할 수 없습니다." : "";

  return (
    <div>
      {/* 질문 안내 */}
      <p id="question-help" className="text-sm leading-6 text-muted-foreground">
        {question.description}
      </p>

      {/* 선택 상태 */}
      <div className="mt-3">
        <p id="selection-status" aria-live="polite" className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground">
          {countMessage}
          <span className="sr-only">{limitMessage}</span>
        </p>
      </div>

      {/* 다중 선택 카드 */}
      <fieldset className="mt-6 grid gap-3" aria-describedby="question-help selection-status">
        <legend className="sr-only">{question.title}</legend>

        {question.options.map((option) => {
          const checked = selections.includes(option.id);
          const conflicts = conflictingSelections.includes(option.id);

          const disabled = conflicts || (atLimit && !checked);

          const reason = conflicts ? "선호와 회피에 같은 풍미를 동시에 선택할 수 없어요." : atLimit && !checked ? "최대 선택 개수에 도달했어요." : undefined;

          const reasonId = `${question.id}-${option.id}-reason`;

          return (
            <label
              key={option.id}
              title={reason}
              className={`
                flex min-h-14 items-center gap-4
                rounded-card border px-4 py-3
                transition-colors duration-200
                ${checked ? "border-primary bg-[#FFF0E6]" : "border-border bg-surface"}
                ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/60"}
              `}
            >
              <input
                type="checkbox"
                name={question.id}
                value={option.id}
                checked={checked}
                disabled={disabled}
                aria-describedby={reason ? reasonId : undefined}
                onChange={() => onToggle(option.id)}
                className="size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
              />

              <span className={`text-sm leading-6 text-foreground sm:text-base ${checked ? "font-semibold" : ""}`}>{option.label}</span>

              {reason && (
                <span id={reasonId} className="sr-only">
                  {reason}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
