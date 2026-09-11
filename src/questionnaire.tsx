import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button, Input } from "./primitives";

export type QuestionnaireAnswers = Record<string, { values: string[]; other?: string }>;
type QuestionItem = {
  id: string;
  question: string;
  options: readonly { value: string; label: string; description?: string }[];
  other?: boolean | { placeholder?: string };
  stepLabel?: string;
  select?: "single" | "multiple";
};
type QuestionnaireProps = {
  questions: readonly QuestionItem[];
  select?: "single" | "multiple";
  answers?: QuestionnaireAnswers;
  defaultAnswers?: QuestionnaireAnswers;
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: (answers: QuestionnaireAnswers) => void;
  onDismiss?: () => void;
  advanceDelay?: number;
  disabled?: boolean;
  labels?: { previous?: string; next?: string; complete?: string; other?: string };
  className?: string;
};

export function Questionnaire({ questions, select = "multiple", answers, defaultAnswers = {}, onAnswersChange, step, defaultStep = 0, onStepChange, onComplete, onDismiss, advanceDelay = 180, disabled = false, labels = {}, className = "" }: QuestionnaireProps) {
  const [localAnswers, setLocalAnswers] = useState(defaultAnswers);
  const [localStep, setLocalStep] = useState(defaultStep);
  const [pending, setPending] = useState<{ question: string; value: string; configuration: string } | null>(null);
  const admittedIntent = useRef<typeof pending>(null);
  const currentAnswers = answers ?? localAnswers;
  const rawStep = step ?? localStep;
  const currentStep = Math.max(0, Math.min(questions.length - 1, Number.isFinite(rawStep) ? Math.trunc(rawStep) : 0));
  const question = questions[currentStep];
  const mode = question?.select ?? select;
  const configuration = JSON.stringify([questions, select]);
  const invalid = new Set(questions.map(item => item.id)).size !== questions.length || questions.some(item => !item.id || new Set(item.options.map(option => option.value)).size !== item.options.length);
  const normalized = Object.fromEntries(questions.map(item => {
    const saved = Object.hasOwn(currentAnswers, item.id) ? currentAnswers[item.id] : undefined;
    const values = item.options.filter(option => saved?.values.includes(option.value)).map(option => option.value);
    const other = item.other && typeof saved?.other === "string" ? saved.other : undefined;
    return [item.id, { values: (item.select ?? select) === "single" ? other !== undefined ? [] : values.slice(0, 1) : values, ...(other !== undefined ? { other } : {}) }];
  }));
  const answer = question ? normalized[question.id] : { values: [] };
  const identity = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const previousQuestion = useRef(question?.id);
  const previousStep = useRef(currentStep);
  const direction = currentStep >= previousStep.current ? 1 : -1;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (previousQuestion.current !== question?.id) heading.current?.focus();
    previousQuestion.current = question?.id;
    previousStep.current = currentStep;
  }, [question?.id, currentStep]);
  const move = (next: number) => {
    if (disabled) return;
    setPending(null);
    if (step === undefined) setLocalStep(next);
    onStepChange?.(next);
  };
  const advance = () => {
    if (disabled || invalid || !question) return;
    setPending(null);
    if (currentStep === questions.length - 1) onComplete?.(normalized);
    else move(currentStep + 1);
  };
  const latestAdvance = useRef(advance);
  latestAdvance.current = advance;
  const admitted = !!pending && pending.question === question?.id && pending.configuration === configuration && mode === "single" && answer.values.length === 1 && answer.values[0] === pending.value && answer.other === undefined;
  useEffect(() => {
    if (pending && (disabled || invalid || pending.question !== question?.id || pending.configuration !== configuration || (!admitted && admittedIntent.current === pending))) setPending(null);
    if (admitted) admittedIntent.current = pending;
    else if (!pending) admittedIntent.current = null;
  }, [pending, admitted, disabled, invalid, question?.id, configuration]);
  useEffect(() => {
    if (!admitted || disabled || invalid) return;
    const timer = setTimeout(() => latestAdvance.current(), Number.isFinite(advanceDelay) ? Math.max(0, advanceDelay) : 180);
    return () => clearTimeout(timer);
  }, [pending, admitted, disabled, invalid, advanceDelay, currentStep]);
  const update = (next: { values: string[]; other?: string }, autoValue?: string) => {
    if (disabled || !question) return;
    const ordered = question.options.filter(option => next.values.includes(option.value)).map(option => option.value);
    const result = { ...normalized, [question.id]: { ...next, values: ordered } };
    if (answers === undefined) setLocalAnswers(result);
    onAnswersChange?.(result);
    setPending(autoValue === undefined ? null : { question: question.id, value: autoValue, configuration });
  };
  const choose = (value: string) => update(mode === "single" ? { values: [value] } : { ...answer, values: answer.values.includes(value) ? answer.values.filter(selected => selected !== value) : [...answer.values, value] }, mode === "single" ? value : undefined);
  const chooseOther = () => update(answer.other === undefined ? { values: mode === "single" ? [] : answer.values, other: "" } : { values: answer.values });

  return <section className={`hk-questionnaire ${className}`} aria-label="Questionnaire" aria-disabled={disabled || undefined} onKeyDown={event => {
    const target = event.target as HTMLElement;
    if (disabled || mode !== "single" || event.defaultPrevented || event.nativeEvent.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || target.matches("textarea, input:not([type=radio]):not([type=checkbox])") || target.isContentEditable) return;
    if (!/^[1-9]$/.test(event.key)) return;
    const option = question?.options[Number(event.key) - 1];
    if (option) { event.preventDefault(); choose(option.value); }
    else if (question?.other && Number(event.key) === question.options.length + 1) { event.preventDefault(); chooseOther(); }
  }}>
    {onDismiss && <Button aria-label="Dismiss questionnaire" disabled={disabled} onClick={onDismiss}>×</Button>}
    {invalid ? <p role="alert">Invalid questionnaire: question IDs and option values must be unique.</p> : !question ? <p role="status">No questions to answer.</p> : <>
      <motion.div layout={!reducedMotion} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
        <motion.div key={question.id} initial={reducedMotion ? false : { opacity: 0, x: direction * 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
          <h3 ref={heading} tabIndex={-1} id={`${identity}-prompt`}>{question.question}</h3>
          <fieldset disabled={disabled} aria-labelledby={`${identity}-prompt`}>
            {question.options.map((option, index) => <label className="hk-questionnaire-option" key={option.value}>
              <input type={mode === "single" ? "radio" : "checkbox"} name={`${identity}-${question.id}`} checked={answer.values.includes(option.value)} onChange={() => choose(option.value)} onClick={() => { if (mode === "single" && answer.values.includes(option.value)) choose(option.value); }} aria-label={option.label} />
              <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
              {mode === "single" && <kbd aria-hidden="true">{index + 1}</kbd>}
            </label>)}
            {question.other && <div className="hk-questionnaire-other">
              <label className="hk-questionnaire-option"><input type={mode === "single" ? "radio" : "checkbox"} name={`${identity}-${question.id}`} checked={answer.other !== undefined} onChange={chooseOther} /><span>{labels.other ?? "Other"}</span>{mode === "single" && <kbd aria-hidden="true">{question.options.length + 1}</kbd>}</label>
              <Input aria-label={`${labels.other ?? "Other"} response`} value={answer.other ?? ""} placeholder={typeof question.other === "object" ? question.other.placeholder : undefined} disabled={disabled} onChange={event => update({ values: mode === "single" ? [] : answer.values, other: event.target.value })} onKeyDown={event => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing && answer.other?.trim()) { event.preventDefault(); advance(); }
              }} />
            </div>}
          </fieldset>
        </motion.div>
      </motion.div>
      <nav aria-label="Question steps">{questions.map((item, index) => <Button key={item.id} disabled={disabled} aria-current={index === currentStep ? "step" : undefined} onClick={() => move(index)}>{item.stepLabel ?? `Step ${index + 1}`}</Button>)}</nav>
      <footer><Button disabled={disabled || currentStep === 0} onClick={() => move(currentStep - 1)}>{labels.previous ?? "Previous"}</Button><Button disabled={disabled || (mode === "single" && answer.other !== undefined && !answer.other.trim())} onClick={advance}>{currentStep === questions.length - 1 ? labels.complete ?? "Done" : labels.next ?? "Next"}</Button></footer>
    </>}
  </section>;
}
