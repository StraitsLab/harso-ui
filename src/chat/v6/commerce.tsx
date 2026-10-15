import { Check } from "@phosphor-icons/react";
import { v6TemplateOf } from "./registry";
import type { ReactNode } from "react";
import { HARSO_OUTPUT_CARD_CAPS, HarsoOutputActionRow, readAction, type HarsoOutputActionBlock, type HarsoOutputBlock, type HarsoOutputRow, type HarsoOutputRowsBlock } from "../output-card";
import { HarsoOutputRowStatus, readTable, type HarsoOutputTableBlock } from "../output-card-charts";
import { HarsoOutputStatusView, HarsoOutputThumb, isPhoto, readStatus, type HarsoOutputMediaHost, type HarsoOutputPhoto } from "../output-card-media";
import { V6Brand, V6Frame } from "./frame";
import type { V6Family, V6FamilyProps, V6Template, WidgetSize } from "./types";
import "./commerce.css";

/*
 * WEV-3318 (P02): price watch, compare products and product shortlist. Every word, price, star and mark comes from a
 * field the document carries; photos come only through the host. A part the document lacks is left out (no zero, no
 * blank frame), and a document this family cannot draw whole returns undefined so the generic card draws it.
 */

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** The photo's tile, or nothing: no host URL means no frame. A photo that then fails to load collapses in CSS and the text stays. */
function Photo({ photo, media, className = "" }: { photo: unknown; media: HarsoOutputMediaHost; className?: string }) {
  if (!isPhoto(photo) || !media.resolveArtifact?.(photo.artifact)) return null;
  return <span className={`hkc-v6-photo ${className}`.trim()}><HarsoOutputThumb photo={photo} host={media} /></span>;
}

/** The blocks of a document by kind, or undefined when a kind outside `allowed` is present or one repeats (the contract allows one of each). */
function parts(blocks: readonly HarsoOutputBlock[], allowed: readonly string[]) {
  const found = new Map<string, HarsoOutputBlock>();
  for (const block of blocks) {
    if (!allowed.includes(block.kind) || found.has(block.kind)) return undefined;
    found.set(block.kind, block);
  }
  return found;
}

function readRows(block: HarsoOutputBlock | undefined): HarsoOutputRowsBlock | undefined {
  const rows = block as HarsoOutputRowsBlock | undefined;
  return rows && Array.isArray(rows.items) && rows.items.length && rows.items.every(row => row && text(row.label)) ? rows : undefined;
}

const price = (row: HarsoOutputRow) => text(row.trailing) ? <span className="hkc-v6-price">{row.trailing}</span> : null;
const pick = (row: HarsoOutputRow) => row.mark === "pick" ? <span className="hkc-output-card-pick">Pick</span> : null;

/** Rows past the inline budget wait for the whole answer, said once and never silently. */
function Shown({ rows, mode }: { rows: HarsoOutputRowsBlock; mode: V6FamilyProps["mode"] }) {
  const total = Math.max(rows.total_count ?? 0, rows.items.length);
  const shown = mode === "full" ? rows.items.length : Math.min(rows.items.length, HARSO_OUTPUT_CARD_CAPS.maxRows);
  return shown < total ? <p className="hkc-v6-more">Showing {shown} of {total}</p> : null;
}
const visible = (rows: HarsoOutputRowsBlock, mode: V6FamilyProps["mode"]) => mode === "full" ? rows.items : rows.items.slice(0, HARSO_OUTPUT_CARD_CAPS.maxRows);

/** C2: the row's one link, drawn as the row's name only when the host can open it. The button stretches over its row. */
function RowName({ row, props }: { row: HarsoOutputRow; props: V6FamilyProps }) {
  const open = row.action?.kind === "open_url" ? readAction(row.action, props.host) : undefined;
  return open
    ? <button type="button" className="hkc-v6-open-row" aria-label={`${row.label}, ${open.label}`} onClick={open.run}>{row.label}</button>
    : <>{row.label}</>;
}

// ---- C6 ----

