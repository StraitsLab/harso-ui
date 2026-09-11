import { test, expect, type Page, type Locator } from "@playwright/test";

async function mountExample(page: Page, component: string) {
  await page.goto("/#boardui:input");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, component }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const element = React.createElement;
    const exampleFile = component === "Questionnaire" ? "questionnaire-example" : ["Calendar", "DatePicker"].includes(component) ? "dates-examples" : "controls-examples";
    const exports = await import(`/src/boundaryless/${exampleFile}.tsx`);
    const Example = exports.QuestionnaireExample ?? exports.DatesExample ?? exports.ControlsExample;
    function Consumer() {
      const [state, setState] = React.useState("default");
      return element("section", { "aria-label": "Input completion consumer" },
        element("select", { "aria-label": "Mounted state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["default", "error", "disabled"].map(value => element("option", { key: value }, value))),
        element(Example, { component, state }));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, component });
  return page.getByRole("region", { name: "Input completion consumer" });
}

async function disabledClick(page: Page, target: Locator) {
  await expect(target).toBeDisabled();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test("INPUT required empty, mounted error-clear and disabled recovery", async ({ page }) => {
  const fixture = await mountExample(page, "Input");
  const input = fixture.getByRole("textbox", { name: "Project name", exact: true });
  await input.fill("");
  expect(await input.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
  await input.fill("Retained project");
  const node = await input.elementHandle();
  await fixture.getByLabel("Mounted state").selectOption("error");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("Use a name your team can recognize.");
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await disabledClick(page, fixture.getByRole("button", { name: "Clear project name" }));
  await expect(input).toHaveValue("Retained project");
  await expect(input).toBeDisabled();
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await input.evaluate((current, original) => current === original, node)).toBe(true);
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await fixture.getByRole("button", { name: "Clear project name" }).click();
  await expect(input).toHaveValue("");
  await input.fill("Recovered project");
  expect(await input.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(true);
});

test("QUESTIONNAIRE mounted disabled/error recovery retains admitted answers", async ({ page }) => {
  const fixture = await mountExample(page, "Questionnaire");
  const research = fixture.getByLabel("Research", { exact: true });
  await research.check();
  const node = await research.elementHandle();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(research).toBeChecked();
  expect(await research.evaluate((current, original) => current === original, node)).toBe(true);
  await disabledClick(page, fixture.getByRole("button", { name: "Next", exact: true }));
  await expect(fixture.getByRole("heading")).toHaveText("What should Harso help with?");
  await fixture.getByLabel("Mounted state").selectOption("error");
  await expect(fixture.getByRole("alert")).toContainText("question IDs and option values must be unique");
  await expect(fixture.getByLabel("Submitted answers")).toHaveCount(0);
  await fixture.getByLabel("Mounted state").selectOption("default");
  await expect(fixture.getByRole("alert")).toHaveCount(0);
  await expect(research).toBeChecked();
  await fixture.getByRole("button", { name: "Next", exact: true }).click();
  await expect(fixture.getByRole("heading")).toHaveText("How would you like the result?");
  await fixture.getByLabel("A concise summary", { exact: true }).check();
  await expect(fixture.getByLabel("Submitted answers")).toContainText('"research"');
  await fixture.getByLabel("Selection mode").selectOption("empty");
  await expect(fixture.getByRole("status")).toHaveText("No questions to answer.");
  await fixture.getByLabel("Selection mode").selectOption("multiple");
  await expect(research).toBeEnabled();
});

test("OTP empty, incomplete, mounted error/disabled and complete recovery without autofill", async ({ page }) => {
  const fixture = await mountExample(page, "InputOtp");
  const input = fixture.getByRole("textbox", { name: "One-time code", exact: true });
  expect(await input.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
  await input.fill("123");
  expect(await input.evaluate((node: HTMLInputElement) => node.validity.patternMismatch)).toBe(true);
  await fixture.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(fixture.locator("output")).toBeEmpty();
  const node = await input.elementHandle();
  await fixture.getByLabel("Mounted state").selectOption("error");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/That sample code was not accepted/);
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await disabledClick(page, fixture.getByRole("button", { name: "Clear code" }));
  await disabledClick(page, fixture.getByRole("button", { name: "Continue", exact: true }));
  await expect(input).toBeDisabled();
  await expect(input).toHaveValue("123");
  await expect(fixture.locator("output")).toBeEmpty();
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await input.evaluate((current, original) => current === original, node)).toBe(true);
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await input.fill("123456");
  await expect(fixture.locator("output")).toHaveText("Code is complete. Submit when ready.");
  await expect(fixture.locator("[data-otp-slot]")).toHaveText(["1", "2", "3", "4", "5", "6"]);
  await fixture.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(fixture.locator("output")).toContainText("Code submitted to the demo host. No verification request.");
  await fixture.getByRole("button", { name: "Clear code" }).click();
  await expect(input).toHaveValue("");
  await expect(fixture.locator("[data-otp-slot]")).toHaveText(["", "", "", "", "", ""]);
});

test("QUESTIONNAIRE disabling cancels pending advance without reviving it", async ({ page }) => {
  const fixture = await mountExample(page, "Questionnaire");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await fixture.getByLabel("Selection mode").selectOption("single");
  await fixture.getByLabel("Research", { exact: true }).check();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await page.clock.runFor(1000);
  await expect(fixture.getByRole("heading")).toHaveText("What should Harso help with?");
  await fixture.getByLabel("Mounted state").selectOption("default");
  await page.clock.runFor(1000);
  await expect(fixture.getByRole("heading")).toHaveText("What should Harso help with?");
  await expect(fixture.getByLabel("Research", { exact: true })).toBeChecked();
  await fixture.getByRole("button", { name: "Next", exact: true }).click();
  await expect(fixture.getByRole("heading")).toHaveText("How would you like the result?");
});

test("SLIDER native and paired disabled suppression plus invalid precision recovery", async ({ page }) => {
  const fixture = await mountExample(page, "Slider");
  const sliders = fixture.getByRole("slider");
  const original = await sliders.first().elementHandle();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  for (const slider of await sliders.all()) await disabledClick(page, slider);
  await expect(sliders).toHaveCount(3);
  await expect(sliders.nth(0)).toHaveValue("20");
  await expect(sliders.nth(1)).toHaveValue("80");
  await expect(sliders.nth(2)).toHaveValue("45");
  await expect(fixture.getByLabel("Supplied range")).toHaveText("[20,80]");
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await sliders.first().evaluate((current, original) => current === original, original)).toBe(true);
  await sliders.nth(0).focus(); await page.keyboard.press("ArrowRight");
  await expect(fixture.getByLabel("Supplied range")).toHaveText("[25,80]");
  await sliders.nth(2).focus(); await page.keyboard.press("ArrowRight");
  await expect(sliders.nth(2)).toHaveValue("46");
  await fixture.getByLabel("Range scale").selectOption("5");
  await expect(fixture.getByText("Range unavailable: browser precision limit.")).toBeVisible();
  await disabledClick(page, sliders.first());
  await fixture.getByLabel("Range scale").selectOption("0");
  await expect(fixture.getByText(/Range unavailable/)).toHaveCount(0);
  await expect(sliders.first()).toBeEnabled();
  await fixture.getByRole("button", { name: "Reset range" }).click();
  await expect(sliders.nth(2)).toHaveValue("45");
});

