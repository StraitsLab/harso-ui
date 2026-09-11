import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as kit from "./index";

const { TestResults, TestSuite, Test, TestResultsHeader, TestResultsSummary, TestResultsDuration, TestResultsProgress, TestResultsContent, TestSuiteName, TestSuiteStats, TestSuiteContent, TestStatus, TestName, TestDuration, TestError, TestErrorMessage, TestErrorStack } = kit;
const results = { passed: 3, failed: 1, skipped: 1, total: 5, duration: 1250 };
afterEach(() => { vi.useRealTimers(); });

describe("boundaryless test results", () => {
  test("custom result parts replace the default composition without duplicate status or nested names", () => {
    const view = render(<Test name="rejects bad input" status="failed" duration={41}><TestStatus /><TestName /><TestDuration /><TestError><TestErrorMessage>Host failure</TestErrorMessage></TestError></Test>);
    expect(screen.getAllByText("Failed")).toHaveLength(1);
    expect(view.container.querySelectorAll(".hk-test-name")).toHaveLength(1);
    expect(view.container.querySelector(".hk-test > .hk-test-error")).not.toBeNull();
    expect(screen.getByText("41ms")).toBeVisible();
  });
  test("all17 parts compose with refs and explicit status text", () => {
    for (const part of [TestResults, TestSuite, Test, TestResultsHeader, TestResultsSummary, TestResultsDuration, TestResultsProgress, TestResultsContent, TestSuiteName, TestSuiteStats, TestSuiteContent, TestStatus, TestName, TestDuration, TestError, TestErrorMessage, TestErrorStack]) expect(part).toBeTypeOf("function");
    const root = createRef<HTMLDivElement>(), header = createRef<HTMLDivElement>(), content = createRef<HTMLDivElement>();
    render(<TestResults ref={root} summary={results}><TestResultsHeader ref={header}><TestResultsSummary /><TestResultsDuration /><TestResultsProgress /></TestResultsHeader><TestResultsContent ref={content}><TestSuite defaultOpen><TestSuiteName>API suite</TestSuiteName><TestSuiteStats passed={3} failed={1} skipped={1} /><TestSuiteContent><Test name="loads data" status="passed" duration={22} /><Test name="rejects bad input" status="failed" duration={41} error="bad input" /></TestSuiteContent></TestSuite></TestResultsContent></TestResults>);
    expect(root.current?.tagName).toBe("DIV"); expect(header.current?.tagName).toBe("DIV"); expect(content.current?.tagName).toBe("DIV"); expect(screen.getAllByText("3 passed")).toHaveLength(2); expect(screen.getAllByText("1 failed")).toHaveLength(2); expect(screen.getByText("Skipped 1")).toBeVisible(); expect(screen.getAllByText("Passed")).toHaveLength(1); expect(screen.getByText("Failed")).toBeVisible();
  });
  test("counts and progress reject invented data", () => {
    const view = render(<TestResults summary={{ passed: -1, failed: 1.5, skipped: 0, total: 0 }}><TestResultsSummary /><TestResultsProgress /></TestResults>);
    expect(screen.getByText("Results unavailable")).toBeVisible(); expect(screen.queryByRole("progressbar")).toBeNull();
    view.rerender(<TestResults summary={{ passed: 2, failed: 0, skipped: 0, total: 4 }}><TestResultsProgress /></TestResults>); expect(screen.getByRole("progressbar")).toHaveAttribute("value", "2"); expect(screen.getByRole("progressbar")).toHaveAttribute("max", "4");
  });
  test("suite disclosure supports refusal, disabled state and focus recovery", () => {
    const change = vi.fn(); const view = render(<TestSuite open={false} onOpenChange={change}><TestSuiteName>Suite</TestSuiteName><TestSuiteContent>Details</TestSuiteContent></TestSuite>); const trigger = screen.getByRole("button", { name: "Suite" }); fireEvent.click(trigger); expect(change).toHaveBeenCalledWith(true); expect(trigger).toHaveAttribute("aria-expanded", "false");
    view.rerender(<TestSuite defaultOpen><TestSuiteName>Suite</TestSuiteName><TestSuiteContent><button>inside</button></TestSuiteContent></TestSuite>); fireEvent.click(screen.getByRole("button", { name: "Suite" })); screen.getByRole("button", { name: "inside" }).focus(); fireEvent.click(screen.getByRole("button", { name: "Suite" })); expect(screen.getByRole("button", { name: "Suite" })).toHaveFocus();
    view.rerender(<TestSuite disabled defaultOpen><TestSuiteName>Suite</TestSuiteName><TestSuiteContent>Details</TestSuiteContent></TestSuite>); expect(screen.getByRole("button", { name: "Suite" })).toBeDisabled();
  });
  test("duration, status, error and long strings remain truthful", () => {
    render(<><TestStatus status="running" /><TestStatus status="skipped" /><TestDuration duration={0} /><TestDuration duration={NaN} /><TestError><TestErrorMessage>Failure supplied by host</TestErrorMessage><TestErrorStack>at run (/src/test.ts:1:2)</TestErrorStack></TestError><Test name="a very long test name that must wrap without changing its supplied content" status="running" /></>);
    expect(screen.getAllByText("Running")).toHaveLength(2); expect(screen.getByText("Skipped")).toBeVisible(); expect(screen.getByText("0ms")).toBeVisible(); expect(screen.getAllByText("Duration unavailable")).toHaveLength(2); expect(screen.getByText("Failure supplied by host")).toBeVisible(); expect(screen.getByText("at run (/src/test.ts:1:2)")).toBeVisible();
  });
  test("streaming and status are presentation-only, no polling", () => {
    vi.useFakeTimers(); const view = render(<TestResults summary={{ passed: 0, failed: 0, skipped: 0, total: 0 }} isStreaming><TestResultsSummary /><TestResultsProgress /></TestResults>); expect(screen.getByText("Running tests")).toBeVisible(); act(() => vi.advanceTimersByTime(5000)); expect(screen.getByText("Running tests")).toBeVisible(); view.rerender(<TestResults summary={{ passed: 1, failed: 0, skipped: 0, total: 1 }}><TestResultsProgress /></TestResults>); expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
  });
});