const DECIMAL = /^\d{1,15}(\.\d{1,6})?$/;
function Rating({ row }: { row: HarsoOutputRow }) {
  const { rating, review_count: count } = row;
  if (typeof rating !== "string" || !DECIMAL.test(rating) || Number(rating) > 5) return null;
  const reviews = Number.isInteger(count) && count! >= 0 ? count : undefined;
  const label = `Rated ${rating} out of 5${reviews === undefined ? "" : `, ${reviews.toLocaleString()} ${reviews === 1 ? "review" : "reviews"}`}`;
  return <span className="hkc-v6-rating" role="img" aria-label={label}>
    <span className="hkc-v6-stars" aria-hidden="true"><span style={{ width: `${Math.round(Number(rating) / 5 * 1000) / 10}%` }} /></span>
    <span>{rating}</span>
    {reviews !== undefined && <span className="hkc-v6-reviews">({reviews.toLocaleString()})</span>}
  </span>;
}

// ---- price watch ----

function priceWatch(props: V6FamilyProps) {
  const { document, mode, host, media, widgetSize } = props;
  const found = parts(document.blocks, ["status", "rows", "action", "visual"]);
  const rows = readRows(found?.get("rows"));
  if (!found || !rows) return undefined;
  const statusBlock = found.get("status");
  const status = statusBlock && readStatus(statusBlock);
  if (statusBlock && !status) return undefined;
  const visual = (found.get("visual") as { visual?: { kind?: string; artifact?: string; alt?: string } } | undefined)?.visual;
  if (found.has("visual") && visual?.kind !== "image") return undefined;
  const photo: HarsoOutputPhoto | undefined = visual && isPhoto(visual) ? { artifact: visual.artifact!, alt: visual.alt! } : undefined;
  if (found.has("visual") && !photo) return undefined;
  const live = status?.subject ? host.subjectState?.(status.subject) : undefined;
  const action = found.get("action") as HarsoOutputActionBlock | undefined;

  const shop = (row: HarsoOutputRow, index: number, link = true) => <li key={row.id ?? index} className="hkc-v6-shop">
    {text(row.brand) && <V6Brand domain={row.brand} label={row.label} renderBrand={props.renderBrand} />}
    <span className="hkc-v6-shop-main">
      <span className="hkc-v6-shop-name">{link ? <RowName row={row} props={props} /> : row.label}</span>
      {pick(row)}
      {text(row.secondary) && <span className="hkc-v6-shop-note">{row.secondary}</span>}
    </span>
    {price(row)}
  </li>;

  if (widgetSize) {
    if (widgetSize !== "small" && widgetSize !== "medium") return undefined;
    // Small has room for one shop: the one marked as the pick, else the first that gave a price. Nothing is worked out.
    const lead = rows.items.find(row => row.mark === "pick") ?? rows.items.find(row => text(row.trailing));
    const shown = widgetSize === "small" ? (lead ? [lead] : []) : rows.items;
    return <V6Frame document={{ ...document, header: { ...document.header, subtitle: undefined }, details: undefined }} mode={mode} host={host} renderBrand={props.renderBrand} className={`hkc-v6-widget hkc-v6-widget--${widgetSize}`}>
      <div className="hkc-v6-watch" data-widget={widgetSize}>
        <Photo photo={photo} media={media} />
        <div className="hkc-v6-watch-main">
          {!!shown.length && <ul className="hkc-v6-shops" role="list">{shown.map((row, index) => shop(row, index, false))}</ul>}
        </div>
      </div>
    </V6Frame>;
  }

  const shown = visible(rows, mode);
  return <V6Frame document={document} mode={mode} host={host} onOpenDetails={props.onOpenDetails} renderBrand={props.renderBrand} className="hkc-v6-commerce">
    <div className="hkc-v6-watch">
      <Photo photo={photo} media={media} />
      <ul className="hkc-v6-shops" role="list">{shown.map((row, index) => shop(row, index))}</ul>
    </div>
    <Shown rows={rows} mode={mode} />
    <div className="hkc-v6-foot">
      {status && <HarsoOutputStatusView status={status} live={live} />}
      {action && <HarsoOutputActionRow block={action} host={host} />}
    </div>
  </V6Frame>;
}

// ---- compare products ----

/** C5: a winner names one product column. The criteria column (0) and an index past the columns never win. */
const winnerOf = (table: HarsoOutputTableBlock, row: HarsoOutputTableBlock["rows"][number]) =>
  Number.isInteger(row.winner) && row.winner! > 0 && row.winner! < table.columns.length ? row.winner : undefined;