test("FILEUPLOAD empty, validation recovery, supplied progress/error and disabled retry", async ({ page }) => {
  const fixture = await mountExample(page, "FileUpload");
  const picker = fixture.getByLabel("Reference files", { exact: true });
  const original = await picker.elementHandle();
  await expect(fixture.locator(".hk-file-list")).toHaveCount(0);
  await picker.setInputFiles({ name: "bad.exe", mimeType: "application/octet-stream", buffer: Buffer.from("bad") });
  await expect(fixture.getByRole("alert")).toContainText("file type is not allowed");
  await expect(picker).toHaveAttribute("aria-invalid", "true");
  await expect(fixture.locator(".hk-file-list")).toHaveCount(0);
  await picker.setInputFiles({ name: "good.txt", mimeType: "text/plain", buffer: Buffer.from("ok") });
  await expect(fixture.getByRole("alert")).toHaveCount(0);
  await expect(picker).not.toHaveAttribute("aria-invalid", "true");
  await expect(fixture.getByText("good.txt", { exact: true })).toBeVisible();
  await fixture.getByRole("button", { name: "Show supplied transfer states" }).click();
  await expect(fixture.getByRole("progressbar")).toHaveAttribute("value", "0.35");
  await expect(fixture.getByText("Complete · 310 bytes", { exact: true })).toBeVisible();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(picker).toBeDisabled();
  await disabledClick(page, fixture.getByRole("button", { name: "Retry research-notes.txt" }));
  await disabledClick(page, fixture.getByRole("button", { name: "Remove research-notes.txt" }));
  await expect(fixture.getByText("Connection lost. Your file is still available.")).toBeVisible();
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await picker.evaluate((current, original) => current === original, original)).toBe(true);
  await fixture.getByRole("button", { name: "Retry research-notes.txt" }).click();
  await expect(fixture.getByText("Retry requested. No upload started.")).toBeVisible();
  await expect(fixture.getByRole("button", { name: "Retry research-notes.txt" })).toHaveCount(0);
  await fixture.getByRole("button", { name: "Clear sample files" }).click();
  await expect(fixture.locator(".hk-file-list")).toHaveCount(0);
});

