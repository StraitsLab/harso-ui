import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button, Checkbox, Input, Progress, Select, Slider, Switch } from "./primitives";

export function CheckboxCard({ className = "", ...props }: ComponentProps<typeof Checkbox>) {
  return <Checkbox {...props} className={`hk-choice-card ${className}`} />;
}

export function SwitchCard({ className = "", ...props }: ComponentProps<typeof Switch>) {
  return <Switch {...props} className={`hk-choice-card ${className}`} />;
}

type NativeRadioDotProps = Omit<ComponentPropsWithRef<"input">, "type"> & { presentation?: false };
type PresentationRadioDotProps = Pick<ComponentPropsWithRef<"span">, "ref" | "id" | "className" | "style"> & { presentation: true; selected?: boolean; size?: "sm" | "md" };

export function RadioDot(props: NativeRadioDotProps | PresentationRadioDotProps) {
  if (props.presentation) return <span ref={props.ref} id={props.id} style={props.style} className={`hk-radio-dot hk-radio-dot--presentation hk-radio-dot--${props.size ?? "md"} ${props.className ?? ""}`} aria-hidden="true" data-selected={props.selected ?? false} />;
  const { className = "", presentation: _presentation, ...inputProps } = props;
  return <input {...inputProps} type="radio" className={`hk-radio-dot ${className}`} />;
}

export function RadioCard({ label, description, id, className = "", ...props }: Omit<NativeRadioDotProps, "children" | "presentation"> & { label: ReactNode; description?: string }) {
  const generated = useId();
  const identity = id ?? generated;
  return <label htmlFor={identity} className={`hk-choice hk-choice-card ${className}`}>
    <RadioDot {...props} id={identity} aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"] ? undefined : `${identity}-label`)} aria-describedby={[props["aria-describedby"], description ? `${identity}-description` : ""].filter(Boolean).join(" ") || undefined} />
    <span><span id={`${identity}-label`}>{label}</span>{description && <span className="hk-choice-description" id={`${identity}-description`}>{description}</span>}</span>
  </label>;
}

export function Kbd({ className = "", ...props }: ComponentPropsWithRef<"kbd">) {
  return <kbd {...props} className={`hk-kbd ${className}`} />;
}

type SelectItemProps = Omit<ComponentPropsWithRef<"option">, "children"> & { children: ReactNode; description?: string } & ({ textValue: string; value: NonNullable<ComponentPropsWithRef<"option">["value"]> } | { textValue?: undefined });

export function SelectItem({ children, description, textValue, ...props }: SelectItemProps) {
  if (textValue !== undefined) return <option {...props} label={undefined}><span className="hk-select-item-label">{textValue}</span><span className="hk-select-item-detail">{children}{description}</span></option>;
  return <option {...props}>{children}{description ? ` — ${description}` : ""}</option>;
}

export function PhoneNumberInput({ countries = [], country, defaultCountry, onCountryChange, countryLabel = "Country calling code", disabled, ...props }: Omit<ComponentProps<typeof Input>, "type" | "leading"> & { countries?: readonly { value: string; label: string; dialCode: string }[]; country?: string; defaultCountry?: string; countryLabel?: string; onCountryChange?: (country: string) => void }) {
  return <Input autoComplete={countries.length ? "tel-national" : "tel"} {...props} type="tel" disabled={disabled} leading={countries.length ? <Select aria-label={countryLabel} disabled={disabled} value={country} defaultValue={defaultCountry} onChange={event => onCountryChange?.(event.target.value)}>{countries.map(option => <option key={option.value} value={option.value}>{option.label} {option.dialCode}</option>)}</Select> : undefined} />;
}

