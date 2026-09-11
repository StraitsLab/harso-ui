import { expect, test, type Locator } from "@playwright/test";

const families = [
  ["boardui:checkbox", "controls-examples", "ControlsExample", "Checkbox"],
  ["boardui:switch", "controls-examples", "ControlsExample", "Switch"],
  ["boardui:radio", "controls-examples", "ControlsExample", "RadioGroup"],
  ["boardui:button-group", "navigation-examples", "NavigationExample", "ButtonGroup"],
  ["boardui:segmented-control", "navigation-examples", "NavigationExample", "SegmentedControl"],
  ["vercel:snippet", "developer-content-examples", "DeveloperContentExample", "Snippet"],
  ["vercel:package-info", "developer-content-examples", "DeveloperContentExample", "PackageInfo"],
  ["vercel:shimmer", "conversation-examples", "ConversationExample", "Shimmer"],
  ["vercel:terminal", "terminal-examples", "TerminalExample", "Terminal"],
  ["vercel:toolbar", "consumer-readiness-examples", "ToolbarExample", "Toolbar"],
] as const;

const paints = {
  "light/clean": ["rgb(250, 251, 253)", "rgb(32, 36, 42)"],
  "light/cozy": ["rgb(251, 248, 242)", "rgb(48, 43, 37)"],
  "dark/clean": ["rgb(23, 26, 32)", "rgb(238, 240, 245)"],
  "dark/cozy": ["rgb(32, 30, 27)", "rgb(244, 238, 228)"],
};