for (const composition of ["single", "range"]) test(`DATEPICKER ${composition} mounted error/disabled recovery and empty/refused clear`, async ({ page }) => {
  const fixture = await mountExample(page, "DatePicker");
  await fixture.getByLabel("Date composition").selectOption(composition);
  const trigger = fixture.locator(".hk-date-selection > button");
  const original = await trigger.elementHandle();
  await trigger.click();
  const dialog = fixture.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await fixture.getByLabel("Mounted state").selectOption("error");
  await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("status")).toHaveText("Choose available dates within the allowed range.");
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(dialog).not.toBeVisible();
  await disabledClick(page, trigger);
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await trigger.evaluate((current, original) => current === original, original)).toBe(true);
  await trigger.click();
  await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await fixture.getByLabel("Keep host value").check();
  await trigger.click();
  await dialog.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(fixture.getByLabel("Date action")).toContainText("cleared");
  await expect(trigger).not.toContainText("Choose dates");
  await fixture.getByLabel("Keep host value").uncheck();
  await trigger.click();
  await dialog.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(trigger).toContainText("Choose dates");
  await trigger.click();
  await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await dialog.getByLabel(composition === "single" ? "Date" : "Start date", { exact: true }).fill("2026-09-14");
  if (composition === "range") await dialog.getByLabel("End date", { exact: true }).fill("2026-09-18");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(fixture.getByLabel(composition === "single" ? "Selected date" : "Selected range")).toContainText("2026-09-14");
});

