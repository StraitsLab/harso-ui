import type { ComponentProps, ComponentPropsWithRef, ReactNode } from "react";
import { ArrowsDownUpIcon, ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { Button, Checkbox, IconButton } from "./primitives";
import { Pagination, Tooltip } from "./navigation";

export type TableProps = ComponentPropsWithRef<"table"> & { caption: string; size?: "md" | "sm"; captionContent?: ReactNode };

export function Table({ caption, size = "md", captionContent, children, className = "", ...props }: TableProps) {
  return <div className="hk-table-scroll" role="region" aria-label={`${caption} table`} tabIndex={0}><table aria-label={caption} {...props} className={`hk-table ${className}`} data-size={size}><caption>{caption}{captionContent}</caption>{children}</table></div>;
}

export type DataColumn<Row> = { id: string; label: string; render: (row: Row) => ReactNode; sortable?: boolean; align?: "start" | "end" };
export type DataSort = { column: string; direction: "ascending" | "descending" } | null;
export type DataTableProps<Row> = {
  caption: string;
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  rowId: (row: Row) => string;
  rowLabel: (row: Row) => string;
  isRowDisabled?: (row: Row) => boolean;
  selectedIds?: readonly string[];
  onSelectionChange?: (visibleIds: string[], selected: boolean) => void;
  sort?: DataSort;
  onSortChange?: (sort: DataSort) => void;
  pagination?: ComponentProps<typeof Pagination>;
  toolbar?: ReactNode;
  footer?: ReactNode;
  size?: "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
};

function uniqueIds(values: readonly string[]) {
  return values.every(value => typeof value === "string" && value.trim().length > 0) && new Set(values).size === values.length;
}

export function DataTable<Row>({ caption, rows, columns, rowId, rowLabel, isRowDisabled, selectedIds, onSelectionChange, sort = null, onSortChange, pagination, toolbar, footer, size, disabled = false, loading = false, error, emptyMessage = "No rows to display." }: DataTableProps<Row>) {
  const identities = rows.map(rowId);
  const safeColumns = uniqueIds(columns.map(column => column.id)) ? columns : [];
  const invalid = !uniqueIds(identities) || !safeColumns.length;
  const problem = invalid ? "Tables need unique, non-empty row and column IDs." : error;
  const blocked = disabled || loading || !!problem;
  const showSelection = selectedIds !== undefined || !!onSelectionChange;
  const selected = new Set(selectedIds ?? []);
  const eligible = invalid ? [] : identities.filter((_, index) => !isRowDisabled?.(rows[index]));
  const selectedCount = eligible.filter(identity => selected.has(identity)).length;
  const message = problem || (loading ? "Loading rows…" : !rows.length ? emptyMessage : undefined);
  return <div className="hk-data-table" aria-busy={loading || undefined}>
    <Table caption={caption} size={size} captionContent={toolbar && <div className="hk-data-toolbar">{toolbar}</div>}><thead><tr>
      {showSelection && <th scope="col" className="hk-table-selection"><Checkbox label={<span className="hk-sr-only">Select visible rows</span>} checked={!!eligible.length && selectedCount === eligible.length} indeterminate={selectedCount > 0 && selectedCount < eligible.length} disabled={blocked || !eligible.length || !onSelectionChange} onChange={event => { if (!blocked) onSelectionChange?.(eligible, event.target.checked); }} /></th>}
      {safeColumns.length ? safeColumns.map(column => <th key={column.id} scope="col" data-align={column.align} aria-sort={column.sortable ? sort?.column === column.id ? sort.direction : "none" : undefined}>{column.sortable && onSortChange ? <Button variant="ghost" size="small" disabled={blocked} aria-label={`Sort by ${column.label}`} onClick={() => onSortChange(sort?.column !== column.id ? { column: column.id, direction: "ascending" } : sort.direction === "ascending" ? { column: column.id, direction: "descending" } : null)}>{column.label}<span aria-hidden="true">{sort?.column === column.id ? sort.direction === "ascending" ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} /> : <ArrowsDownUpIcon size={16} />}</span></Button> : column.label}</th>) : <th scope="col">Details</th>}
    </tr></thead><tbody>{message ? <tr><td colSpan={Math.max(1, safeColumns.length) + (showSelection ? 1 : 0)} className="hk-table-message"><span role={problem ? "alert" : "status"}>{message}</span></td></tr> : rows.map((row, index) => <tr key={identities[index]} data-selected={showSelection && selected.has(identities[index]) || undefined}>
      {showSelection && <td className="hk-table-selection"><Checkbox label={<span className="hk-sr-only">Select {rowLabel(row)}</span>} checked={selected.has(identities[index])} disabled={blocked || !!isRowDisabled?.(row) || !onSelectionChange} onChange={event => { if (!blocked && !isRowDisabled?.(row)) onSelectionChange?.([identities[index]], event.target.checked); }} /></td>}
      {safeColumns.map(column => <td key={column.id} data-label={column.label} data-align={column.align}>{column.render(row)}</td>)}
    </tr>)}</tbody></Table>
    {(footer || pagination) && <div className="hk-data-footer">{footer}{pagination && <Pagination {...pagination} label={pagination.label ?? `${caption} pages`} disabled={blocked || pagination.disabled} />}</div>}
  </div>;
}

export type StatItem = { id: string; label: string; value: ReactNode; delta?: ReactNode; trend?: "positive" | "negative" | "neutral"; caption?: string; hint?: string; tone?: "blue" | "orange" | "purple" | "pink" | "sky" | "emerald" };

export function StatCards({ label, items, variant = "plain", className = "" }: { label: string; items: readonly StatItem[]; variant?: "plain" | "footer"; className?: string }) {
  return <dl className={`hk-stat-cards ${className}`} aria-label={label} data-variant={variant}>{items.map(item => <div key={item.id} className="hk-stat" data-tone={item.tone}>
    <dt><span>{item.label}</span>{item.hint && <Tooltip content={item.hint}><IconButton label={`About ${item.label}`}><span aria-hidden="true">ⓘ</span></IconButton></Tooltip>}</dt>
    <dd><span className="hk-stat-value">{item.value}</span>{item.delta !== undefined && <span className="hk-stat-delta" data-trend={item.trend ?? "neutral"}>{item.delta}</span>}{item.caption && <span className="hk-stat-caption">{item.caption}</span>}</dd>
  </div>)}</dl>;
}
