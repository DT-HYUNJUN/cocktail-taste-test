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
      <p id="question-help" className="text-center text-sm leading-6 text-muted-foreground">
        {question.description}
      </p>

      {/* 선택 상태 */}
      <div className="mt-3 flex justify-center">
        <p id="selection-status" aria-live="polite" className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-accent-foreground">
          {countMessage}
          <span className="sr-only">{limitMessage}</span>
        </p>
      </div>

      {/* 다중 선택 카드 */}
      <fieldset className="mt-6 grid gap-3 sm:grid-cols-2" aria-describedby="question-help selection-status">
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
                relative flex min-h-16 items-center gap-4
                rounded-card border-2 px-5 py-4
                transition-[border-color,background-color,transform,box-shadow] duration-200
                has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-primary
                ${checked ? "border-primary bg-primary/10 shadow-[0_5px_0_rgba(201,77,61,0.16)]" : "border-border bg-surface"}
                ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/60"}
                motion-reduce:transition-none motion-reduce:hover:translate-y-0
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
                className="sr-only"
              />

              <span className={`flex-1 text-sm leading-6 text-foreground sm:text-base ${checked ? "font-bold" : "font-medium"}`}>{option.label}</span>

              <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-colors ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}>
                ✓
              </span>

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
