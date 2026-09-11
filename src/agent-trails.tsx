import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { GithubLogo, RedditLogo, LinkedinLogo, XLogo, GoogleLogo, YoutubeLogo, FacebookLogo, InstagramLogo, DiscordLogo, SlackLogo, FigmaLogo, DribbbleLogo, BehanceLogo, PinterestLogo, SpotifyLogo, AppleLogo, AmazonLogo, MicrosoftTeamsLogo, TwitchLogo, TiktokLogo, StackOverflowLogo, GitlabLogo, MediumLogo, NotionLogo, Globe } from "@phosphor-icons/react";
import { Source } from "./activity";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type RevealProps = { revealed?: number; startDelay?: number; stepInterval?: number; disabled?: boolean; error?: string; onComplete?: () => void };
export type AgentTrailStep = { label: string; icon?: ReactNode; chips?: readonly { label: string; icon?: ReactNode }[] };
export type AgentTrailTask = { id: string; label: string; status?: "pending" | "running" | "complete" | "error"; steps?: readonly AgentTrailStep[] };
export type TaskListProps = ComponentPropsWithRef<"ul"> & RevealProps & { tasks: readonly AgentTrailTask[]; collapseOnComplete?: boolean | "all" };
export type WebSearchResult = { title: string; url: string; snippet?: string };
export type WebSearchSource = { title: string; domain: string; brand?: string; icon?: ReactNode; href?: string };
export type WebSearchStep = { label: string; query?: string; meta?: string; heading?: boolean; brand?: string; icon?: ReactNode; dwell?: number; sources?: readonly WebSearchSource[] };
export type WebSearchProps = ComponentPropsWithRef<"section"> & RevealProps & { query?: string; searchResults?: readonly WebSearchResult[]; steps?: readonly WebSearchStep[]; working?: string | false };

