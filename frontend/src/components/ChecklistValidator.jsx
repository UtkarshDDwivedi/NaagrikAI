export default function ChecklistValidator({ items, hasValidated }) {
  const statusClassMap = {
    pending: "border-gov-border bg-[#fafafa] text-slate-600",
    valid: "border-[#b9dfbc] bg-[#edf7ee] text-[#1b5e20]",
    invalid: "border-[#f8d39f] bg-[#fff7e8] text-[#a66300]",
    missing: "border-[#f3b7b3] bg-[#fdeeee] text-[#b71c1c]"
  };

  const statusIconMap = {
    pending: "…",
    valid: "✔",
    invalid: "!",
    missing: "❌"
  };

  return (
    <section className="rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">Document Checklist</h2>
      </div>

      <div className="space-y-2 p-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-md border px-3 py-2 text-sm ${statusClassMap[hasValidated ? item.status : "pending"]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{item.label}</span>
              <span className="font-bold">{statusIconMap[hasValidated ? item.status : "pending"]}</span>
            </div>
            {hasValidated && item.issues?.length ? (
              <p className="mt-2 text-xs">{item.issues[0]}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