function compare(props: V6FamilyProps) {
  const { document, mode, host, media, widgetSize } = props;
  if (widgetSize) return undefined;
  const found = parts(document.blocks, ["table", "action"]);
  const table = found?.get("table") && readTable(found.get("table")!);
  if (!found || !table) return undefined;
  const action = found.get("action") as HarsoOutputActionBlock | undefined;
  const cell = (row: HarsoOutputTableBlock["rows"][number], index: number) => index === 0
    ? <th key={index} scope="row">{row.cells[0]}{(row.status || row.status_label) && <> <HarsoOutputRowStatus status={row.status} status_label={row.status_label} /></>}</th>
    : <td key={index} data-align={table.columns[index].align === "end" ? "end" : "start"} data-winner={winnerOf(table, row) === index || undefined}>
      {row.cells[index]}
      {winnerOf(table, row) === index && <span className="hkc-v6-winner"><Check size={12} weight="bold" aria-hidden="true" /><span className="hk-sr-only">Best</span></span>}
    </td>;
  return <V6Frame document={document} mode={mode} host={host} onOpenDetails={props.onOpenDetails} renderBrand={props.renderBrand} className="hkc-v6-commerce">
    <div className="hkc-v6-compare" role="region" aria-label={`${document.header.title} · table`} tabIndex={0}>
      <table className="hkc-v6-compare-table">
        <thead><tr>{table.columns.map((column, index) => <th key={index} scope="col" data-align={column.align === "end" ? "end" : "start"}>
          {index > 0 && <Photo photo={column.thumbnail} media={media} className="hkc-v6-photo--column" />}
          <span className="hkc-v6-column-name">{column.label}</span>
        </th>)}</tr></thead>
        <tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.cells.map((_, index) => cell(row, index))}</tr>)}</tbody>
        {table.totals && <tfoot><tr>{table.totals.cells.map((value, index) => index === 0
          ? <th key={index} scope="row">{value}</th> : <td key={index} data-align={table.columns[index].align === "end" ? "end" : "start"}>{value}</td>)}</tr></tfoot>}
      </table>
    </div>
    {action && <div className="hkc-v6-foot"><HarsoOutputActionRow block={action} host={host} /></div>}
  </V6Frame>;
}

// ---- product shortlist ----

function shortlist(props: V6FamilyProps) {
  const { document, mode, host, media, widgetSize } = props;
  if (widgetSize) return undefined;
  const found = parts(document.blocks, ["rows", "action"]);
  const rows = readRows(found?.get("rows"));
  if (!found || !rows) return undefined;
  const action = found.get("action") as HarsoOutputActionBlock | undefined;
  return <V6Frame document={document} mode={mode} host={host} onOpenDetails={props.onOpenDetails} renderBrand={props.renderBrand} className="hkc-v6-commerce">
    <ul className="hkc-v6-products" role="list">{visible(rows, mode).map((row, index) => <li key={row.id ?? index} className="hkc-v6-product">
      <Photo photo={row.thumbnail} media={media} className="hkc-v6-photo--row" />
      <div className="hkc-v6-product-main">
        <p className="hkc-v6-product-line"><span className="hkc-v6-product-name"><RowName row={row} props={props} /></span>{pick(row)}</p>
        {text(row.secondary) && <p className="hkc-v6-product-note">{row.secondary}</p>}
        <Rating row={row} />
      </div>
      {price(row)}
    </li>)}</ul>
    <Shown rows={rows} mode={mode} />
    {action && <div className="hkc-v6-foot"><HarsoOutputActionRow block={action} host={host} /></div>}
  </V6Frame>;
}

// ---- the family ----

const DRAW: Partial<Record<V6Template, (props: V6FamilyProps) => ReactNode | undefined>> = { "price-watch": priceWatch, "compare-products": compare, "product-shortlist": shortlist };

export const family: V6Family = {
  renderFamily(props) {
    const template = v6TemplateOf(props.document);
    const draw = template && Object.hasOwn(DRAW, template) ? DRAW[template] : undefined;
    // A block the host marked loading, empty, partial, stale or failed is the generic card's to say; this card draws ready data only.
    const ready = Object.values(props.host.blockStates ?? {}).every(state => !state || state.state === "ready");
    return draw && ready ? draw(props) : undefined;
  },
  supportedWidgetSizes: (template): readonly WidgetSize[] => template === "price-watch" ? ["small", "medium"] : []
};
