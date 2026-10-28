import type { ScaleAnswerId, SingleQuestion } from "../model/questions";

type SingleChoiceQuestionProps = {
  question: SingleQuestion;
  answer?: string;
  onChange: (value: ScaleAnswerId) => void;
};

export function SingleChoiceQuestion({ question, answer, onChange }: SingleChoiceQuestionProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">{question.title}</legend>

      {question.options.map((option) => {
        const checked = answer === option.id;

        return (
          <label
            key={option.id}
            className={`
              flex min-h-14 cursor-pointer items-center gap-4
              rounded-card border px-4 py-3
              transition-colors duration-200
              ${checked ? "border-primary bg-[#FFF0E6]" : "border-border bg-surface hover:border-primary/60"}
            `}
          >
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={checked}
              onChange={() => onChange(option.id)}
              className="
                size-5 shrink-0 cursor-pointer appearance-none
                rounded-full border border-stone-400 bg-white
                transition-colors
                checked:border-[5px] checked:border-primary
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary
                focus-visible:ring-offset-2
              "
            />

            <span
              className={`
                text-sm leading-6 sm:text-base
                ${checked ? "font-semibold text-foreground" : "text-foreground"}
              `}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
