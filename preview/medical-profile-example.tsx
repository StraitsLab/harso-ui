import { useRef, useState } from "react";
import { ActivityRingsCard, Avatar, Button, Checkbox, DataTable, Field, Input, MedicalProfile, MonthPanel, MostActiveDaysCard, Notification, Select, SleepScoreCard, StepsCard, Textarea } from "@harso/ui";
import type { DataColumn, DataSort } from "@harso/ui";
import type { ExampleState } from "./examples";

const statuses = ["Stable", "Recovering", "Under observation"];
const conditions = ["Allergy", "Asthma", "Fracture"];
const admissions = ["Outpatient", "Inpatient", "Discharged"];
type Patient = { id: string; name: string; birth: string; gender: string; blood: string; doctor: string; status: string; condition: string; admission: string; appointment: string };
const initialPatients: Patient[] = ["Alex Example", "Mira Sample", "Noah Demo", "Sam Example", "Jules Sample", "Robin Demo", "Ari Example"].map((name, index) => ({ id: String(index), name, birth: `199${index}-04-12`, gender: index % 2 ? "Woman" : "Man", blood: index % 2 ? "A+" : "O+", doctor: "Dr. Taylor Sample", status: statuses[index % 3], condition: conditions[index % 3], admission: admissions[index % 3], appointment: `2026-09-${10 + index}` }));
const alertFixtures = [{ id: "record", title: "Profile record updated", description: "A synthetic contact record was updated in this demonstration.", date: "2026-09-07" }, { id: "activity", title: "Activity sample available", description: "The example activity stream includes a new sample for inspection.", date: "2026-09-06" }, { id: "document", title: "Document ready to review", description: "A fictional document is available. No result interpretation is provided.", date: "2026-09-05" }];
const baseSteps = [3600, 4200, 0, 6800, 5400, 8000, 5200];

