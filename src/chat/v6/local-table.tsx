"use client";

import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { HarsoOutputRowStatus, isTotalRow, type HarsoOutputTableBlock, type HarsoOutputTableRow } from "../output-card-charts";
import "./local-controls.css";

/*
 * P9: a table whose headers sort the rows the answer already carries. Nothing is requested and the received block is
 * never changed: the order is view state over row positions. The same rules run in apps/ios `LocalTable.swift`.
 *
 * Order of the cells in one column, the same on both platforms:
 *   1. A cell that is exactly a contract decimal (`-?` 1-15 digits, optional `.` and 1-6 digits) is a number. Numbers
 *      compare exactly (scaled integers, no floats) and come before every other cell.
 *   2. Any other cell is text. Text compares by Unicode code point, with no locale, case folding or normalisation.
 *   3. Cells that compare equal keep their source order, in both directions.
 * Currency, dates, units and thousands separators are never parsed out of prose: "S$96,300" and "9 Oct" are text.
 * Totals are not rows of the body: they stay below it. Every received row is sorted before `shown` cuts the list.
 */

export type LocalDirection = "ascending" | "descending";
export type LocalOrder = "source" | { column: number; direction: LocalDirection };

const DECIMAL = /^(-?)([0-9]{1,15})(?:\.([0-9]{1,6}))?$/;
const scaled = (text: string) => {
  const match = DECIMAL.exec(text);
  return match ? (match[1] ? -1n : 1n) * (BigInt(match[2]) * 1_000_000n + BigInt((match[3] ?? "").padEnd(6, "0"))) : undefined;
};

/** -1, 0 or 1: the one documented order of two cells (see the header). */
export function compareCells(a: string, b: string): number {
  const x = scaled(a), y = scaled(b);
  if (x !== undefined && y !== undefined) return x < y ? -1 : x > y ? 1 : 0;
  if (x !== undefined) return -1;
  if (y !== undefined) return 1;
  const p = Array.from(a, char => char.codePointAt(0)!), q = Array.from(b, char => char.codePointAt(0)!);
  for (let i = 0; i < Math.min(p.length, q.length); i++) if (p[i] !== q[i]) return p[i] < q[i] ? -1 : 1;
  return Math.sign(p.length - q.length);
}

/** One header tap: source, ascending, descending, source. A tap on another column starts that column ascending. */
export function nextOrder(current: LocalOrder, column: number): LocalOrder {
  if (current === "source" || current.column !== column) return { column, direction: "ascending" };
  return current.direction === "ascending" ? { column, direction: "descending" } : "source";
}

/** Body rows in display order (positions in `body`), ties kept in source order whichever way the column runs. */
function sortedPositions(body: HarsoOutputTableRow[], order: LocalOrder) {
  const positions = body.map((_, index) => index);
  if (order === "source") return positions;
  const sign = order.direction === "ascending" ? 1 : -1;
  return positions.sort((i, j) => sign * compareCells(body[i].cells[order.column], body[j].cells[order.column]) || i - j);
}

const sortName = (label: string, order: LocalOrder, column: number) =>
  order !== "source" && order.column === column ? `${label}, ${order.direction}` : label;

function SortIcon({ order, column }: { order: LocalOrder; column: number }) {
  const Icon = order === "source" || order.column !== column ? CaretUpDown : order.direction === "ascending" ? CaretUp : CaretDown;
  return <Icon size={12} weight="bold" aria-hidden="true" />;
}

export interface LocalTableProps {
  table: HarsoOutputTableBlock;
  /** Where the table starts. A column the table does not have means source order. */
  initialOrder?: LocalOrder;
  /** The most body rows drawn, counted after sorting. Every received row is sorted; default all. */
  shown?: number;
  /** The card title, for the region name. */
  label?: string;
}

