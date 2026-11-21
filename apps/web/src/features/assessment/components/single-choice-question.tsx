import type { ScaleAnswerId, SingleQuestion } from "../model/questions";

type SingleChoiceQuestionProps = {
  question: SingleQuestion;
  answer?: string;
  onChange: (value: ScaleAnswerId) => void;
};

export function SingleChoiceQuestion({ question, answer, onChange }: SingleChoiceQuestionProps) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{question.title}</legend>

      {question.options.map((option) => {
        const checked = answer === option.id;

        return (
          <label
            key={option.id}
            className={`
              relative flex min-h-16 cursor-pointer items-center gap-4
              rounded-card border-2 px-5 py-4
              transition-[border-color,background-color,transform,box-shadow] duration-200
              has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-primary
              ${checked ? "border-primary bg-primary/10 shadow-[0_5px_0_rgba(201,77,61,0.16)]" : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/60"}
              motion-reduce:transition-none motion-reduce:hover:translate-y-0
            `}
          >
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={checked}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />

            <span
              className={`
                text-sm leading-6 sm:text-base
                flex-1 ${checked ? "font-bold text-foreground" : "font-medium text-foreground"}
              `}
            >
              {option.label}
            </span>

            <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-colors ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}>
              ✓
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
