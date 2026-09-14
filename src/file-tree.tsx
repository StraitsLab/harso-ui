import { createContext, useContext, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { CheckIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@phosphor-icons/react";
import { Button, type ButtonProps } from "./primitives";
import { Plan, PlanContent, PlanTrigger } from "./work";

export type FileTreeProps = Omit<ComponentPropsWithRef<"ul">, "onSelect"> & { expanded?: Set<string>; defaultExpanded?: Set<string>; selectedPath?: string | null; defaultSelectedPath?: string | null; onSelect?: (path: string) => void; onExpandedChange?: (expanded: Set<string>) => void; disabled?: boolean };
type FileTreeState = { expanded: Set<string>; selectedPath: string | null; disabled: boolean; select: (path: string) => void; expand: (path: string, open: boolean) => void };
const FileTreeContext = createContext<FileTreeState | null>(null);

function useFileTree() {
  const tree = useContext(FileTreeContext);
  if (!tree) throw new Error("FileTree rows and actions require a FileTree root.");
  return tree;
}

export function FileTree({ expanded, defaultExpanded, selectedPath, defaultSelectedPath = null, onSelect, onExpandedChange, disabled = false, className = "", children, ...props }: FileTreeProps) {
  const [localExpanded, setLocalExpanded] = useState(() => new Set(defaultExpanded));
  const [localSelected, setLocalSelected] = useState(defaultSelectedPath);
  const paths = expanded ?? localExpanded;
  const select = (path: string) => {
    if (disabled) return;
    if (selectedPath === undefined) setLocalSelected(path);
    onSelect?.(path);
  };
  const expand = (path: string, open: boolean) => {
    if (disabled || paths.has(path) === open) return;
    const next = new Set(paths);
    if (open) next.add(path); else next.delete(path);
    if (expanded === undefined) setLocalExpanded(next);
    onExpandedChange?.(new Set(next));
  };
  return <FileTreeContext value={{ expanded: paths, selectedPath: selectedPath === undefined ? localSelected : selectedPath, disabled, select, expand }}><ul aria-label="Files" {...props} role="list" className={`hk-file-tree ${className}`}>{children}</ul></FileTreeContext>;
}

export type FileTreeFolderProps = ComponentPropsWithRef<"li"> & { path: string; name: string; icon?: ReactNode; actions?: ReactNode };

export function FileTreeFolder({ path, name, icon, actions, children, className = "", ...props }: FileTreeFolderProps) {
  const tree = useFileTree();
  const open = tree.expanded.has(path);
  const selected = tree.selectedPath === path;
  return <li {...props} className={`hk-file-tree-folder ${className}`}><Plan open={open} onOpenChange={next => tree.expand(path, next)} disabled={tree.disabled}><div className="hk-file-tree-row"><PlanTrigger className="hk-file-tree-select" aria-label={name} aria-current={selected || undefined} onClick={() => tree.select(path)}><FileTreeIcon>{icon ?? (open ? <FolderOpenIcon size={18} /> : <FolderIcon size={18} />)}</FileTreeIcon><FileTreeName>{name}</FileTreeName>{selected && <CheckIcon className="hk-file-tree-selected" size={14} aria-hidden="true" />}</PlanTrigger>{actions}</div><PlanContent className="hk-file-tree-content"><ul className="hk-file-tree-children" role="list" aria-label={`${name} contents`}>{children}</ul></PlanContent></Plan></li>;
}

export type FileTreeFileProps = Omit<ButtonProps, "name" | "value"> & { path: string; name: string; icon?: ReactNode; actions?: ReactNode };

export function FileTreeFile({ path, name, icon, actions, children, disabled, onClick, className = "", ...props }: FileTreeFileProps) {
  const tree = useFileTree();
  const selected = tree.selectedPath === path;
  return <li className="hk-file-tree-file"><div className="hk-file-tree-row"><Button {...props} className={`hk-file-tree-select ${className}`} type="button" aria-label={name} aria-current={selected || undefined} disabled={disabled || tree.disabled} onClick={event => { onClick?.(event); if (!event.defaultPrevented) tree.select(path); }}><span className="hk-file-tree-chevron-slot" aria-hidden="true" />{children ?? <><FileTreeIcon>{icon ?? <FileIcon size={18} />}</FileTreeIcon><FileTreeName>{name}</FileTreeName></>}{selected && <CheckIcon className="hk-file-tree-selected" size={14} aria-hidden="true" />}</Button>{actions}</div></li>;
}

export function FileTreeIcon({ className = "", ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} aria-hidden="true" className={`hk-file-tree-icon ${className}`} />;
}

export function FileTreeName({ className = "", ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} className={`hk-file-tree-name ${className}`} />;
}

export function FileTreeActions({ disabled, onClick, onClickCapture, className = "", ...props }: ComponentPropsWithRef<"fieldset">) {
  const tree = useFileTree();
  const unavailable = disabled || tree.disabled;
  return <fieldset aria-label="File actions" {...props} disabled={unavailable} inert={unavailable || props.inert} className={`hk-file-tree-actions ${className}`} onClickCapture={event => { if (unavailable) { event.preventDefault(); event.stopPropagation(); } else onClickCapture?.(event); }} onClick={event => { event.stopPropagation(); if (!unavailable) onClick?.(event); }} />;
}