test("CALENDAR mounted empty/disabled recovers events, inbox and actions", async ({ page }) => {
  const fixture = await mountExample(page, "Calendar");
  const calendar = fixture.getByRole("region", { name: "Space to focus" });
  const original = await calendar.elementHandle();
  await calendar.getByRole("button", { name: /A clearer direction/ }).click();
  await expect(calendar.getByRole("dialog", { name: "A clearer direction", exact: true })).toBeVisible();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(calendar.getByRole("dialog", { name: "A clearer direction", exact: true })).not.toBeVisible();
  for (const name of [/A clearer direction/, "Next month", "Previous month", /Inbox/]) await disabledClick(page, calendar.getByRole("button", { name }));
  await expect(fixture.getByLabel("Calendar action")).toBeEmpty();
  await fixture.getByLabel("Mounted state").selectOption("default");
  await fixture.getByLabel("Empty month").check();
  await expect(calendar.getByRole("status")).toHaveText("No events supplied for this month.");
  await calendar.getByRole("button", { name: /Inbox/ }).click();
  await expect(calendar.getByText("No calendar updates.")).toBeVisible();
  await page.keyboard.press("Escape");
  await fixture.getByLabel("Empty month").uncheck();
  expect(await calendar.evaluate((current, original) => current === original, original)).toBe(true);
  await calendar.getByRole("button", { name: /A clearer direction/ }).click();
  await calendar.getByRole("button", { name: "Join review", exact: true }).click();
  await expect(fixture.getByLabel("Calendar action")).toHaveText("Requested: brief");
});

async function mountControlled(page: Page, component: "FileUpload" | "Calendar" | "MeetingScheduler" | "MonthPanel") {
  await page.goto("/#boardui:calendar");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]+\/packages\/ui\/src\/boundaryless\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, component }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { FileUpload } = await import(`${producerUrl}controls.tsx`);
    const { Calendar, MeetingScheduler, MonthPanel } = await import(`${producerUrl}dates.tsx`);
    const element = React.createElement;
    class Boundary extends React.Component {
      state = { error: "" };
      static getDerivedStateFromError(error: Error) { return { error: error.message }; }
      render() { return this.state.error ? element("p", { role: "alert" }, this.state.error) : this.props.children; }
    }
    function Consumer() {
      const [disabled, setDisabled] = React.useState(false);
      const [state, setState] = React.useState("initial");
      const [month, setMonth] = React.useState("2026-09");
      const [requests, setRequests] = React.useState([]);
      const request = (value: string) => setRequests((previous: string[]) => [...previous, value]);
      const files = state === "empty" ? [] : [{ id: "retained", name: state === "replacement" ? "replacement.txt" : "retained.txt", status: state === "replacement" ? "complete" : "error", message: "Supplied transfer state" }];
      const events = state === "empty" ? [] : [{ id: "review", date: state === "invalid" ? "2026-09-31" : "2026-09-07", title: "Retained review", actionLabel: "Request review" }];
      const dateContent = component === "MeetingScheduler" ? element(MeetingScheduler, { label: "Controlled meeting", slots: state === "empty" ? [] : [{ id: "morning", startsAt: state === "invalid" ? "2026-09-06T09:00:00" : "2026-09-06T09:00:00Z", durationMinutes: 30 }], timeZones: ["UTC"], today: "2026-09-06", value: state === "replacement" ? "morning" : null, disabled, onValueChange: (value: string) => request(`slot:${value}`), onConfirm: () => request("confirm:morning") })
        : component === "MonthPanel" ? element(MonthPanel, { month, today: "2026-09-06", value: state === "empty" ? null : "2026-09-06", minDate: state === "invalid" ? "invalid" : "2026-09-01", disabled, onValueChange: (value: string) => request(`day:${value}`), onMonthChange: (value: string) => request(`month:${value}`) })
          : element(Calendar, { label: "Controlled calendar", events, month, disabled, today: "2026-09-06", onMonthChange: (next: string) => request(`month:${next}`), onEventAction: () => request("event:review") });
      return element("section", { "aria-label": "Controlled input consumer" },
        element("button", { onClick: () => setDisabled(!disabled) }, "Host disabled"),
        element("button", { onClick: () => setMonth("2026-10") }, "Host replace month"),
        element("select", { "aria-label": "Supplied state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["initial", "empty", "replacement", "invalid"].map(value => element("option", { key: value }, value))),
        element("output", { "aria-label": "Requests" }, JSON.stringify(requests)),
        component === "FileUpload" ? element(FileUpload, { label: "Files", files, disabled, accept: ".txt", multiple: true, onFilesSelect: (files: File[]) => request(`select:${files.map(file => file.name).join(",")}`), onRetry: (id: string) => request(`retry:${id}`), onRemove: (id: string) => request(`remove:${id}`) })
          : element(Boundary, { key: state === "invalid" ? "invalid" : "valid" }, dateContent));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, component });
  return page.getByRole("region", { name: "Controlled input consumer" });
}

