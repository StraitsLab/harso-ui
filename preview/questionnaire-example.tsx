import { useState } from "react";
import { Button, Questionnaire, Select, type QuestionnaireAnswers } from "@harso/ui";
import type { ExampleState } from "./examples";

export function QuestionnaireExample({ state }: { state: ExampleState }) {
  const [mode, setMode] = useState("mixed");
  const [result, setResult] = useState<QuestionnaireAnswers | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const questions = [
    { id: "tools", question: state === "long-content" ? "Which capabilities should Harso use to investigate your project and prepare a clear, source-backed result for your review?" : "What should Harso help with?", stepLabel: "Capabilities", options: [{ value: "research", label: "Research", description: "Find and compare sources." }, { value: "code", label: "Code", description: "Prepare changes for review." }], other: { placeholder: "Something else in mind?" } },
    { id: "delivery", question: "How would you like the result?", stepLabel: "Delivery", select: mode === "mixed" ? "single" as const : undefined, options: [{ value: "summary", label: "A concise summary" }, { value: "detailed", label: "A detailed walkthrough" }], other: true }
  ];
  return <div className="hk-questionnaire-example">
    <label>Selection mode<Select aria-label="Selection mode" value={mode} onChange={event => { setMode(event.target.value); setResult(null); }}><option value="mixed">Mixed</option><option value="multiple">Multiple</option><option value="single">Single</option><option value="empty">Empty</option></Select></label>
    {dismissed ? <Button onClick={() => setDismissed(false)}>Reopen questionnaire</Button> : <Questionnaire key={mode} questions={mode === "empty" ? [] : state === "error" ? [questions[0], questions[0]] : questions} select={mode === "single" ? "single" : "multiple"} disabled={state === "disabled"} onComplete={setResult} onDismiss={() => setDismissed(true)} />}
    {result && <output aria-label="Submitted answers">{JSON.stringify(result)}</output>}
  </div>;
}
