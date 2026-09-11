import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock, CodeBlockContainer, CodeBlockHeader, CodeBlockContent, CodeBlockLanguageSelector, CodeBlockLanguageSelectorContent, CodeBlockLanguageSelectorItem, CodeBlockLanguageSelectorTrigger, CodeBlockLanguageSelectorValue } from "./code-block";

vi.mock("shiki", async importOriginal => {
  const actual = await importOriginal<typeof import("shiki")>();
  return { ...actual, codeToTokens: vi.fn(actual.codeToTokens) };
});

describe("CodeBlock", () => {
  it("renders standalone content and honors direct overrides without duplicate nested bodies", async () => {
    const source = "const direct = 42;\r\n";
    const { rerender } = render(<CodeBlockContent code={source} language="typescript" showLineNumbers />);
    await waitFor(() => expect(document.querySelector(".hk-code-token")).not.toBeNull());
    expect(screen.getByRole("code").textContent).toBe(source);
    expect(document.querySelectorAll(".hk-code-line-number")).toHaveLength(2);
    rerender(<CodeBlock code="parent" language="typescript" showLineNumbers><CodeBlockContainer><CodeBlockContent code="" language="" showLineNumbers={false} /></CodeBlockContainer></CodeBlock>);
    expect(screen.getAllByRole("code")).toHaveLength(1);
    expect(screen.getByRole("code").textContent).toBe("");
    expect(document.querySelector(".hk-code-line-number")).toBeNull();
    expect(document.querySelector(".hk-code-token")).toBeNull();
    rerender(<CodeBlock code="parent"><CodeBlockContainer><CodeBlockContent code={source} /></CodeBlockContainer></CodeBlock>);
    expect(screen.getAllByRole("code")).toHaveLength(1);
    expect(screen.getByRole("code").textContent).toBe(source);
    rerender(<CodeBlock code="parent"><CodeBlockHeader>Header only</CodeBlockHeader></CodeBlock>);
    expect(screen.getAllByRole("code")).toHaveLength(1);
    expect(screen.getByRole("code")).toHaveTextContent("parent");
  });
  it("optimizes container visibility while preserving caller styles", () => {
    const { container, rerender } = render(<CodeBlockContainer style={{ color: "red" }}>Source</CodeBlockContainer>);
    expect((container.firstChild as HTMLElement).style.contentVisibility).toBe("auto");
    expect((container.firstChild as HTMLElement).style.color).toBe("red");
    rerender(<CodeBlockContainer style={{ contentVisibility: "visible" }}>Source</CodeBlockContainer>);
    expect((container.firstChild as HTMLElement).style.contentVisibility).toBe("visible");
  });
  it("composes a default value and honors prevented item actions", () => {
    const change = vi.fn();
    render(<CodeBlockLanguageSelector value="ts" onValueChange={change}><CodeBlockLanguageSelectorTrigger><CodeBlockLanguageSelectorValue /></CodeBlockLanguageSelectorTrigger><CodeBlockLanguageSelectorContent><CodeBlockLanguageSelectorItem value="js" onClick={event => event.preventDefault()}>JavaScript</CodeBlockLanguageSelectorItem></CodeBlockLanguageSelectorContent></CodeBlockLanguageSelector>);
    fireEvent.click(screen.getByRole("button", { name: "ts" }));
    fireEvent.click(screen.getByRole("option", { name: "JavaScript" }));
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeVisible();
  });
  it("does not let a late tokenizer result replace newer plain text", async () => {
    const shiki = await import("shiki");
    const result = await shiki.codeToTokens("const old = 1", { lang: "typescript", themes: { light: "github-light", dark: "github-dark" } });
    let finish!: (value: typeof result) => void;
    const tokenize = vi.spyOn(shiki, "codeToTokens").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    try {
      const { rerender } = render(<CodeBlock code="const old = 1" language="typescript" />);
      await waitFor(() => expect(tokenize).toHaveBeenCalled());
      rerender(<CodeBlock code={"New plain text\r\n"} />);
      await act(async () => { finish(result); });
      expect(screen.getByRole("code").textContent).toBe("New plain text\r\n");
      expect(document.querySelector(".hk-code-token")).toBeNull();
    } finally { tokenize.mockRestore(); }
  });

  it("keeps unknown language source readable and exact", async () => {
    const source = "\t<unknown>\r\n\r\n";
    render(<CodeBlock code={source} language="not-a-real-language" />);
    await waitFor(() => expect(document.querySelector(".hk-code-token")).not.toBeNull());
    expect(screen.getByRole("code").textContent).toBe(source);
  });

  function LanguageExample({ disabled = false, onValueChange = vi.fn() }: { disabled?: boolean; onValueChange?: (value: string) => void }) {
    return <CodeBlock code="value" disabled={disabled}><CodeBlockLanguageSelector value="ts" onValueChange={onValueChange}><CodeBlockLanguageSelectorTrigger aria-label="Language" /><CodeBlockLanguageSelectorContent><CodeBlockLanguageSelectorItem value="ts">TypeScript</CodeBlockLanguageSelectorItem><CodeBlockLanguageSelectorItem value="py" disabled>Python</CodeBlockLanguageSelectorItem><CodeBlockLanguageSelectorItem value="js">JavaScript</CodeBlockLanguageSelectorItem></CodeBlockLanguageSelectorContent></CodeBlockLanguageSelector></CodeBlock>;
  }

  it("opens into selected option, navigates enabled options, dismisses and restores focus", () => {
    render(<LanguageExample />);
    const trigger = screen.getByRole("button", { name: "Language" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "TypeScript" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "JavaScript" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("preserves host refusal and dismisses outside without stealing focus", () => {
    const change = vi.fn();
    render(<><LanguageExample onValueChange={change} /><button>Outside</button></>);
    const trigger = screen.getByRole("button", { name: "Language" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "JavaScript" }));
    expect(change).toHaveBeenCalledWith("js");
    fireEvent.click(trigger);
    expect(screen.getByRole("option", { name: "TypeScript" })).toHaveAttribute("aria-selected", "true");
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    fireEvent.pointerDown(outside);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(outside).toHaveFocus();
  });

  it("inherits disabled state and closes an already open selector", () => {
    const { rerender } = render(<LanguageExample />);
    fireEvent.click(screen.getByRole("button", { name: "Language" }));
    rerender(<LanguageExample disabled />);
    expect(screen.getByRole("button", { name: "Language" })).toBeDisabled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("highlights real language tokens while preserving exact source", async () => {
    const source = 'const answer = "<script>";\r\n\r\n';
    render(<CodeBlock code={source} language="typescript" showLineNumbers />);
    await waitFor(() => expect(document.querySelectorAll(".hk-code-token").length).toBeGreaterThan(1));
    expect(screen.getByRole("code").textContent).toBe(source);
    expect(document.querySelector("code script")).toBeNull();
    expect(new Set(Array.from(document.querySelectorAll<HTMLElement>(".hk-code-token")).map(token => token.style.color)).size).toBeGreaterThan(1);
  });

  it("retains its body when only a custom header is supplied", () => {
    render(<CodeBlock code="const answer = 42"><CodeBlockHeader>answer.ts</CodeBlockHeader></CodeBlock>);
    expect(screen.getByRole("code")).toHaveTextContent("const answer = 42");
  });

  it("does not duplicate explicitly composed content", () => {
    render(<CodeBlock code="answer"><CodeBlockContainer><CodeBlockContent /></CodeBlockContainer></CodeBlock>);
    expect(screen.getAllByRole("code")).toHaveLength(1);
  });

  it("supports extracted body components and isolates nested code blocks", () => {
    function Body() { return <CodeBlockContent />; }
    const { rerender } = render(<CodeBlock code="outer"><Body /></CodeBlock>);
    expect(screen.getAllByRole("code")).toHaveLength(1);
    rerender(<CodeBlock code="outer"><CodeBlock code="inner"><CodeBlockContent /></CodeBlock></CodeBlock>);
    expect(screen.getAllByRole("code").map(element => element.textContent).sort()).toEqual(["inner", "outer"]);
  });

  it("skips choices inside hidden ancestors", () => {
    render(<CodeBlockLanguageSelector value="js"><CodeBlockLanguageSelectorTrigger aria-label="Language" /><CodeBlockLanguageSelectorContent><div hidden><CodeBlockLanguageSelectorItem value="ts">TypeScript</CodeBlockLanguageSelectorItem></div><CodeBlockLanguageSelectorItem value="js">JavaScript</CodeBlockLanguageSelectorItem></CodeBlockLanguageSelectorContent></CodeBlockLanguageSelector>);
    fireEvent.click(screen.getByRole("button", { name: "Language" }));
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(screen.getByRole("option", { name: "JavaScript" })).toHaveFocus();
  });

  it("preserves blank lines, CRLF, tabs and trailing newline exactly", () => {
    const source = "\tconst answer = 42;\r\n\r\n\t\r\n";
    render(<CodeBlock code={source} />);
    expect(screen.getByRole("code").textContent).toBe(source);
  });

  it("keeps code inert and can show line numbers", () => {
    render(<CodeBlock code={'<script>alert(1)</script>\nconst value = 1'} showLineNumbers><CodeBlockContent /></CodeBlock>);
    expect(screen.getByRole("code").textContent).toContain("<script>alert(1)</script>");
    expect(document.querySelector('.hk-code-line-number[data-line-number="1"]')).toBeTruthy();
  });

  it("supports host-controlled language selection", () => {
    render(<CodeBlock code="value" language="ts"><CodeBlockLanguageSelector value="ts"><CodeBlockLanguageSelectorTrigger aria-label="Language" /><CodeBlockLanguageSelectorContent><CodeBlockLanguageSelectorItem value="ts">TypeScript</CodeBlockLanguageSelectorItem><CodeBlockLanguageSelectorItem value="js">JavaScript</CodeBlockLanguageSelectorItem></CodeBlockLanguageSelectorContent></CodeBlockLanguageSelector></CodeBlock>);
    fireEvent.click(screen.getByRole("button", { name: /Language/ }));
    expect(screen.getByRole("button", { name: /Language/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "TypeScript" })).toHaveAttribute("aria-selected", "true");
  });
});