export function MedicalProfileExample({ state }: { state: ExampleState }) {
  const root = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState(initialPatients);
  const [patientId, setPatientId] = useState("0");
  const [day, setDay] = useState("2026-09-07");
  const [month, setMonth] = useState("2026-09");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [condition, setCondition] = useState("All");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataSort>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [readAlerts, setReadAlerts] = useState<string[]>([]);
  const [panel, setPanel] = useState<"navigation" | "report" | "alert" | null>(null);
  const [alertId, setAlertId] = useState("record");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [reports, setReports] = useState<{ patientId: string; subject: string; note: string }[]>([]);
  const [scenario, setScenario] = useState("ready");
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("Synthetic profiles only. No health records accessed.");
  const disabled = state === "disabled" || scenario === "disabled" || scenario === "disabled-error";
  const loading = scenario === "loading";
  const error = state === "error" || scenario === "error" || scenario === "disabled-error";
  const blocked = disabled || loading || error;
  const rows = scenario === "empty" ? [] : patients;
  const patient = rows.find(item => item.id === patientId);
  const act = (label: string, change: () => void) => { if (blocked) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const factor = 1 + Number(patientId) * .1;
  const history = patient ? baseSteps.map((value, index) => ({ date: `${month}-${String(index + 1).padStart(2, "0")}`, steps: Math.round(value * factor) })) : [];
  const reading = history.find(item => item.date === day);
  const dailySteps = reading?.steps;
  const sleep = reading ? [{ label: "Duration", value: dailySteps === 0 ? 30 : 44, target: 50 }, { label: "Timing", value: dailySteps === 0 ? 16 : 24, target: 30 }, { label: "Continuity", value: dailySteps === 0 ? 12 : 18, target: 20 }] : [];
  const sleepTotal = sleep.reduce((sum, item) => sum + item.value, 0);
  const rings = reading ? [{ id: "move", label: "Move", value: Math.round(reading.steps / 20), target: 400, unit: "kcal" }, { id: "exercise", label: "Exercise", value: Math.round(reading.steps / 200), target: 30, unit: "min" }, { id: "distance", label: "Distance", value: Number((reading.steps / 1400).toFixed(1)), target: 5, unit: "km" }] : [];
  const filtered = rows.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()) && (status === "All" || item.status === status) && (condition === "All" || item.condition === condition));
  const ordered = [...filtered].sort((first, second) => { if (!sort) return 0; const delta = sort.column === "appointment" ? first.appointment.localeCompare(second.appointment) : first.name.localeCompare(second.name); return sort.direction === "ascending" ? delta : -delta; });
  const pageCount = Math.max(1, Math.ceil(ordered.length / 3));
  const currentPage = Math.min(page, pageCount);
  const choosePatient = (id: string) => act("Profile requested", () => { setPatientId(id); setPanel(null); setSubject(""); setNote(""); });
  const columns: DataColumn<Patient>[] = [
    { id: "name", label: "Patient", sortable: true, render: row => <Button disabled={blocked} aria-pressed={patientId === row.id} onClick={() => choosePatient(row.id)}>{row.name}</Button> },
    { id: "admission", label: "Admission", render: row => <Select aria-label={`Admission for ${row.name}`} disabled={blocked} value={row.admission} onChange={event => act("Admission requested", () => setPatients(previous => previous.map(item => item.id === row.id ? { ...item, admission: event.target.value } : item)))}>{admissions.map(value => <option key={value}>{value}</option>)}</Select> },
    { id: "status", label: "Status", render: row => row.status },
    { id: "condition", label: "Condition", render: row => row.condition },
    { id: "appointment", label: "Next appointment", sortable: true, render: row => <time dateTime={row.appointment}>{row.appointment}</time> },
  ];
  const navigation = <div className="hk-medical-editor">{["Overview", "Patients"].map(label => <Button key={label} disabled={blocked} onClick={() => act(`${label} requested`, () => { setPanel(null); root.current?.querySelector(label === "Patients" ? '[aria-label="Patients"]' : '[aria-label="Patient information"]')?.scrollIntoView({ block: "start" }); })}>{label}</Button>)}</div>;
  const closePanel = () => { setPanel(null); setSubject(""); setNote(""); };
  const report = <form className="hk-medical-editor" onSubmit={event => { event.preventDefault(); if (!patient || !subject.trim() || !note.trim()) return; act("Local report saved", () => { setReports(previous => [...previous, { patientId: patient.id, subject: subject.trim(), note: note.trim() }]); closePanel(); }); }}>
    <p>Local draft for {patient?.name}. Nothing is submitted to a healthcare service.</p>
    <Checkbox label="Retain report submission" checked={hold} onChange={event => setHold(event.target.checked)} />
    <Field label="Report subject" required>{props => <Input {...props} disabled={blocked} maxLength={120} value={subject} onChange={event => setSubject(event.target.value)} />}</Field>
    <Field label="Report note" required>{props => <Textarea {...props} disabled={blocked} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} />}</Field>
    <Button type="submit" disabled={blocked || !subject.trim() || !note.trim()}>Save local report</Button><Button onClick={closePanel}>Cancel report</Button>
  </form>;
  const selectedAlert = alertFixtures.find(item => item.id === alertId)!;
  const alertKey = `${patientId}:${alertId}`;
  const alertDetail = <article className="hk-medical-editor"><h3>{selectedAlert.title}</h3><p>{selectedAlert.description}</p><time dateTime={selectedAlert.date}>{selectedAlert.date}</time><Button disabled={blocked || readAlerts.includes(alertKey)} onClick={() => act("Alert marked read", () => setReadAlerts(previous => [...previous, alertKey]))}>{readAlerts.includes(alertKey) ? "Read" : "Mark alert read"}</Button></article>;
  const dataState = loading ? <p role="status">Loading profile…</p> : error ? <p>Profile data unavailable.</p> : !patient ? <p>No profile selected.</p> : null;
  const inspection = (label: string) => <Button disabled={blocked} onClick={() => act(`Inspect ${label}`, () => {})}>{label}</Button>;
  return <div ref={root} className="hk-medical-example">
    <div className="hk-home-toolbar"><label>Medical scenario<Select value={scenario} onChange={event => { setScenario(event.target.value); setSelected([]); setPage(1); closePanel(); }}>{["ready", "empty", "loading", "error", "disabled", "disabled-error"].map(value => <option key={value}>{value}</option>)}</Select></label><Checkbox label="Hold medical requests" checked={hold} onChange={event => setHold(event.target.checked)} /></div>
    <p>Fictional people and generated activity only. Scores and goals illustrate UI behavior, not clinical assessment or recommendations.</p>
    <MedicalProfile title="A picture of your day" navigation={navigation} actions={<><Button disabled={blocked} onClick={() => act("Navigation opened", () => setPanel("navigation"))}>Navigate</Button><Button disabled={blocked || !patient} onClick={() => act("Report editor opened", () => setPanel("report"))}>File a report</Button></>} panel={panel ? { title: panel === "navigation" ? "Health navigation" : panel === "report" ? "File a report" : "Alert detail", content: panel === "navigation" ? navigation : panel === "report" ? report : alertDetail, onClose: closePanel } : null}
      identity={dataState ?? <div className="hk-medical-identity"><Avatar name={patient!.name} size={48} /><div><h3>{patient!.name}</h3><label>Selected profile<Select aria-label="Selected profile" disabled={blocked} value={patientId} onChange={event => choosePatient(event.target.value)}>{rows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label></div><dl>{[["Date of birth", patient!.birth], ["Gender", patient!.gender], ["Blood type", patient!.blood], ["Doctor", patient!.doctor]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>}
      steps={<StepsCard title="Small steps, every day" caption={`${month} · first seven days · 0–15,000 steps`} value={dataState ? "—" : `${history.reduce((sum, item) => sum + item.steps, 0).toLocaleString("en-US")} steps`}>{dataState ?? <><svg className="hk-medical-plot" viewBox="0 0 420 205" role="img" aria-label="Daily sample steps"><path d="M 38 20 V 165 H 400" fill="none" stroke="var(--hk-line)" /><text x="0" y="22">15k</text><text x="20" y="165">0</text>{history.map((item, index) => <g key={item.date}><rect data-date={item.date} x={52 + index * 48} y={165 - item.steps / 15000 * 145} width="24" height={item.steps / 15000 * 145} fill="var(--hk-accent)" /><text x={64 + index * 48} y="187" textAnchor="middle">{index + 1}</text></g>)}</svg><ul className="hk-medical-values">{history.map(item => <li key={item.date}>{inspection(`${item.date}: ${item.steps.toLocaleString("en-US")} steps`)}</li>)}</ul></>}</StepsCard>}
      sleep={<SleepScoreCard title="Rest, in perspective" value={dataState || !reading ? "—" : `${sleepTotal} / 100`} caption={`Illustrative score · ${day}`}>{dataState ?? (reading ? <div className="hk-medical-sleep">{sleep.map(item => <div key={item.label}>{inspection(`${item.label}: ${item.value} / ${item.target}`)}<progress aria-label={item.label} value={item.value} max={item.target} /></div>)}</div> : <p>No sleep sample for this day.</p>)}</SleepScoreCard>}
      calendar={<MostActiveDaysCard title="Days in motion" caption="Choose a recorded day to inspect activity">{dataState ?? <><MonthPanel month={month} onMonthChange={value => act("Month requested", () => { setMonth(value); setDay(`${value}-01`); })} value={day} onValueChange={value => act("Day requested", () => setDay(value))} minDate="2026-08-01" maxDate="2026-09-30" today="2026-09-07" isDateUnavailable={date => !history.some(item => item.date === date)} disabled={blocked} /><p>Selected day: <time dateTime={day}>{day}</time> · {dailySteps === undefined ? "No recorded sample" : `${dailySteps.toLocaleString("en-US")} steps`}</p><p>Most active: {history.reduce((best, item) => item.steps > best.steps ? item : best, history[0]).date}</p></>}</MostActiveDaysCard>}
      activity={<ActivityRingsCard title="Your activity" caption={`${day} · illustrative goals, not recommendations`} rings={dataState ? [] : rings} disabled={blocked}>{dataState}</ActivityRingsCard>}
      alerts={<><h3>Important updates</h3>{dataState ?? <ul className="hk-medical-alerts">{alertFixtures.map(item => <li key={item.id}><Notification role="article" title={item.title} description={item.description}><time dateTime={item.date}>{item.date}</time><Button disabled={blocked} onClick={() => act("Alert opened", () => { setAlertId(item.id); setPanel("alert"); })}>Inspect {item.title}</Button><span>{readAlerts.includes(`${patientId}:${item.id}`) ? "Read" : "Unread"}</span></Notification></li>)}</ul>}</>}
      patients={<DataTable caption="Patients" columns={columns} rows={ordered.slice((currentPage - 1) * 3, currentPage * 3)} rowId={row => row.id} rowLabel={row => row.name} disabled={disabled} loading={loading} error={error ? "Patient data unavailable." : undefined} emptyMessage="No matching patients." sort={sort} onSortChange={value => act("Sort requested", () => { setSort(value); setPage(1); })} selectedIds={selected} onSelectionChange={(ids, checked) => act("Selection requested", () => setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(id => !ids.includes(id))))} pagination={{ page: currentPage, pageCount, onPageChange: value => act("Page requested", () => setPage(value)) }} toolbar={<><label>Search patients<Input disabled={blocked} value={query} onChange={event => act("Search requested", () => { setQuery(event.target.value); setPage(1); })} /></label>{([ ["Status", status, statuses, setStatus], ["Condition", condition, conditions, setCondition] ] as const).map(([label, value, options, update]) => <label key={label}>{label}<Select aria-label={`${label} filter`} disabled={blocked} value={value} onChange={event => act("Filter requested", () => { update(event.target.value); setPage(1); })}>{["All", ...options].map(option => <option key={option}>{option}</option>)}</Select></label>)}</>} footer={<span>{filtered.length} patients · {selected.length} selected</span>} />}
    >{error && <Button disabled={disabled} onClick={() => { if (disabled) return; setRequest(`Retry requested${hold ? "; host retained state" : ""}.`); if (!hold) setScenario("ready"); }}>Retry profiles</Button>}{reports.some(item => item.patientId === patientId) && <section aria-label="Local report drafts"><h3>Local report drafts</h3>{reports.filter(item => item.patientId === patientId).map((item, index) => <article key={index}><h4>{item.subject}</h4><p>{item.note}</p></article>)}</section>}</MedicalProfile>
    <output aria-label="Medical request">{request}</output>
  </div>;
}
