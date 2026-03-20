interface StatusPillProps {
  ok: boolean;
  trueLabel: string;
  falseLabel: string;
}

export function StatusPill({ ok, trueLabel, falseLabel }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-800"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {ok ? trueLabel : falseLabel}
    </span>
  );
}
