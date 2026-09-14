import { createContext, useContext, type ComponentPropsWithRef, type ReactNode } from "react";
import { XCircleIcon } from "@phosphor-icons/react";
import { Badge, Progress } from "./primitives";
import { Plan, PlanContent, PlanTrigger, type WorkDisclosureProps } from "./work";

type DivProps = ComponentPropsWithRef<"div">;
type SpanProps = ComponentPropsWithRef<"span">;
export type TestResultStatus = "passed" | "failed" | "skipped" | "running";
export type TestResultsSummaryData = { passed: number; failed: number; skipped: number; total: number; duration?: number };
type ResultsState = { summary?: TestResultsSummaryData; isStreaming: boolean };
type TestState = { name: string; status: TestResultStatus; duration?: number; error?: string };
const ResultsContext = createContext<ResultsState | null>(null), TestContext = createContext<TestState | null>(null);
function useResults() { const value = useContext(ResultsContext); if (!value) throw new Error("Test Results parts require TestResults."); return value; }
function useTest() { const value = useContext(TestContext); if (!value) throw new Error("Test parts require Test."); return value; }
const labels: Record<TestResultStatus, string> = { passed: "Passed", failed: "Failed", skipped: "Skipped", running: "Running" };
function validCount(value: number) { return Number.isSafeInteger(value) && value >= 0; }
function validSummary(summary?: TestResultsSummaryData) { return !!summary && [summary.passed, summary.failed, summary.skipped, summary.total].every(validCount) && summary.passed + summary.failed + summary.skipped <= summary.total; }
function validDuration(value: number | undefined) { return value !== undefined && Number.isFinite(value) && value >= 0; }
function formatDuration(value: number | undefined) { if (!validDuration(value)) return "Duration unavailable"; return value! < 1000 ? `${value}ms` : `${(value! / 1000).toFixed(value! % 1000 ? 2 : 0)}s`; }

export function TestResults({ summary, isStreaming = false, children, className = "", ...props }: DivProps & { summary?: TestResultsSummaryData; isStreaming?: boolean }) { return <ResultsContext value={{ summary, isStreaming }}><div {...props} className={`hk-test-results ${className}`}>{children}</div></ResultsContext>; }
export function TestSuite({ children, className = "", ...props }: WorkDisclosureProps) { return <Plan {...props} className={`hk-test-suite ${className}`}>{children}</Plan>; }
export function Test({ name, status, duration, error, children, className = "", ...props }: DivProps & TestState & { children?: ReactNode }) { return <TestContext value={{ name, status, duration, error }}><div {...props} className={`hk-test ${className}`}>{children ?? <><TestStatus /><TestName>{name}</TestName><TestDuration />{error && <TestError><TestErrorMessage>{error}</TestErrorMessage></TestError>}</>}</div></TestContext>; }
export function TestResultsHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-test-results-header ${className}`} />; }
export function TestResultsSummary({ className = "", ...props }: DivProps) { const { summary, isStreaming } = useResults(); const valid = validSummary(summary); return <div {...props} className={`hk-test-summary ${className}`} aria-live="polite">{isStreaming && <span className="hk-test-running">Running tests</span>}{valid ? <><span>{summary!.passed} passed</span><span className={summary!.failed ? "hk-test-summary-failed" : undefined}>{summary!.failed > 0 && <XCircleIcon size={16} aria-hidden="true" />}{summary!.failed} failed</span><span>Skipped {summary!.skipped}</span><span>{summary!.total} total</span></> : !isStreaming && <span>Results unavailable</span>}</div>; }
export function TestResultsDuration({ className = "", ...props }: SpanProps) { return <span {...props} className={`hk-test-results-duration ${className}`}>{formatDuration(useResults().summary?.duration)}</span>; }
export function TestResultsProgress({ className = "", ...props }: DivProps) { const { summary, isStreaming } = useResults(); const valid = validSummary(summary) && summary!.total > 0; return <div {...props} data-complete={!isStreaming && valid && summary!.passed + summary!.failed + summary!.skipped === summary!.total || undefined} className={`hk-test-results-progress ${className}`}>{valid ? <Progress label={isStreaming ? "Tests completed" : "Test completion"} value={summary!.passed + summary!.failed + summary!.skipped} max={summary!.total} /> : isStreaming ? <span role="status">Waiting for test results</span> : null}</div>; }
export function TestResultsContent({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-test-results-content ${className}`} />; }
export function TestSuiteName({ children = "Test suite", ...props }: ComponentPropsWithRef<typeof PlanTrigger>) { return <PlanTrigger {...props}>{children}</PlanTrigger>; }
export function TestSuiteStats({ passed = 0, failed = 0, skipped = 0, className = "", ...props }: DivProps & { passed?: number; failed?: number; skipped?: number }) { return <div {...props} className={`hk-test-suite-stats ${className}`}><span aria-label={`${validCount(passed) ? passed : "count unavailable"} tests passed`}>{validCount(passed) ? `${passed} passed` : "Passed unavailable"}</span><span aria-label={`${validCount(failed) ? failed : "count unavailable"} tests failed`}>{validCount(failed) ? `${failed} failed` : "Failed unavailable"}</span><span aria-label={`${validCount(skipped) ? skipped : "count unavailable"} tests skipped`}>{validCount(skipped) ? `${skipped} skipped` : "Skipped unavailable"}</span></div>; }
export function TestSuiteContent({ className = "", ...props }: ComponentPropsWithRef<typeof PlanContent>) { return <PlanContent {...props} className={`hk-test-suite-content ${className}`} />; }
export function TestStatus({ status, className = "", children, ...props }: SpanProps & { status?: TestResultStatus }) { const value = status ?? useTest().status; return <span {...props} className={`hk-test-status hk-test-status-${value} ${className}`} aria-label={labels[value]}>{children ?? labels[value]}</span>; }
export function TestName({ children, className = "", ...props }: SpanProps) { return <span {...props} className={`hk-test-name ${className}`}>{children ?? useTest().name}</span>; }
export function TestDuration({ duration, className = "", ...props }: SpanProps & { duration?: number }) { return <span {...props} className={`hk-test-duration ${className}`}>{formatDuration(duration ?? useTest().duration)}</span>; }
export function TestError({ className = "", ...props }: DivProps) { return <div {...props} role="alert" className={`hk-test-error ${className}`} />; }
export function TestErrorMessage({ children, className = "", ...props }: ComponentPropsWithRef<"p">) { return <p {...props} className={`hk-test-error-message ${className}`}>{children ?? useTest().error ?? "Error details unavailable"}</p>; }
export function TestErrorStack({ children, className = "", ...props }: ComponentPropsWithRef<"pre">) { return <pre {...props} className={`hk-test-error-stack ${className}`}>{children}</pre>; }