export function InputOtp({ length = 6, groupEvery, alphabet = "numeric", onComplete, onValueChange, onChange, className = "", ...props }: Omit<ComponentProps<typeof Input>, "type" | "pattern" | "maxLength" | "minLength" | "inputMode"> & { length?: number; groupEvery?: number; alphabet?: "numeric" | "alphanumeric"; onComplete?: (value: string) => void; onValueChange?: (value: string) => void }) {
  const count = Number.isFinite(length) ? Math.max(1, Math.min(12, Math.trunc(length))) : 6;
  const group = groupEvery !== undefined && Number.isFinite(groupEvery) ? Math.max(1, Math.min(count, Math.trunc(groupEvery))) : 0;
  const root = useRef<HTMLDivElement>(null);
  const [nativeValue, setNativeValue] = useState(String(props.defaultValue ?? ""));
  useLayoutEffect(() => {
    const input = root.current?.querySelector("input");
    if (!input) return;
    const update = () => setNativeValue(input.value);
    const reset = () => queueMicrotask(update);
    update();
    input.form?.addEventListener("reset", reset);
    return () => input.form?.removeEventListener("reset", reset);
  });
  const pattern = `${alphabet === "numeric" ? "[0-9]" : "[a-zA-Z0-9]"}{${count}}`;
  const input = <Input autoComplete="one-time-code" spellCheck={false} autoCapitalize="off" {...props} type="text" inputMode={alphabet === "numeric" ? "numeric" : "text"} minLength={count} maxLength={count} pattern={pattern} className={`hk-otp ${className}`} onChange={event => {
    const value = event.currentTarget.value.replace(alphabet === "numeric" ? /[^0-9]/g : /[^a-zA-Z0-9]/g, "").slice(0, count);
    event.currentTarget.value = value;
    onChange?.(event);
    if (event.defaultPrevented || event.currentTarget.matches(":disabled") || event.currentTarget.readOnly) return;
    if (props.value === undefined) setNativeValue(value);
    onValueChange?.(value);
    if (new RegExp(`^(?:${pattern})$`).test(value)) onComplete?.(value);
  }} />;
  return group ? <div ref={root} className="hk-otp-group">{input}<span className="hk-otp-slots" aria-hidden="true">{Array.from({ length: count }, (_, index) => <span key={index} data-otp-slot data-group-start={index > 0 && index % group === 0 || undefined}>{String(props.value ?? nativeValue)[index] ?? ""}</span>)}</span></div> : input;
}

export function RangeSlider({ label, value, onValueChange, min = 0, max = 100, step = 1, name, disabled = false }: { label: string; value: readonly [number, number]; onValueChange: (value: [number, number]) => void; min?: number; max?: number; step?: number; name?: readonly [string, string]; disabled?: boolean }) {
  const identity = useId();
  const lower = useRef<HTMLInputElement>(null);
  const upper = useRef<HTMLInputElement>(null);
  const [native, setNative] = useState<{ low: string; high: string; valid: boolean } | null>(null);
  const valid = [min, max, step, (max - min) / step].every(Number.isFinite) && max > min && step > 0 && min + step > min && max - step < max && (max - min) / step <= Number.MAX_SAFE_INTEGER;
  const minimum = valid ? min : 0;
  const maximum = valid ? max : 100;
  const increment = valid ? step : 1;
  const low = Math.max(minimum, Math.min(maximum, Number.isFinite(value[0]) ? value[0] : minimum));
  const high = Math.max(low, Math.min(maximum, Number.isFinite(value[1]) ? value[1] : maximum));
  useLayoutEffect(() => {
    const inputs = [lower.current!, upper.current!];
    const next = { low: inputs[0].value, high: inputs[1].value, valid: inputs.every(input => input.validity.valid && Number.isFinite(input.valueAsNumber) && input.valueAsNumber >= minimum && input.valueAsNumber <= maximum) && inputs[0].valueAsNumber <= inputs[1].valueAsNumber };
    setNative(previous => previous?.low === next.low && previous.high === next.high && previous.valid === next.valid ? previous : next);
  });
  const change = (end: "lower" | "upper") => {
    const inputs = [lower.current!, upper.current!];
    if (!valid || disabled || inputs.some(input => input.matches(":disabled") || !input.validity.valid || !Number.isFinite(input.valueAsNumber) || input.valueAsNumber < minimum || input.valueAsNumber > maximum)) return;
    const values = inputs.map(input => input.valueAsNumber);
    onValueChange(end === "lower" ? [Math.min(values[0], values[1]), values[1]] : [values[0], Math.max(values[0], values[1])]);
  };
  return <fieldset className="hk-range-pair" disabled={disabled || !valid || !native?.valid}>
    <legend>{label}</legend>
    <div><label htmlFor={`${identity}-min`}>Minimum <span className="hk-sr-only">{label}</span></label><output htmlFor={`${identity}-min`}>{native?.low}</output></div>
    <Slider ref={lower} id={`${identity}-min`} name={name?.[0]} min={minimum} max={maximum} step={increment} value={low} onChange={() => change("lower")} />
    <div><label htmlFor={`${identity}-max`}>Maximum <span className="hk-sr-only">{label}</span></label><output htmlFor={`${identity}-max`}>{native?.high}</output></div>
    <Slider ref={upper} id={`${identity}-max`} name={name?.[1]} min={minimum} max={maximum} step={increment} value={high} onChange={() => change("upper")} />
    {!valid && <p className="hk-field-error">Range unavailable: invalid bounds or step.</p>}
    {valid && native && !native.valid && <p className="hk-field-error">Range unavailable: browser precision limit.</p>}
  </fieldset>;
}

