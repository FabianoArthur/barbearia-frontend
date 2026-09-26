import { DEMO_ACCOUNTS } from "./handlers";

/** Thin notice shown on every page of the demo build. */
export default function DemoBanner() {
  const base = import.meta.env.BASE_URL;
  return (
    <div
      role="note"
      className="bg-primary px-4 py-2 text-center text-xs text-primary-foreground sm:text-sm"
    >
      <strong>Demo</strong> — dados fictícios, sem backend. Entre como{" "}
      <a className="font-semibold underline" href={`${base}manager?as=manager`}>
        gerente
      </a>{" "}
      ou{" "}
      <a className="font-semibold underline" href={`${base}barber?as=barber`}>
        barbeiro
      </a>{" "}
      (ou use <code>{DEMO_ACCOUNTS.manager}</code> /{" "}
      <code>{DEMO_ACCOUNTS.barber}</code> com qualquer senha).
    </div>
  );
}
