import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Packet 5c: status, progress, image, video poster and map blocks render as themselves in the inline output card.
// Fixture documents carry the B0 v4 master data (preview/output-card.tsx); the fixture's media host serves local
// drawings and drawn map tiles, so nothing here reaches the network. `state=` sets the first block's host state.
const fixture = "/preview/output-card.html";
const card = (page: Page) => page.locator(".hkc-output-card");
const callbacks = async (page: Page) => JSON.parse(await page.getByLabel("Fixture callbacks").innerText());
const open = async (page: Page, query: string, width = 560) => {
  await page.setViewportSize({ width, height: 1000 });
  // `imgslow=1` points the image at this path, which never answers: the frame stays in its loading state.
  await page.route("**/__never__/**", () => {});
  await page.goto(`${fixture}?${query}`);
  await expect(card(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

/** Text boxes that overlap, anything drawn outside the card, and any border (the card allows none). */
async function geometry(page: Page) {
  return card(page).evaluate(root => {
    const cardBox = root.getBoundingClientRect();
    const texts = [...root.querySelectorAll(".hkc-output-status-line > span, .hkc-output-status-step > span, .hkc-output-progress-head > span, .hkc-output-progress-note, .hkc-output-map-label, .hkc-output-map-attribution, .hkc-output-video-length, .hkc-output-block-note, .hkc-output-block-failed-text > *, .hkc-output-card-title")]
      .filter(node => !node.classList.contains("hkc-output-status-dot") && !node.classList.contains("hkc-output-status-ring"))
      .map(node => ({ text: node.textContent, box: node.getBoundingClientRect() }));
    const overlaps = texts.flatMap((a, i) => texts.slice(i + 1).filter(b => a.box.width && b.box.width && a.box.left < b.box.right - .5 && a.box.right > b.box.left + .5 && a.box.top < b.box.bottom - .5 && a.box.bottom > b.box.top + .5)
      .map(b => `${a.text} × ${b.text}`));
    const outside = [...root.querySelectorAll(".hkc-output-status, .hkc-output-progress, .hkc-output-media, .hkc-output-map, .hkc-output-map-label, .hkc-output-map-attribution, .hkc-output-block-retry")]
      .map(node => ({ node, box: node.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && (box.left < cardBox.left - .5 || box.right > cardBox.right + .5 || box.top < cardBox.top - .5 || box.bottom > cardBox.bottom + .5))
      .map(({ node }) => node.getAttribute("class"));
    const bordered = [root, ...root.querySelectorAll("*")].flatMap(node => {
      const s = getComputedStyle(node);
      return ["top", "right", "bottom", "left"].filter(side => s.getPropertyValue(`border-${side}-style`) !== "none" && parseFloat(s.getPropertyValue(`border-${side}-width`)) > 0).map(side => `${node.getAttribute("class")} ${side}`);
    });
    return { overlaps, outside, bordered };
  });
}

/** WCAG contrast of a paint (`color`, `backgroundColor`, or the colour in `boxShadow`) against a background element's fill. */
async function contrast(page: Page, selector: string, property: "color" | "backgroundColor" | "boxShadow", against = ".hkc-output-card") {
  return page.evaluate(([selector, property, against]) => {
    const root = document.querySelector(".hkc-output-card")!;
    const toRgb = (value: string) => { const probe = document.createElement("i"); probe.style.color = value; root.append(probe); const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1; const ctx = canvas.getContext("2d")!; ctx.fillStyle = getComputedStyle(probe).color; ctx.fillRect(0, 0, 1, 1); probe.remove(); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    return [...document.querySelectorAll(selector)].map(node => {
      let paint = (getComputedStyle(node) as unknown as Record<string, string>)[property];
      if (property === "boxShadow") paint = /(?:rgba?|color|oklab|oklch)\([^)]*\)|#[0-9a-f]+/i.exec(paint)![0];
      const back = node.closest(against) ?? root;
      const [a, b] = [lum(toRgb(paint)), lum(toRgb(getComputedStyle(back).backgroundColor))].sort((x, y) => y - x);
      return Math.round((a + .05) / (b + .05) * 100) / 100;
    });
  }, [selector, property, against] as const);
}

const axe = async (page: Page) => (await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations;

for (const mode of ["light", "dark"] as const) {
  test(`status ${mode}: meaning dot and word, detail, timed steps on one rail; four meanings in token colours, problem amber; axe clean`, async ({ page }) => {
    await open(page, `doc=status&mode=${mode}&width=512`);
    const status = card(page).locator(".hkc-output-status");
    await expect(status.locator(".hkc-output-status-line")).toHaveText("Working · Boarding · gate C19");
    await expect(status.getByRole("list", { name: "Next" }).getByRole("listitem")).toHaveText(["Doors close08:20", "Departs08:35"]);
    // Dot, rail and rings share one vertical axis (±0.5px); each time is right-aligned to the card's content edge.
    const axis = await status.evaluate(root => {
      const centre = (node: Element) => { const r = node.getBoundingClientRect(); return r.left + r.width / 2; };
      const rails = [...root.querySelectorAll(".hkc-output-status-step")].map(step => { const s = getComputedStyle(step, "::before"); return step.getBoundingClientRect().left + parseFloat(s.left) + parseFloat(s.width) / 2; });
      return { dot: centre(root.querySelector(".hkc-output-status-dot")!), rings: [...root.querySelectorAll(".hkc-output-status-ring")].map(centre), rails,
        times: [...root.querySelectorAll(".hkc-output-status-step-time")].map(node => node.getBoundingClientRect().right), edge: root.getBoundingClientRect().right };
    });
    for (const x of [...axis.rings, ...axis.rails]) expect(Math.abs(x - axis.dot)).toBeLessThanOrEqual(.5);
    for (const right of axis.times) expect(Math.abs(right - axis.edge)).toBeLessThanOrEqual(.5);
    for (const ratio of await contrast(page, ".hkc-output-status-word, .hkc-output-status-detail, .hkc-output-status-step > span:not([aria-hidden])", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    for (const ratio of await contrast(page, ".hkc-output-status-ring", "boxShadow")) expect(ratio).toBeGreaterThanOrEqual(3);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect(await axe(page)).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-status-${mode}.png`, { animations: "disabled" });

    await open(page, `doc=meanings&mode=${mode}&width=512`);
    const words = card(page).locator(".hkc-output-status");
    await expect(words.locator(".hkc-output-status-word")).toHaveText(["Done", "Working", "Needs you"]);
    const colours = await words.evaluateAll(nodes => nodes.map(node => getComputedStyle(node.querySelector(".hkc-output-status-word")!).color));
    expect(new Set(colours).size).toBe(3);
    const tokens = await card(page).evaluate(root => ["--hk-positive", "--hk-accent", "--hk-attention", "--hk-negative"].map(name => { const probe = document.createElement("i"); probe.style.color = `var(${name})`; root.append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; }));
    expect(colours).toEqual(tokens.slice(0, 3));
    const problem = card(page).locator("[data-meaning=problem] .hkc-output-block-failed-glyph");
    expect(await problem.evaluate(node => getComputedStyle(node).color)).toBe(tokens[2]);
    expect(await problem.evaluate(node => getComputedStyle(node).color)).not.toBe(tokens[3]);
    for (const ratio of await contrast(page, ".hkc-output-status-word, .hkc-output-block-failed-message", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(await axe(page)).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-status-meanings-${mode}.png`, { animations: "disabled" });
  });

  test(`progress ${mode}: spent of target, bar to scale, the remainder in words; over budget is amber and full; axe clean`, async ({ page }) => {
    await open(page, `doc=progress&mode=${mode}&width=512`);
    const progress = card(page).locator(".hkc-output-progress");
    await expect(progress.locator(".hkc-output-progress-head")).toHaveText("Spent of budgetS$4,280 of S$5,000");
    await expect(progress.locator(".hkc-output-progress-note")).toHaveText("86% used · S$720 left");
    const [track, fill] = await Promise.all([progress.locator(".hkc-output-progress-track").boundingBox(), progress.locator(".hkc-output-progress-fill").boundingBox()]);
    expect(fill!.width / track!.width).toBeCloseTo(.856, 2);
    expect(track!.height).toBe(6);
    await expect(progress.getByRole("meter", { name: "Spent of budget" })).toHaveAttribute("aria-valuetext", "S$4,280 of S$5,000, 86%");
    for (const ratio of await contrast(page, ".hkc-output-progress-label, .hkc-output-progress-value, .hkc-output-progress-note", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    for (const ratio of await contrast(page, ".hkc-output-progress-fill", "backgroundColor")) expect(ratio).toBeGreaterThanOrEqual(3);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect(await axe(page)).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-progress-${mode}.png`, { animations: "disabled" });

    await open(page, `doc=over&mode=${mode}&width=512`);
    await expect(card(page).locator(".hkc-output-progress-note")).toHaveText("126% used · over by S$310");
    const over = card(page).locator(".hkc-output-progress-fill");
    expect((await over.boundingBox())!.width).toBeCloseTo((await card(page).locator(".hkc-output-progress-track").boundingBox())!.width, 0);
    for (const ratio of await contrast(page, ".hkc-output-progress-fill", "backgroundColor")) expect(ratio).toBeGreaterThanOrEqual(3);
  });

  test(`image ${mode}: the picture at its aspect with alt; loading shimmer; a failed load offers a working Try again; axe clean`, async ({ page }) => {
    await open(page, `doc=image&mode=${mode}&width=512`);
    const frame = card(page).locator(".hkc-output-media");
    await expect(frame).toHaveAttribute("data-state", "ready");
    const box = (await frame.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1, 2);
    await expect(frame.getByRole("img", { name: /Crumb & Co logo/ })).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-image-${mode}.png`, { animations: "disabled" });

    await open(page, `doc=deck&mode=${mode}&width=512`);
    const deck = (await card(page).locator(".hkc-output-media").boundingBox())!;
    expect(deck.width / deck.height).toBeCloseTo(16 / 9, 1);

    await open(page, `doc=image&mode=${mode}&width=512&imgslow=1`);
    await expect(card(page).locator(".hkc-output-media")).toHaveAttribute("data-state", "loading");
    await expect(card(page).locator(".hkc-output-media")).toHaveAttribute("aria-busy", "true");
    expect(await card(page).locator(".hkc-output-media").evaluate(node => getComputedStyle(node, "::after").animationName)).toBe("hkc-media-shimmer");

    await open(page, `doc=image&mode=${mode}&width=512&imgfail=1`);
    const failed = card(page).locator(".hkc-output-block-failed");
    await expect(failed.locator(".hkc-output-block-failed-message")).toHaveText("Couldn’t load the image");
    const retry = failed.getByRole("button", { name: "Try again" });
    expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(28);
    await retry.click();
    await expect(card(page).locator(".hkc-output-block-failed")).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test(`video ${mode}: a poster with its duration that opens the file once per click; never a player; axe clean`, async ({ page }) => {
    await open(page, `doc=video&mode=${mode}&width=512`);
    await expect(card(page).locator("video")).toHaveCount(0);
    const poster = card(page).getByRole("button", { name: "Open video: Walkthrough of the new kitchen, 1:35" });
    await expect(poster).toBeVisible();
    await expect(poster.locator(".hkc-output-video-length")).toHaveText("1:35");
    const box = (await poster.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
    for (const ratio of await contrast(page, ".hkc-output-video-length", "color", ".hkc-output-video-length")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(await axe(page)).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-video-${mode}.png`, { animations: "disabled" });
    await poster.focus();
    await page.keyboard.press("Enter");
    await poster.click();
    expect((await callbacks(page)).opened).toEqual(["artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01", "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01"]);
  });

  test(`map ${mode}: every place pinned inside, the pick larger and always labelled, no label overlaps another, only the pick's may cover a pin, attribution >= 4.5:1; axe clean`, async ({ page }) => {
    for (const [doc, width] of [["map", 512], ["map", 320], ["tampines", 512], ["tampines", 320]] as const) {
      await open(page, `doc=${doc}&mode=${mode}&width=${width}`, width + 48);
      const plane = card(page).locator(".hkc-output-map-plane");
      const planeBox = (await plane.boundingBox())!;
      const pins = await plane.locator(".hkc-output-map-pin").evaluateAll(nodes => nodes.map(node => ({ box: node.getBoundingClientRect().toJSON(), selected: node.hasAttribute("data-selected") })));
      expect(pins.length).toBe(doc === "map" ? 3 : 12);
      expect(pins.filter(pin => pin.selected)).toHaveLength(1);
      for (const { box } of pins) {
        expect(box.left).toBeGreaterThanOrEqual(planeBox.x); expect(box.right).toBeLessThanOrEqual(planeBox.x + planeBox.width);
        expect(box.top).toBeGreaterThanOrEqual(planeBox.y); expect(box.bottom).toBeLessThanOrEqual(planeBox.y + planeBox.height);
      }
      const labels = await plane.locator(".hkc-output-map-label").evaluateAll(nodes => nodes.map(node => ({ box: node.getBoundingClientRect().toJSON(), clipped: node.scrollWidth > node.clientWidth + .5, selected: node.hasAttribute("data-selected") })));
      expect(labels.filter(label => label.selected)).toHaveLength(1);
      for (const [index, label] of labels.entries()) {
        expect(label.clipped).toBe(false);
        // Labels never touch each other; only the pick's label may cover another pin, when nothing else fits.
        for (const other of [...labels.slice(index + 1).map(l => l.box), ...(label.selected ? [] : pins.map(p => p.box))]) {
          const hit = label.box.left < other.right - .5 && label.box.right > other.left + .5 && label.box.top < other.bottom - .5 && label.box.bottom > other.top + .5;
          expect(hit).toBe(false);
        }
      }
      await expect(card(page).locator(".hkc-output-map-attribution")).toHaveText("© OpenStreetMap contributors");
      for (const ratio of await contrast(page, ".hkc-output-map-attribution, .hkc-output-map-label", "color", ".hkc-output-map-attribution, .hkc-output-map-label")) expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(await plane.locator("img.hkc-output-map-tile").evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).src.startsWith("data:image/svg")))).toBe(true);
      expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
      expect(await axe(page)).toEqual([]);
      if (doc === "map" && width === 512) await expect(card(page)).toHaveScreenshot(`output-map-${mode}.png`, { animations: "disabled" });
    }
  });

  for (const doc of ["status", "progress", "image", "video", "map"] as const) {
    test(`${doc} ${mode}: loading, empty, partial, stale and failed draw as B0; failed is amber with a 28px Try again`, async ({ page }) => {
      for (const state of ["loading", "empty", "partial", "stale", "failed"] as const) {
        await open(page, `doc=${doc}&state=${state}&mode=${mode}&width=512`);
        const block = card(page).locator(`[data-state=${state}]`).first();
        await expect(block).toBeVisible();
        if (state === "loading") await expect(block).toHaveAttribute("aria-busy", "true");
        if (state === "partial" || state === "stale") await expect(card(page).locator(".hkc-output-block-note")).toBeVisible();
        if (state === "failed") {
          expect(await block.locator(".hkc-output-block-failed-glyph").evaluate(node => getComputedStyle(node).color))
            .toBe(await card(page).evaluate(root => { const probe = document.createElement("i"); probe.style.color = "var(--hk-attention)"; root.append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; }));
          const retry = block.getByRole("button", { name: "Try again" });
          expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(28);
          await retry.click();
          expect((await callbacks(page)).retried).toBe(1);
        }
        for (const ratio of await contrast(page, ".hkc-output-block-note, .hkc-output-block-failed-reason, .hkc-output-block-failed-message", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
        expect(await axe(page)).toEqual([]);
      }
    });
  }
}

test("reduced motion: the image shimmer stops; forced colors keep dot, bar and pins visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "doc=image&imgslow=1&width=512");
  expect(await card(page).locator(".hkc-output-media").evaluate(node => getComputedStyle(node, "::after").animationName)).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  for (const [doc, selector] of [["status", ".hkc-output-status-dot"], ["progress", ".hkc-output-progress-fill"], ["map", ".hkc-output-map-pin"]] as const) {
    await open(page, `doc=${doc}&width=512`);
    const colour = await card(page).locator(selector).first().evaluate(node => getComputedStyle(node).backgroundColor);
    const back = await card(page).evaluate(node => getComputedStyle(node).backgroundColor);
    expect(colour).not.toBe(back);
  }
});

for (const width of [320, 420]) {
  test(`hostile content at ${width}px: long, CJK, RTL and emoji text stays inside every new block`, async ({ page }) => {
    await open(page, `doc=hostilemedia&width=${width}`, width + 48);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await axe(page)).toEqual([]);
  });
}

// ---- rework round 1 (fix base 2410dad): real transport, world maps, text children, fixed aspect ----

/** Every text child of the new blocks, measured: nothing past the card's content edge, nothing collapsed to zero width. */
async function textInside(page: Page) {
  return card(page).evaluate(root => {
    const cardBox = root.getBoundingClientRect();
    return [...root.querySelectorAll(".hkc-output-status-step-label, .hkc-output-status-step-time, .hkc-output-status-word, .hkc-output-status-detail, .hkc-output-progress-label, .hkc-output-progress-value, .hkc-output-progress-note, .hkc-output-map-label, .hkc-output-map-places li, .hkc-output-block-failed-text > *, .hkc-output-block-note")]
      .map(node => ({ text: node.textContent!.slice(0, 24), box: node.getBoundingClientRect(), scroll: node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).textOverflow !== "ellipsis" }))
      .filter(({ box, scroll }) => box.width < 1 || box.left < cardBox.left - .5 || box.right > cardBox.right + .5 || scroll)
      .map(({ text, box }) => `${text} @${Math.round(box.left)}–${Math.round(box.right)} (card ${Math.round(cardBox.left)}–${Math.round(cardBox.right)})`);
  });
}

const DRAWN = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#ecebe6"/></svg>`;
const POSTER = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d9d2c5"/></svg>`;

for (const mode of ["light", "dark"] as const) {
  test(`map ${mode}: real tile loads: held is loading, all aborted is failed with the places named, Try again with the network back draws it; some aborted is partial`, async ({ page }) => {
    let serve: "hold" | "abort" | "ok" | "half" = "hold";
    await page.route("**/__tiles__/**", route => {
      if (serve === "hold") return;
      // "half": tiles in even columns fail (the plane spans at least two columns at 512).
      if (serve === "abort" || (serve === "half" && Number(/\/(\d+)\/\d+\.svg$/.exec(route.request().url())![1]) % 2 === 0)) return route.abort();
      return route.fulfill({ contentType: "image/svg+xml", body: DRAWN });
    });
    await open(page, `doc=map&net=1&mode=${mode}&width=512`);
    const map = card(page).locator(".hkc-output-map");
    await expect(map).toHaveAttribute("data-state", "loading");
    await expect(map).toHaveAttribute("aria-busy", "true");
    serve = "abort";
    await open(page, `doc=map&net=1&mode=${mode}&width=512&generation=1`);
    const failed = card(page).locator(".hkc-output-block-failed");
    await expect(failed.locator(".hkc-output-block-failed-message")).toHaveText("Couldn’t load the map");
    await expect(failed.locator(".hkc-output-block-failed-reason")).toHaveText("Ueno (selected), Asakusa, Shinjuku");
    await expect(card(page).locator(".hkc-output-map-pin")).toHaveCount(0);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect(await axe(page)).toEqual([]);
    serve = "ok";
    await failed.getByRole("button", { name: "Try again" }).click();
    await expect(map).toHaveAttribute("data-state", "ready");
    expect(await card(page).locator("img.hkc-output-map-tile").evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).naturalWidth > 0 && getComputedStyle(node).visibility === "visible"))).toBe(true);
    await expect(card(page).locator(".hkc-output-map-pin")).toHaveCount(3);
    serve = "half";
    await open(page, `doc=map&net=1&mode=${mode}&width=512&generation=2`);
    await expect(map).toHaveAttribute("data-state", "partial");
    await expect(card(page).getByText("Part of the map didn’t load")).toBeVisible();
    for (const ratio of await contrast(page, ".hkc-output-block-note", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(await axe(page)).toEqual([]);
  });

  test(`video ${mode}: real poster and file failures show failed with Try again and Open video; the network back draws the poster`, async ({ page }) => {
    let serve: "abort" | "ok" = "abort";
    await page.route("**/__media__/**", route => serve === "abort" ? route.abort()
      : route.request().url().endsWith("b02") ? route.fulfill({ contentType: "image/svg+xml", body: POSTER }) : route.abort());
    await open(page, `doc=video&net=1&mode=${mode}&width=512`);
    const failed = card(page).locator(".hkc-output-block-failed");
    await expect(failed.locator(".hkc-output-block-failed-message")).toHaveText("Couldn’t load the video preview");
    await expect(failed.locator(".hkc-output-block-failed-reason")).toHaveText("Walkthrough of the new kitchen");
    await failed.getByRole("button", { name: "Open video" }).click();
    expect((await callbacks(page)).opened).toEqual(["artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01"]);
    for (const button of await failed.getByRole("button").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(28);
    for (const ratio of await contrast(page, ".hkc-output-block-failed-reason, .hkc-output-block-failed-message", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect(await axe(page)).toEqual([]);
    serve = "ok";
    await failed.getByRole("button", { name: "Try again" }).click();
    const poster = card(page).getByRole("button", { name: "Open video: Walkthrough of the new kitchen" });
    await expect(poster).toHaveAttribute("data-state", "ready");
    expect(await poster.locator("img").evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(poster.locator(".hkc-output-video-length")).toHaveCount(0);
  });

  test(`map ${mode}: continents, the dateline and a long pick keep every pin and the pick's name inside the plane; poles too far apart are listed`, async ({ page }) => {
    for (const [doc, width, pins] of [["world", 320, 2], ["world", 512, 2], ["continents", 320, 3], ["dateline", 320, 3], ["dateline", 512, 3], ["longpick", 320, 2], ["longpick", 512, 2]] as const) {
      await open(page, `doc=${doc}&mode=${mode}&width=${width}`, width + 48);
      const plane = card(page).locator(".hkc-output-map-plane");
      const planeBox = (await plane.boundingBox())!;
      const boxes = await plane.locator(".hkc-output-map-pin, .hkc-output-map-label[data-selected]").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      expect(await plane.locator(".hkc-output-map-pin").count(), `${doc}@${width}`).toBe(pins);
      expect(await plane.locator(".hkc-output-map-label[data-selected]").count(), `${doc}@${width}`).toBe(1);
      for (const box of boxes) {
        expect(box.left, `${doc}@${width}`).toBeGreaterThanOrEqual(planeBox.x); expect(box.right, `${doc}@${width}`).toBeLessThanOrEqual(planeBox.x + planeBox.width);
        expect(box.top, `${doc}@${width}`).toBeGreaterThanOrEqual(planeBox.y); expect(box.bottom, `${doc}@${width}`).toBeLessThanOrEqual(planeBox.y + planeBox.height);
      }
      // The pick's name is whole, or (only a label wider than the plane allows, e.g. 40 × "W") ellipsised at the
      // widest capsule the plane takes; its full name is always in the Places list.
      const pick = await plane.locator(".hkc-output-map-label[data-selected]").evaluate(node => ({ clipped: node.scrollWidth > node.clientWidth + .5, width: node.getBoundingClientRect().width }));
      if (pick.clipped) expect(pick.width, `${doc}@${width}`).toBeGreaterThanOrEqual(planeBox.width - 24.5);
      if (doc !== "longpick") expect(pick.clipped, `${doc}@${width}`).toBe(false);
      expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
      expect(await textInside(page)).toEqual([]);
    }
    await open(page, `doc=poles&mode=${mode}&width=320`, 368);
    await expect(card(page).locator(".hkc-output-map-plane")).toHaveCount(0);
    await expect(card(page).getByText("Too far apart to show on one map")).toBeVisible();
    await expect(card(page).locator(".hkc-output-map-places li")).toHaveText(["Longyearbyen (selected)", "McMurdo"]);
    expect(await textInside(page)).toEqual([]);
    expect(await axe(page)).toEqual([]);
  });

  for (const [aspect, ratio] of [["square", 1], ["4:3", 4 / 3], ["16:9", 16 / 9], ["3:4", 3 / 4]] as const) test(`image ${mode} ${aspect}: the measured frame keeps its aspect at 320, 420 and 512, loading and ready`, async ({ page }) => {
    for (const width of [320, 420, 512]) {
      for (const slow of [true, false]) {
        await open(page, `doc=image&aspect=${aspect}&mode=${mode}&width=${width}${slow ? "&imgslow=1" : ""}`, width + 48);
        const frame = card(page).locator(".hkc-output-media");
        await expect(frame).toHaveAttribute("data-state", slow ? "loading" : "ready");
        const box = (await frame.boundingBox())!;
        expect(box.width / box.height, `${aspect}@${width}`).toBeCloseTo(ratio, 2);
        expect(box.height).toBeLessThanOrEqual(480.5);
      }
    }
  });
}

for (const width of [320, 420]) {
  test(`schema-maximum text at ${width}px (light and dark): every text child of status steps and progress stays inside the card`, async ({ page }) => {
    for (const mode of ["light", "dark"] as const) {
      await open(page, `doc=hostilemedia&mode=${mode}&width=${width}`, width + 48);
      expect(await textInside(page)).toEqual([]);
      expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