const siteMarks = { github: GithubLogo, reddit: RedditLogo, linkedin: LinkedinLogo, x: XLogo, google: GoogleLogo, youtube: YoutubeLogo, facebook: FacebookLogo, instagram: InstagramLogo, discord: DiscordLogo, slack: SlackLogo, figma: FigmaLogo, dribbble: DribbbleLogo, behance: BehanceLogo, pinterest: PinterestLogo, spotify: SpotifyLogo, apple: AppleLogo, amazon: AmazonLogo, teams: MicrosoftTeamsLogo, twitch: TwitchLogo, tiktok: TiktokLogo, stackoverflow: StackOverflowLogo, gitlab: GitlabLogo, medium: MediumLogo, notion: NotionLogo };
function TrailRow(props: HTMLMotionProps<"li">) {
  const reducedMotion = useReducedMotion();
  return <motion.li {...props} initial={reducedMotion ? false : { height: 0, opacity: 0, y: 4, filter: "blur(2px)", overflow: "hidden" }} animate={{ height: "auto", opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { overflow: "visible" } }} transition={{ duration: reducedMotion ? 0 : 0.18 }} />;
}
function SiteMark({ brand, icon }: { brand?: string; icon?: ReactNode }) {
  const Mark = brand && Object.hasOwn(siteMarks, brand) ? siteMarks[brand as keyof typeof siteMarks] : undefined;
  return <span className="hk-trail-site-mark" aria-hidden="true" data-brand={Mark ? brand : undefined}>{Mark ? <Mark size={18} /> : icon ?? <Globe size={18} />}</span>;
}
function duration(value: number, fallback: number) { return Number.isFinite(value) ? Math.min(2147483647, Math.max(0, value)) : fallback; }
function useReveal(keys: readonly string[], { revealed, startDelay = 320, stepInterval = 850, disabled, error, onComplete }: RevealProps, dwells: readonly number[] = []) {
  const [timed, setTimed] = useState<readonly string[]>([]);
  const count = Number.isFinite(revealed) ? Math.min(keys.length, Math.max(0, Math.floor(revealed!))) : 0;
  const known = new Set(keys);
  const shown = revealed === undefined ? timed.filter(key => known.has(key)) : keys.slice(0, count);
  const visible = new Set(shown);
  const current = shown.at(-1);
  const next = keys.find(key => !visible.has(key));
  const keySignature = JSON.stringify(keys);
  const completed = useRef(false);
  const dwell = current === undefined ? 0 : dwells[keys.indexOf(current)] ?? 0;
  const delay = current === undefined ? duration(startDelay, 320) : duration(duration(stepInterval, 850) + duration(dwell, 0), 850);
  useEffect(() => { if (revealed !== undefined) setTimed(keys.slice(0, count)); }, [revealed, keySignature]);
  useEffect(() => {
    if (revealed !== undefined || disabled || error || next === undefined) return;
    const timer = setTimeout(() => setTimed(previous => [...previous, next]), delay);
    return () => clearTimeout(timer);
  }, [revealed, disabled, error, next, delay]);
  useEffect(() => {
    if (keys.length > 0 && shown.length === keys.length && !disabled && !error && !completed.current) { completed.current = true; onComplete?.(); }
  }, [shown.length, keys.length, disabled, error, onComplete]);
  return { visible, current };
}
function TaskDisclosure({ task, visibleSteps, collapse, disabled, revealing }: { task: AgentTrailTask; visibleSteps: number; collapse: boolean; disabled?: boolean; revealing: boolean }) {
  const [open, setOpen] = useState(!collapse);
  useEffect(() => { if (collapse) setOpen(false); }, [collapse]);
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-disabled={disabled || undefined} onClick={event => { event.preventDefault(); if (!disabled) setOpen(previous => !previous); }}><span className="hk-trail-title" data-revealing={revealing}>{task.label}</span>{task.status && <span className="hk-trail-status">{task.status}</span>}</summary>
    <ol className="hk-trail-steps">{task.steps?.slice(0, visibleSteps).map((step, index) => <TrailRow key={index} className="hk-trail-row">{step.icon && <span aria-hidden="true">{step.icon}</span>}<span>{step.label}</span>{step.chips?.map((chip, chipIndex) => <span className="hk-trail-chip" title={chip.label} key={chipIndex}>{chip.icon && <span aria-hidden="true">{chip.icon}</span>}<span>{chip.label}</span></span>)}</TrailRow>)}</ol>
  </details>;
}
export function TaskList({ tasks, collapseOnComplete = false, revealed, startDelay, stepInterval, disabled, error, onComplete, className = "", ...props }: TaskListProps) {
  const detailed = tasks.some(task => task.steps !== undefined);
  const taskKeys = tasks.map(task => [JSON.stringify([task.id]), ...(task.steps?.map((_, index) => JSON.stringify([task.id, index])) ?? [])]);
  const keys = taskKeys.flat();
  const { visible } = useReveal(keys, { revealed: detailed ? revealed : revealed ?? keys.length, startDelay, stepInterval, disabled, error, onComplete });
  return <ul {...props} className={`hk-task-list hk-agent-trail ${className}`} aria-label={props["aria-label"] ?? "Task list"} aria-disabled={disabled || undefined}>
    {error && <li role="alert">{error}</li>}{tasks.length === 0 && <li>No tasks supplied.</li>}
    {tasks.map((task, index) => {
      const units = taskKeys[index];
      if (!visible.has(units[0])) return null;
      const visibleSteps = units.slice(1).filter(key => visible.has(key)).length;
      const taskComplete = visibleSteps === units.length - 1;
      const collapse = collapseOnComplete === "all" ? visible.size === keys.length : collapseOnComplete && taskComplete;
      return task.steps ? <TrailRow key={task.id} data-status={task.status} className="hk-trail-task"><TaskDisclosure task={task} visibleSteps={visibleSteps} collapse={collapse} disabled={disabled} revealing={!taskComplete && !disabled && !error} /></TrailRow> : <li key={task.id} data-status={task.status}><span aria-hidden="true">{task.status === "complete" ? "✓" : task.status === "error" ? "!" : task.status === "running" ? "◌" : "·"}</span>{task.label}</li>;
    })}
  </ul>;
}
function SourceMark({ source, disabled }: { source: WebSearchSource; disabled?: boolean }) {
  const label = `${source.title} · ${source.domain}`;
  return <Source role="link" className="hk-trail-source" href={disabled ? undefined : source.href} title={label} aria-label={label}><SiteMark brand={source.brand} icon={source.icon} /></Source>;
}
function SourceRow({ sources, disabled }: { sources: readonly WebSearchSource[]; disabled?: boolean }) {
  return <TrailRow className="hk-trail-row hk-trail-sources"><span>Sources</span><div className="hk-trail-marks">{sources.slice(0, 6).map((source, index) => <SourceMark key={index} source={source} disabled={disabled} />)}</div>{sources.length > 6 && <details className="hk-trail-overflow"><summary aria-label={`${sources.length - 6} more sources`} aria-disabled={disabled || undefined} onClick={event => { if (disabled) event.preventDefault(); }}>+{sources.length - 6}</summary><div>{sources.slice(6).map((source, index) => <SourceMark key={index} source={source} disabled={disabled} />)}</div></details>}</TrailRow>;
}
export function WebSearch({ query, searchResults = [], steps, working = "Working", revealed, startDelay, stepInterval, disabled, error, onComplete, className = "", ...props }: WebSearchProps) {
  const rows = steps?.flatMap((step, index) => [{ step, key: `${index}-step`, sources: false }, ...(step.sources?.length ? [{ step, key: `${index}-sources`, sources: true }] : [])]) ?? [];
  const { visible, current } = useReveal(rows.map(row => row.key), { revealed, startDelay, stepInterval, disabled, error, onComplete }, rows.map(row => row.sources ? 0 : row.step.dwell ?? 0));
  return <section {...props} className={`hk-web-search hk-agent-trail ${className}`} aria-label={props["aria-label"] ?? "Web search"} aria-disabled={disabled || undefined}>
    <header><h3>Web search</h3>{query && <code>{query}</code>}</header>
    {error && <p role="alert">{error}</p>}
    {steps === undefined ? searchResults.length ? <ol>{searchResults.map((result, index) => <li key={index}><Source href={disabled ? undefined : result.url} title={result.title} />{result.snippet && <p>{result.snippet}</p>}</li>)}</ol> : <p>No search results supplied.</p> : <>
      {steps.length === 0 && <p>No search steps supplied.</p>}
      <ol className="hk-trail-steps">{rows.filter(row => visible.has(row.key)).map(row => row.sources ? <SourceRow key={row.key} sources={row.step.sources!} disabled={disabled} /> : <TrailRow key={row.key} className="hk-trail-row" data-heading={row.step.heading}><SiteMark brand={row.step.brand} icon={row.step.icon} /><span className="hk-trail-title" data-revealing={row.key === current && visible.size < rows.length && !disabled && !error}>{row.step.label}</span>{row.step.query && <q>{row.step.query}</q>}{row.step.meta && <span className="hk-trail-meta">{row.step.meta}</span>}</TrailRow>)}</ol>
      {visible.size < rows.length && working !== false && !disabled && !error && <div className="hk-agent-thinking hk-trail-working" role="status"><span className="hk-agent-thinking-mark" aria-hidden="true" />{working}</div>}
    </>}
  </section>;
}
