import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FileTree, FileTreeActions, FileTreeFile, FileTreeFolder, FileTreeIcon, FileTreeName } from "./index";

describe("boundaryless file hierarchy", () => {
  test("all six public parts exist, with lists rather than partial tree-widget semantics", () => {
    for (const part of [FileTree, FileTreeFolder, FileTreeFile, FileTreeIcon, FileTreeName, FileTreeActions]) expect(part).toBeTypeOf("function");
    render(<FileTree aria-label="Project files"><FileTreeFolder path="src" name="src"><FileTreeFile path="src/app.tsx" name="app.tsx" /></FileTreeFolder></FileTree>);
    expect(screen.getByRole("list", { name: "Project files" })).toBeVisible();
    expect(screen.queryByRole("tree")).toBeNull();
    expect(screen.queryByRole("button", { name: "app.tsx" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "src" }));
    expect(screen.getByRole("button", { name: "app.tsx" })).toBeVisible();
  });

  test("controlled selection and expansion may be declined without changing supplied sets", () => {
    const expand = vi.fn(); const select = vi.fn(); const expanded = new Set<string>();
    const view = render(<FileTree expanded={expanded} selectedPath={null} onExpandedChange={expand} onSelect={select}><FileTreeFolder path="src" name="src"><FileTreeFile path="src/app" name="app" /></FileTreeFolder></FileTree>);
    fireEvent.click(screen.getByRole("button", { name: "src" }));
    expect(expand).toHaveBeenCalledExactlyOnceWith(new Set(["src"]));
    expect(select).toHaveBeenCalledExactlyOnceWith("src");
    expect(expanded.size).toBe(0);
    expect(screen.getByRole("button", { name: "src" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "src" })).not.toHaveAttribute("aria-current");
    view.rerender(<FileTree expanded={new Set(["src"])} selectedPath="src/app"><FileTreeFolder path="src" name="src"><FileTreeFile path="src/app" name="app" /></FileTreeFolder></FileTree>);
    expect(screen.getByRole("button", { name: "app" })).toHaveAttribute("aria-current", "true");
  });

  test("uncontrolled expansion is copied and nested state survives a parent collapse", () => {
    const initial = new Set(["src"]); const expand = vi.fn((paths: Set<string>) => paths.clear());
    render(<FileTree defaultExpanded={initial} onExpandedChange={expand}><FileTreeFolder path="src" name="src"><FileTreeFolder path="src/ui" name="ui"><FileTreeFile path="src/ui/app" name="app" /></FileTreeFolder></FileTreeFolder></FileTree>);
    fireEvent.click(screen.getByRole("button", { name: "ui" }));
    expect(screen.getByRole("button", { name: "app" })).toBeVisible();
    expect(initial).toEqual(new Set(["src"]));
    fireEvent.click(screen.getByRole("button", { name: "app" }));
    fireEvent.click(screen.getByRole("button", { name: "src" }));
    expect(screen.queryByRole("button", { name: "app" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "src" }));
    expect(screen.getByRole("button", { name: "app" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "ui" })).toHaveAttribute("aria-expanded", "true");
  });

  test("sibling actions do not select, expand or bubble and native disabled controls refuse requests", () => {
    const select = vi.fn(); const expand = vi.fn(); const action = vi.fn(); const bubble = vi.fn(); const submit = vi.fn();
    const content = (disabled = false) => <form onSubmit={event => { event.preventDefault(); submit(); }}><div onClick={bubble}><FileTree disabled={disabled} onSelect={select} onExpandedChange={expand}><FileTreeFolder path="src" name="src" actions={<FileTreeActions><button type="button" onClick={action}>Inspect folder</button></FileTreeActions>} /><FileTreeFile path="readme" name="Readme" actions={<FileTreeActions><button type="button" onClick={action}>Inspect file</button></FileTreeActions>} /></FileTree></div></form>;
    const view = render(content());
    fireEvent.click(screen.getByRole("button", { name: "Inspect folder" }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect file" }));
    expect(action).toHaveBeenCalledTimes(2); expect(select).not.toHaveBeenCalled(); expect(expand).not.toHaveBeenCalled(); expect(bubble).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Readme" })); expect(submit).not.toHaveBeenCalled();
    view.rerender(content(true));
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "src" })); expect(expand).not.toHaveBeenCalled();
  });

  test("native prevention, refs and custom anatomy preserve plain-text names", () => {
    const list = createRef<HTMLUListElement>(); const file = createRef<HTMLButtonElement>(); const select = vi.fn();
    render(<FileTree ref={list} onSelect={select}><FileTreeFile ref={file} path="javascript:opaque-id" name={'<script>not executable</script>'} onClick={event => event.preventDefault()}><FileTreeIcon>◇</FileTreeIcon><FileTreeName>{'<script>not executable</script>'}</FileTreeName></FileTreeFile></FileTree>);
    const button = screen.getByRole("button", { name: "<script>not executable</script>" });
    expect(list.current?.tagName).toBe("UL"); expect(file.current).toBe(button);
    expect(button.querySelector("script")).toBeNull();
    fireEvent.click(button); expect(select).not.toHaveBeenCalled();
  });

  test("disabled action containers block their own handlers and the native first-legend exception", () => {
    const container = vi.fn(); const capture = vi.fn(); const child = vi.fn();
    const view = render(<FileTree disabled><FileTreeFile path="file" name="File" actions={<FileTreeActions onClick={container} onClickCapture={capture}><legend><button type="button" onClick={child}>Legend action</button></legend></FileTreeActions>} /></FileTree>);
    const actions = screen.getByRole("group", { name: "File actions" });
    fireEvent.click(actions); fireEvent.click(screen.getByRole("button", { name: "Legend action" }));
    expect(container).not.toHaveBeenCalled(); expect(capture).not.toHaveBeenCalled(); expect(child).not.toHaveBeenCalled();
    expect(actions).toHaveAttribute("inert");
    view.rerender(<FileTree><FileTreeFile path="file" name="File" actions={<FileTreeActions onClick={container} onClickCapture={capture}><legend><button type="button" onClick={child}>Legend action</button></legend></FileTreeActions>} /></FileTree>);
    fireEvent.click(screen.getByRole("button", { name: "Legend action" }));
    expect(container).toHaveBeenCalledOnce(); expect(capture).toHaveBeenCalledOnce(); expect(child).toHaveBeenCalledOnce();
  });

  test("controlled parent collapse restores displaced focus without stealing external focus", () => {
    const content = (expanded: Set<string>) => <><FileTree expanded={expanded}><FileTreeFolder path="src" name="src"><FileTreeFolder path="src/ui" name="ui"><FileTreeFile path="src/ui/app" name="app" /></FileTreeFolder></FileTreeFolder></FileTree><button>Outside</button></>;
    const view = render(content(new Set(["src", "src/ui"])));
    screen.getByRole("button", { name: "app" }).focus(); view.rerender(content(new Set()));
    expect(screen.getByRole("button", { name: "src" })).toHaveFocus();
    view.rerender(content(new Set(["src", "src/ui"]))); screen.getByRole("button", { name: "Outside" }).focus(); view.rerender(content(new Set()));
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  test("independent roots and keyed remounts do not share selection", () => {
    const content = (identity: number) => <><FileTree key={identity} aria-label="First"><FileTreeFile path="readme" name="First file" /></FileTree><FileTree aria-label="Second"><FileTreeFile path="readme" name="Second file" /></FileTree></>;
    const view = render(content(1)); fireEvent.click(screen.getByRole("button", { name: "First file" }));
    expect(screen.getByRole("button", { name: "First file" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Second file" })).not.toHaveAttribute("aria-current");
    view.rerender(content(2)); expect(screen.getByRole("button", { name: "First file" })).not.toHaveAttribute("aria-current");
  });
});