test("FILEUPLOAD refused chooser/drop/remove/retry stays host-owned until replacement", async ({ page }) => {
  const fixture = await mountControlled(page, "FileUpload");
  const files = fixture.getByRole("region", { name: "Files selection" });
  const original = await files.elementHandle();
  await fixture.getByLabel("Files", { exact: true }).setInputFiles({ name: "candidate.txt", mimeType: "text/plain", buffer: Buffer.from("local") });
  await files.evaluate(node => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["drop"], "dropped.txt", { type: "text/plain" }));
    node.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));
  });
  await fixture.getByRole("button", { name: "Remove retained.txt" }).click();
  await fixture.getByRole("button", { name: "Retry retained.txt" }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["select:candidate.txt","select:dropped.txt","remove:retained","retry:retained"]');
  await expect(files.locator(".hk-file-name")).toHaveText(["retained.txt"]);
  await expect(files.getByText("Failed", { exact: true })).toBeVisible();
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await disabledClick(page, fixture.getByRole("button", { name: "Remove retained.txt" }));
  await disabledClick(page, fixture.getByRole("button", { name: "Retry retained.txt" }));
  await files.evaluate(node => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["drop"], "blocked.txt", { type: "text/plain" }));
    node.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));
  });
  await expect(fixture.getByLabel("Requests")).not.toContainText("blocked");
  await expect(fixture.getByLabel("Requests")).toHaveText('["select:candidate.txt","select:dropped.txt","remove:retained","retry:retained"]');
  await fixture.getByLabel("Supplied state").selectOption("replacement");
  expect(await files.evaluate((current, original) => current === original, original)).toBe(true);
  await expect(files.locator(".hk-file-name")).toHaveText(["replacement.txt"]);
  await expect(files.getByText("Complete", { exact: true })).toBeVisible();
  await fixture.getByLabel("Supplied state").selectOption("empty");
  await expect(files.locator(".hk-file-list")).toHaveCount(0);
});

