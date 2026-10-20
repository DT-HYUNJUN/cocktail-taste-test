import type { SingleQuestion } from "../model/questions";

type SingleChoiceQuestionProps = {
  question: SingleQuestion;
  answer?: string;
  onChange: (value: string) => void;
};

export function SingleChoiceQuestion({ question, answer, onChange }: SingleChoiceQuestionProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">{question.title}</legend>
      {question.options.map((option) => {
        const checked = answer === option.id;
        return (
          <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${checked ? "border-amber-700 bg-amber-50 ring-1 ring-amber-700" : "border-stone-300 bg-white hover:border-stone-500"}`}>
            <input type="radio" name={question.id} value={option.id} checked={checked} onChange={() => onChange(option.id)} className="h-4 w-4 accent-amber-700" />
            <span className="leading-6 text-stone-900">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
