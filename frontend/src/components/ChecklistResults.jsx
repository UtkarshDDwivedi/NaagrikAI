function ResultList({ title, items }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <h4 className="text-sm uppercase tracking-[0.25em] text-slate-400">{title}</h4>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-300">No issues detected.</p>
        ) : (
          items.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ChecklistResults({ missingDocuments, mismatches, complianceIssues }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ResultList title="Missing Documents" items={missingDocuments} />
      <ResultList title="Document Mismatches" items={mismatches} />
      <ResultList title="Compliance Issues" items={complianceIssues} />
    </section>
  );
}