test("CALENDAR controlled month refusal, replacement and invalid event boundary recovery", async ({ page }) => {
  const fixture = await mountControlled(page, "Calendar");
  const calendar = fixture.getByRole("region", { name: "Controlled calendar" });
  const original = await calendar.elementHandle();
  await calendar.getByRole("button", { name: "Next month" }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["month:2026-10"]');
  await expect(calendar.getByRole("heading", { name: "September 2026", exact: true })).toBeVisible();
  await calendar.getByRole("button", { name: "Retained review", exact: true }).click();
  await calendar.getByRole("button", { name: "Request review", exact: true }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["month:2026-10","event:review"]');
  await expect(calendar.getByRole("button", { name: "Retained review", exact: true })).toBeVisible();
  await fixture.getByRole("button", { name: "Host replace month" }).click();
  expect(await calendar.evaluate((current, original) => current === original, original)).toBe(true);
  await expect(calendar.getByRole("heading", { name: "October 2026", exact: true })).toBeVisible();
  await expect(calendar.getByRole("status")).toHaveText("No events supplied for this month.");
  await fixture.getByLabel("Supplied state").selectOption("invalid");
  await expect(fixture.getByRole("alert")).toHaveText("Calendar events require a valid date in YYYY-MM-DD format.");
  await fixture.getByLabel("Supplied state").selectOption("initial");
  await expect(fixture.getByRole("alert")).toHaveCount(0);
  await expect(calendar.getByRole("heading", { name: "October 2026", exact: true })).toBeVisible();
});

test("DATEPICKER meeting empty/disabled, controlled refusal, replacement and rejected invalid slots", async ({ page }) => {
  const fixture = await mountControlled(page, "MeetingScheduler");
  const meeting = fixture.getByRole("region", { name: "Controlled meeting" });
  const original = await meeting.elementHandle();
  await meeting.getByRole("radio").click();
  await expect(meeting.getByRole("radio")).not.toBeChecked();
  await expect(fixture.getByLabel("Requests")).toHaveText('["slot:morning"]');
  await expect(meeting.getByRole("button", { name: "Confirm time" })).toBeDisabled();
  await fixture.getByLabel("Supplied state").selectOption("replacement");
  await expect(meeting.getByRole("radio")).toBeChecked();
  await meeting.getByRole("button", { name: "Confirm time" }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["slot:morning","confirm:morning"]');
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await disabledClick(page, meeting.getByRole("radio"));
  await disabledClick(page, meeting.getByRole("button", { name: "Confirm time" }));
  await expect(meeting.getByLabel("Timezone", { exact: true })).toBeDisabled();
  await expect(fixture.getByLabel("Requests")).toHaveText('["slot:morning","confirm:morning"]');
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await fixture.getByLabel("Supplied state").selectOption("empty");
  await expect(meeting.getByRole("status")).toHaveText("No times supplied for this date.");
  await expect(meeting.getByRole("button", { name: "Confirm time" })).toBeDisabled();
  await fixture.getByLabel("Supplied state").selectOption("replacement");
  expect(await meeting.evaluate((current, original) => current === original, original)).toBe(true);
  await expect(meeting.getByRole("button", { name: "Confirm time" })).toBeEnabled();
  await fixture.getByLabel("Supplied state").selectOption("invalid");
  await expect(fixture.getByRole("alert")).toHaveText("Meeting slots require valid offset-qualified instants and a positive duration.");
  await fixture.getByLabel("Supplied state").selectOption("replacement");
  await expect(fixture.getByRole("alert")).toHaveCount(0);
  await expect(meeting.getByRole("radio")).toBeChecked();
});

test("DATEPICKER inline month empty selection, disabled/error recovery and host refusal", async ({ page }) => {
  const fixture = await mountControlled(page, "MonthPanel");
  const grid = fixture.getByRole("grid");
  const original = await grid.elementHandle();
  await grid.getByRole("button", { name: /September 7, 2026/ }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["day:2026-09-07"]');
  await expect(grid.getByRole("button", { name: /September 6, 2026/ })).toHaveAttribute("aria-pressed", "true");
  await expect(grid.getByRole("button", { name: /September 7, 2026/ })).toHaveAttribute("aria-pressed", "false");
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await disabledClick(page, grid.getByRole("button", { name: /September 7, 2026/ }));
  await disabledClick(page, fixture.getByRole("button", { name: "Next month" }));
  await expect(fixture.getByLabel("Requests")).toHaveText('["day:2026-09-07"]');
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await fixture.getByLabel("Supplied state").selectOption("empty");
  await expect(grid.locator('[aria-pressed="true"]')).toHaveCount(0);
  await fixture.getByLabel("Supplied state").selectOption("initial");
  expect(await grid.evaluate((current, original) => current === original, original)).toBe(true);
  await expect(grid.getByRole("button", { name: /September 6, 2026/ })).toHaveAttribute("aria-pressed", "true");
  await fixture.getByLabel("Supplied state").selectOption("invalid");
  await expect(fixture.getByRole("alert")).toHaveText("Date bounds require a valid date in YYYY-MM-DD format.");
  await fixture.getByLabel("Supplied state").selectOption("initial");
  await expect(fixture.getByRole("alert")).toHaveCount(0);
  await expect(grid.getByRole("button", { name: /September 6, 2026/ })).toBeEnabled();
});