export type FileUploadItem = { id: string; name: string; size?: number; status: "selected" | "uploading" | "complete" | "error"; progress?: number; message?: string };
export type FileUploadProps = {
  label: string; description?: string; icon?: ReactNode; accept?: string; multiple?: boolean; maxFiles?: number; maxSizeBytes?: number; disabled?: boolean;
  files?: readonly FileUploadItem[]; onFilesSelect: (files: File[]) => void; onRemove?: (id: string) => void; onRetry?: (id: string) => void;
};

export function FileUpload({ label, description, icon = "↥", accept = "", multiple = false, maxFiles = multiple ? 10 : 1, maxSizeBytes, disabled = false, files = [], onFilesSelect, onRemove, onRetry }: FileUploadProps) {
  const identity = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const select = (selection: File[]) => {
    if (disabled || picker.current?.matches(":disabled") || !selection.length) return;
    const allowed = accept.split(",").map(part => part.trim().toLowerCase()).filter(Boolean);
    const validConfiguration = Number.isInteger(maxFiles) && maxFiles > 0 && (maxSizeBytes === undefined || (Number.isFinite(maxSizeBytes) && maxSizeBytes >= 0)) && allowed.every(part => /^(\.[a-z0-9][a-z0-9._+-]*|[a-z0-9!#$&^_.+-]+\/(\*|[a-z0-9!#$&^_.+-]+))$/.test(part));
    const failures: string[] = [];
    if (!validConfiguration) failures.push("File selection configuration is invalid.");
    else {
      if (files.length + selection.length > (multiple ? maxFiles : 1)) failures.push(`At most ${multiple ? maxFiles : 1} file${multiple && maxFiles !== 1 ? "s" : ""} may be selected.`);
      for (const file of selection) {
        const type = file.type.toLowerCase();
        const matches = !allowed.length || allowed.some(part => part.startsWith(".") ? file.name.toLowerCase().endsWith(part) : part.endsWith("/*") ? type.startsWith(part.slice(0, -1)) : type === part);
        if (!matches) failures.push(`${file.name}: file type is not allowed.`);
        if (maxSizeBytes !== undefined && file.size > maxSizeBytes) failures.push(`${file.name}: file is too large (maximum ${maxSizeBytes.toLocaleString()} bytes).`);
      }
    }
    setErrors(failures);
    if (!failures.length) onFilesSelect(selection);
  };
  const statusText = { selected: "Selected", uploading: "Uploading", complete: "Complete", error: "Failed" };
  return <section className="hk-file-upload" aria-label={`${label} selection`} onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }} onDrop={event => { event.preventDefault(); select(Array.from(event.dataTransfer.files)); }}>
    <div><span className="hk-file-upload-icon" aria-hidden="true">{icon}</span> <label htmlFor={identity}>{label}</label></div>
    <p id={`${identity}-hint`} className="hk-field-hint">{description ?? "Choose files or drop them here."}</p>
    <input ref={picker} className="hk-file-picker" id={identity} type="file" accept={accept || undefined} multiple={multiple} disabled={disabled} aria-describedby={`${identity}-hint${errors.length ? ` ${identity}-errors` : ""}`} aria-invalid={errors.length > 0 || undefined} onChange={event => { select(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
    {errors.length > 0 && <ul className="hk-field-error" id={`${identity}-errors`} role="alert">{errors.map((error, index) => <li key={`${index}:${error}`}>{error}</li>)}</ul>}
    {files.length > 0 && <ul className="hk-file-list">{files.map(file => <li key={file.id}>
      <div className="hk-file-info"><span className="hk-file-name">{file.name}</span><span className="hk-field-hint">{statusText[file.status]}{file.size !== undefined && Number.isFinite(file.size) && file.size >= 0 ? ` · ${file.size.toLocaleString()} bytes` : ""}</span>{file.message && <p className={file.status === "error" ? "hk-field-error" : "hk-field-hint"}>{file.message}</p>}{file.status === "uploading" && <Progress label={`Upload progress for ${file.name}`} value={file.progress} />}</div>
      <div className="hk-file-actions">{file.status === "error" && onRetry && <Button size="small" aria-label={`Retry ${file.name}`} disabled={disabled} onClick={() => onRetry(file.id)}>Retry</Button>}{onRemove && <Button size="small" aria-label={`Remove ${file.name}`} disabled={disabled} onClick={() => onRemove(file.id)}>Remove</Button>}</div>
    </li>)}</ul>}
  </section>;
}