for (const [familyId, file, exported, component] of families) {
  for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"] as const) for (const width of [390, 1440]) {
    test(`${familyId} supplied native variants ${appearance}/${palette}/${width}`, async ({ page }, info) => {
      const exercised: object[] = [];
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
      await page.goto(`/#${familyId}`);
      await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
      await page.getByLabel("Palette", { exact: true }).selectOption(palette);
      const source = await (await page.request.get("/preview/main.tsx")).text();
      const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
      const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
      const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
      expect(reactUrl).toBeTruthy();
      expect(domUrl).toBeTruthy();
      expect(producerUrl).toBeTruthy();
      await page.evaluate(async ({ reactUrl, domUrl, producerUrl, file, exported, component, palette }) => {
        const React = (await import(reactUrl!)).default;
        const { createRoot } = (await import(domUrl!)).default;
        const Example = (await import(`/preview/${file}.tsx`))[exported];
        const { RadioDot } = await import(`${producerUrl}controls.tsx`);
        function Consumer() {
          const [state, setState] = React.useState("default");
          return React.createElement("section", { "aria-label": "Primitive variant consumer" },
            React.createElement("select", { "aria-label": "Supplied presentation state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
              ...["default", "disabled", "long-content"].map(value => React.createElement("option", { key: value }, value))),
            React.createElement("div", { "data-testid": "primitive-variant-content" }, React.createElement(Example, { component, state, palette }),
              component === "RadioGroup" ? ["md", "sm"].flatMap(size => [false, true].map(selected => React.createElement("div", { key: `${size}-${selected}` },
                React.createElement(RadioDot, { presentation: true, size, selected }), `${size} ${selected ? "selected" : "default"}`))) : null));
        }
        const root = document.createElement("div");
        root.className = "hkl-live-example";
        document.querySelector('[data-testid="live-example"]')!.before(root);
        createRoot(root).render(React.createElement(Consumer));
      }, { reactUrl, domUrl, producerUrl, file, exported, component, palette });
      const fixture = page.getByRole("region", { name: "Primitive variant consumer", exact: true });
      const content = fixture.getByTestId("primitive-variant-content");
      const state = fixture.getByLabel("Supplied presentation state");
      const readPaint = () => content.evaluate(root => {
        const samples: { selector: string; property: string; actual: string; expected: string }[] = [];
        const probe = document.createElement("span");
        root.append(probe);
        const check = (selector: string, property: string, value: string, pseudo?: string) => {
          probe.style.color = value;
          const expected = getComputedStyle(probe).color;
          for (const element of root.querySelectorAll(selector)) {
            samples.push({ selector, property, actual: getComputedStyle(element, pseudo).getPropertyValue(property), expected });
          }
        };
        check(".hk-choice input", "accent-color", "var(--hk-ink)");
        check('.hk-radio-dot--presentation[data-selected="false"]', "border-top-color", "var(--hk-secondary)");
        check('.hk-radio-dot--presentation[data-selected="true"]', "border-top-color", "var(--hk-accent)");
        check('.hk-radio-dot--presentation[data-selected="true"]', "background-color", "var(--hk-accent)", "::after");
        check(".hk-switch input:not(:checked)", "background-color", "var(--hk-hover)");
        check(".hk-switch input:checked", "background-color", "var(--hk-ink)");
        check(".hk-switch input:not(:checked)", "background-color", "var(--hk-secondary)", "::before");
        check(".hk-switch input:checked", "background-color", "var(--hk-inverse)", "::before");
        check(".hk-button-group", "background-color", "var(--hk-hover)");
        check(".hk-selection-item:has(input:checked) > span", "color", "var(--hk-ink)");
        check(".hk-selection-item:not(:has(input:checked)) > span", "color", "var(--hk-secondary)");
        check(".hk-segmented[data-thumb]", "background-color", "var(--hk-surface)", "::before");
        check(".hk-snippet-text,.hk-package-version,.hk-package-description,.hk-terminal-status", "color", "var(--hk-secondary)");
        check(".hk-package-info,.hk-shimmer,.hk-terminal,.hk-toolbar", "color", "var(--hk-ink)");
        check(".hk-terminal", "background-color", "var(--hk-surface)");
        check(".hk-toolbar", "background-color", "color-mix(in srgb, var(--hk-surface) 90%, transparent)");
        probe.remove();
        return samples;
      });
      const inspect = async (scenario: string) => {
        await expect(content).toBeVisible();
        await page.mouse.move(0, 0);
        const paint = await readPaint();
        if (!scenario.startsWith("remove/host-hold=false")) expect(paint.length, scenario).toBeGreaterThan(0);
        expect(paint.filter(sample => sample.actual !== sample.expected), scenario).toEqual([]);
        if (component === "RadioGroup") {
          const dots = await content.locator(".hk-radio-dot--presentation").evaluateAll(elements => elements.map(element => {
            const bounds = element.getBoundingClientRect();
            const pseudo = getComputedStyle(element, "::after");
            const size = element.classList.contains("hk-radio-dot--sm") ? 14 : 18;
            return { size, width: bounds.width, height: bounds.height, selected: element.getAttribute("data-selected") === "true", content: pseudo.content, dotWidth: parseFloat(pseudo.width) };
          }));
          expect(dots).toHaveLength(4);
          for (const dot of dots) {
            expect(dot.width).toBe(dot.size);
            expect(dot.height).toBe(dot.size);
            expect(dot.content).toBe(dot.selected ? '""' : "none");
            if (dot.selected) expect(dot.dotWidth).toBe((dot.size - 2) / 2);
          }
        }
        expect(await page.locator(".hkl-root").evaluate(element => {
          const style = getComputedStyle(element);
          return [style.backgroundColor, style.color];
        })).toEqual(paints[`${appearance}/${palette}`]);
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), scenario).toBe(true);
        const bounds = (await content.boundingBox())!;
        expect.soft(bounds.x, scenario).toBeGreaterThanOrEqual(-1);
        expect.soft(bounds.x + bounds.width, scenario).toBeLessThanOrEqual(width + 1);
        const outside = await content.evaluate(root => Array.from(root.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href]")).filter(element => {
          const box = element.getBoundingClientRect();
          if (box.width <= 2 || box.height <= 2 || element.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
          if (box.left >= -1 && box.right <= innerWidth + 1) return false;
          for (let ancestor = element.parentElement; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
            if (["auto", "scroll"].includes(getComputedStyle(ancestor).overflowX)) return false;
          }
          return true;
        }).map(element => element.getAttribute("aria-label") || element.textContent));
        expect.soft(outside, scenario).toEqual([]);
        exercised.push({ scenario, paint, inputs: await content.locator('input[type="checkbox"],input[type="radio"]').evaluateAll(inputs => inputs.map(node => {
          const input = node as HTMLInputElement;
          return { label: input.getAttribute("aria-label") || input.labels?.[0]?.textContent, checked: input.checked, indeterminate: input.indeterminate, disabled: input.matches(":disabled") };
        })) });
      };
      const set = async (input: Locator, value: boolean) => {
        await expect(input).toBeEnabled();
        await input.setChecked(value);
        await expect(input).toBeChecked({ checked: value });
      };
      const scene = async (label: string) => {
        await inspect(`${label}/default`);
        const checked = await content.locator('input[type="checkbox"],input[type="radio"]').evaluateAll(inputs => inputs.map(node => (node as HTMLInputElement).checked));
        for (const next of ["disabled", "long-content", "default"]) {
          await state.selectOption(next);
          if (next === "disabled" && ["Checkbox", "Switch", "RadioGroup", "ButtonGroup", "SegmentedControl"].includes(component)) {
            for (const input of await content.locator("input").all()) await expect(input).toBeDisabled();
          }
          expect(await content.locator('input[type="checkbox"],input[type="radio"]').evaluateAll(inputs => inputs.map(node => (node as HTMLInputElement).checked))).toEqual(checked);
          await inspect(`${label}/${next}`);
        }
      };
      try {
        if (component === "Checkbox" && appearance === "light" && palette === "clean" && width === 390) {
          await expect(content.locator(".hk-choice input").first()).toBeVisible();
          const mutation = await page.addStyleTag({ content: '[data-testid="primitive-variant-content"] .hk-choice input { accent-color: rgb(1, 2, 3) !important; }' });
          const rejectedPaint = (await readPaint()).filter(sample => sample.actual !== sample.expected);
          expect(rejectedPaint.length).toBeGreaterThan(0);
          await mutation.evaluate(element => element.parentNode!.removeChild(element));
          const overflow = await page.addStyleTag({ content: '[data-testid="primitive-variant-content"] { min-width: 3000px !important; }' });
          const rejectedReflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
          expect(rejectedReflow).toBe(false);
          await overflow.evaluate(element => element.parentNode!.removeChild(element));
          await info.attach("mutation-sensitivity", { body: JSON.stringify({ rejectedPaint, rejectedReflow }), contentType: "application/json" });
          await inspect("mutations-restored");
        }
        if (component === "Checkbox") {
          for (const size of ["small", "medium", "large"]) {
            await content.getByLabel("Control size").selectOption(size);
            for (const notes of [false, true]) for (const research of [false, true]) {
              await set(content.getByRole("checkbox", { name: "Conversation notes" }), notes);
              await set(content.getByRole("checkbox", { name: "Research sources" }), research);
              expect(await content.getByRole("checkbox", { name: "All references" }).evaluate(node => (node as HTMLInputElement).indeterminate)).toBe(notes !== research);
              await scene(`${size}/notes=${notes}/research=${research}`);
            }
          }
        } else if (component === "Switch") {
          for (const size of ["small", "medium", "large"]) {
            await content.getByLabel("Control size").selectOption(size);
            for (const checked of [false, true]) {
              await set(content.getByRole("switch", { name: "Pill switch" }), checked);
              await expect(content.getByRole("switch", { name: "Rectangle switch" })).toBeChecked({ checked });
              await scene(`${size}/${checked}`);
            }
          }
        } else if (["RadioGroup", "ButtonGroup", "SegmentedControl"].includes(component)) {
          const groups = component === "RadioGroup" ? [["Our team", "Everyone"], ["A focused brief", "A full report"]] : component === "ButtonGroup" ? [["Conversation", "Document"]] : [["Overview", "Activity"], ["Comfortable", "Compact"]];
          const combinations = groups.reduce<string[][]>((acc, options) => acc.flatMap(values => options.map(option => [...values, option])), [[]]);
          for (const selected of combinations) for (const mask of component === "ButtonGroup" ? [0, 1, 2, 3] : [0]) {
            for (const label of selected) await set(content.getByRole("radio", { name: label, exact: true }), true);
            if (component === "ButtonGroup") {
              await set(content.getByRole("checkbox", { name: "PDF", exact: true }), !!(mask & 1));
              await set(content.getByRole("checkbox", { name: "Markdown", exact: true }), !!(mask & 2));
            }
            await scene(`${selected.join("+")}/${mask}`);
          }
        } else {
          const labels = component === "Snippet" ? ["Show command prefix", "Prevent copy"] : component === "PackageInfo" ? ["Versions unavailable"] : component === "Shimmer" ? ["Waiting state"] : component === "Terminal" ? ["Streaming", "Disable terminal controls", "Hold clear requests"] : ["Hold toolbar changes", "Disable toolbar"];
          for (const variant of component === "PackageInfo" ? ["major", "minor", "patch", "added", "removed"] : ["default"]) {
            if (component === "PackageInfo") await content.getByLabel("Change type").selectOption(variant);
            for (let mask = 0; mask < 2 ** labels.length; mask++) {
              for (const [index, label] of labels.entries()) await set(content.getByRole("checkbox", { name: label, exact: true }), !!(mask & (1 << index)));
              if (component === "Snippet") await expect(content.locator(".hk-snippet-addon")).toHaveCount(mask & 1 ? 1 : 0);
              if (component === "Shimmer") await expect(content.locator(".hk-shimmer[data-active]")).toHaveCount(mask & 1 ? 2 : 0);
              if (component === "Terminal") await expect(content.locator(".hk-terminal-status")).toHaveText(mask & 1 ? "Streaming" : "Ready");
              await scene(`${variant}/${mask}`);
              if (component === "Toolbar" && !(mask & 2)) {
                await content.getByRole("button", { name: "Remove selection", exact: true }).click();
                await expect(content.getByRole("toolbar")).toBeVisible({ visible: !!(mask & 1) });
                await inspect(`remove/host-hold=${!!(mask & 1)}`);
                if (!(mask & 1)) await content.getByRole("button", { name: "Select sample", exact: true }).click();
              }
            }
          }
        }
        await content.screenshot({ path: info.outputPath("supplied-variants.png"), animations: "disabled" });
        await info.attach("supplied-variants", { path: info.outputPath("supplied-variants.png"), contentType: "image/png" });
        expect(errors).toEqual([]);
      } finally {
        await info.attach("primitive-variant-coverage", { body: JSON.stringify({ familyId, appearance, palette, width, exercised, errors }), contentType: "application/json" });
      }
    });
  }
}
