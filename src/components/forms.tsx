"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
const Ctx = createContext<FormState>(undefined);

/** Formulaire relié à une Server Action : validation serveur, messages et erreurs par champ. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  hideOnSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  hideOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  if (state?.ok && hideOnSuccess) return <FormMessage state={state} />;
  return (
    <Ctx.Provider value={state}>
      <form ref={ref} action={formAction} className={className} noValidate={false}>
        {children}
        <FormMessage state={state} />
      </form>
    </Ctx.Provider>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`notice ${state.ok ? "ok" : "err"}`} style={{ marginTop: 16 }}>
      {state.message}
    </p>
  );
}

export function useFieldError(name: string) {
  return useContext(Ctx)?.errors?.[name];
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  hint?: string;
  textarea?: boolean;
  options?: { value: string; label: string }[];
  className?: string;
  autoComplete?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  maxLength?: number;
};

export function Field({ name, label, type = "text", textarea, options, hint, className, defaultValue, ...rest }: FieldProps) {
  const err = useFieldError(name);
  const id = `f-${name}`;
  const common = {
    id,
    name,
    "aria-invalid": err ? true : undefined,
    "aria-describedby": err ? `${id}-err` : undefined,
    defaultValue: defaultValue ?? undefined,
    ...rest,
  };
  return (
    <label className={`field ${className ?? ""}`} htmlFor={id}>
      {label}
      {rest.required ? " *" : ""}
      {textarea ? (
        <textarea {...common} />
      ) : options ? (
        <select {...common}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} {...common} />
      )}
      {hint && <span className="hint">{hint}</span>}
      {err && (
        <span className="err" id={`${id}-err`}>
          {err}
        </span>
      )}
    </label>
  );
}

export function Check({ name, label, defaultChecked, required }: { name: string; label: ReactNode; defaultChecked?: boolean; required?: boolean }) {
  const err = useFieldError(name);
  return (
    <div>
      <label className="check">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} required={required} />
        <span>{label}</span>
      </label>
      {err && <span className="field"><span className="err">{err}</span></span>}
    </div>
  );
}

export function SubmitButton({ children, className = "btn", pendingLabel }: { children: ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Envoi…") : children}
    </button>
  );
}