export function LocalTable({ table, initialOrder = "source", shown = Infinity, label }: LocalTableProps) {
  const container = useRef<HTMLDivElement>(null);
  const natural = useRef<HTMLTableElement>(null);
  const [stacked, setStacked] = useState(false);
  const [requested, setRequested] = useState<LocalOrder>(initialOrder);
  const [message, setMessage] = useState("");
  const order: LocalOrder = requested !== "source" && Number.isInteger(requested.column) && requested.column >= 0 && requested.column < table.columns.length ? requested : "source";

  const total: HarsoOutputTableRow | undefined = table.totals ?? (isTotalRow(table, table.rows.length - 1) ? table.rows[table.rows.length - 1] : undefined);
  const rows = useMemo(() => {
    const body = total && !table.totals ? table.rows.slice(0, -1) : table.rows;
    return sortedPositions(body, order).slice(0, shown).map(position => ({ row: body[position], position }));
  }, [table, total, order, shown]);

  const tap = (column: number) => {
    const next = nextOrder(order, column);
    setRequested(next);
    setMessage(next === "source" ? "Original order" : `Sorted by ${table.columns[column].label}, ${next.direction}`);
  };
  const align = (index: number) => table.columns[index].align === "end" ? "end" : "start";

  // Same measure as the card's table: stack the rows when the table needs more than its box. The drawn rows decide the width.
  useLayoutEffect(() => {
    const element = container.current, probe = natural.current;
    if (!element || !probe) return;
    const measure = () => {
      if (element.clientWidth <= 0) return;
      const width = probe.style.width;
      probe.style.width = "max-content";
      const required = probe.offsetWidth;
      probe.style.width = width;
      setStacked(required > element.clientWidth);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    observer?.observe(probe);
    let live = true;
    const loaded = () => { if (live) measure(); };
    const faces = globalThis.document?.fonts;
    faces?.ready.then(loaded);
    faces?.addEventListener?.("loadingdone", loaded);
    return () => { live = false; observer?.disconnect(); faces?.removeEventListener?.("loadingdone", loaded); };
  }, [rows, total]);

  const status = (row: HarsoOutputTableRow) => (row.status || row.status_label) && <> <HarsoOutputRowStatus status={row.status} status_label={row.status_label} /></>;
  return <div ref={container} className="hkc-output-table-scroll" role="region" aria-label={label ? `${label} · table` : "Table"} tabIndex={stacked ? undefined : 0}>
    <span className="hk-sr-only" role="status">{message}</span>
    {stacked && <div className="hkc-local-sortbar" role="group" aria-label="Sort by">
      <span aria-hidden="true">Sort by</span>
      {table.columns.map((column, index) => <button key={index} type="button" className="hkc-local-sort" data-sorted={order !== "source" && order.column === index ? "" : undefined}
        aria-label={sortName(column.label, order, index)} onClick={() => tap(index)}>{column.label}<SortIcon order={order} column={index} /></button>)}
    </div>}
    <div className={stacked ? "hkc-output-table-probe" : undefined} aria-hidden={stacked || undefined}>
      <table ref={natural} className="hkc-output-table">
        <thead><tr>{table.columns.map((column, index) => <th key={index} scope="col" data-align={align(index)} aria-sort={order !== "source" && order.column === index ? order.direction : undefined}>
          <button type="button" className="hkc-local-sort" tabIndex={stacked ? -1 : undefined} onClick={() => tap(index)}>{column.label}<SortIcon order={order} column={index} /></button>
        </th>)}</tr></thead>
        <tbody>
          {rows.map(({ row, position }) => <tr key={position}>{row.cells.map((cell, index) => index === 0
            ? <th key={index} scope="row" data-align={align(index)}>{cell}{status(row)}</th>
            : <td key={index} data-align={align(index)}>{cell}</td>)}</tr>)}
          {total && <tr className="hkc-output-table-total">{total.cells.map((cell, index) => index === 0
            ? <th key={index} scope="row" data-align={align(index)}>{cell}{status(total)}</th>
            : <td key={index} data-align={align(index)}>{cell}</td>)}</tr>}
        </tbody>
      </table>
    </div>
    {stacked && <ul className="hkc-output-table-items" role="list">
      {[...rows.map(({ row, position }) => ({ row, key: position, isTotal: false })), ...total ? [{ row: total, key: -1, isTotal: true }] : []].map(({ row, key, isTotal }) =>
        <li key={key} className={isTotal ? "hkc-output-table-item hkc-output-table-total" : "hkc-output-table-item"}>
          <div className="hkc-output-table-name">{row.cells[0]}{status(row)}</div>
          <dl className="hkc-output-table-values">{row.cells.slice(1).map((cell, index) => <div key={index}>
            <dt>{table.columns[index + 1].label}</dt><dd data-align="end">{cell}</dd>
          </div>)}</dl>
        </li>)}
    </ul>}
  </div>;
}
