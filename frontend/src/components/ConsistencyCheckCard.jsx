export default function ConsistencyCheckCard({ warnings, hasValidated }) {
  return (
    <section className="rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">Consistency Check</h2>
        <p className="mt-1 text-sm text-slate-600">Name, address, and Aadhaar details matched across form and documents</p>
      </div>

      <div className="space-y-2 p-4">
        {!hasValidated ? (
          <div className="rounded-md border border-gov-border bg-[#fafafa] px-3 py-3 text-sm text-slate-600">
            Run validation to compare form details with uploaded documents.
          </div>
        ) : warnings?.length ? (
          warnings.map((warning) => (
            <div key={warning} className="rounded-md border border-[#f8d39f] bg-[#fff7e8] px-3 py-3 text-sm text-[#a66300]">
              ⚠ {warning}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-[#b9dfbc] bg-[#edf7ee] px-3 py-3 text-sm text-[#1b5e20]">
            All detected identity and address fields are consistent across the form and uploaded documents.
          </div>
        )}
      </div>
    </section>
  );
}
