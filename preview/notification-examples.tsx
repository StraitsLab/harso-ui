import { useState } from "react";
import { BellIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button, Notification, NotificationCenter, type NotificationCenterItem, type NotificationTone } from "@harso/ui";
import type { ExampleState } from "./examples";

export function NotificationExample({ component, state }: { component: "Notification" | "NotificationCenter"; state: ExampleState }) {
  const [visible, setVisible] = useState(true);
  const [hold, setHold] = useState(false);
  const [tone, setTone] = useState<NotificationTone>("information");
  const [read, setRead] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [empty, setEmpty] = useState(false);
  const long = state === "long-content";
  const items: NotificationCenterItem[] = empty ? [] : [
    { id: "build", title: "Build complete", description: long ? "The complete presentation candidate is available for inspection. ".repeat(8) : "A local example result is ready.", category: "system", tone: "success" },
    { id: "review", title: "Review requested", description: "Someone mentioned you in a work unit.", category: "mentions" },
  ].map(item => ({ ...item, read: read.includes(item.id) } as NotificationCenterItem));
  return <div className="hkl-example-stack">
    <label><input type="checkbox" checked={hold} onChange={event => setHold(event.target.checked)} /> Hold host state</label>
    {component === "Notification" ? <>
      <label className="hk-field">Notification tone<select className="hk-select" value={tone} onChange={event => setTone(event.target.value as NotificationTone)}><option value="information">Information</option><option value="success">Success</option><option value="error">Error</option></select></label>
      <div style={{ width: "min(100%, 380px)" }}><Notification open={visible} title="Work unit updated" description={long ? "The latest result is ready for your inspection. ".repeat(12) : "The latest result is ready."} tone={tone} onDismiss={state === "disabled" ? undefined : () => { if (!hold) setVisible(false); }} /></div>
      {!visible && <p role="status">Notification dismissed.</p>}
      <Button leadingIcon={<BellIcon size={16} />} onClick={() => setVisible(true)} disabled={visible}>Show notification</Button>
    </> : <>
      <label><input type="checkbox" checked={empty} onChange={event => setEmpty(event.target.checked)} /> Empty notifications</label>
      <NotificationCenter items={items} disabled={state === "disabled"} onSelect={item => setSelected(item.title)} onMarkRead={id => { if (!hold) setRead(current => current.includes(id) ? current : [...current, id]); }} />
      {selected && <p role="status">Opened local example: {selected}</p>}
      <Button leadingIcon={<ArrowsClockwiseIcon size={16} />} onClick={() => { setRead([]); setSelected(""); setEmpty(false); }}>Reset notifications</Button>
    </>}
  </div>;
}
