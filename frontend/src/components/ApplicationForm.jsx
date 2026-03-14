const applicationTypes = [
  "Sand Mining",
  "Limestone",
  "Brick Kiln",
  "Infrastructure Project"
];

export default function ApplicationForm({ values, onChange, onSubmit, loading }) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-400">Operator Dashboard</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Application Intake</h2>
        </div>
        <div className="rounded-full border border-brand-400/40 bg-brand-400/10 px-4 py-2 text-xs text-brand-50">
          CSC workflow
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          Application Type
          <select
            name="application_type"
            value={values.application_type}
            onChange={onChange}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
          >
            {applicationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Project Type
          <input
            name="project_type"
            value={values.project_type}
            onChange={onChange}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            placeholder="Riverbed Sand Extraction"
          />
        </label>

        <label className="text-sm text-slate-300">
          Name
          <input
            name="name"
            value={values.name}
            onChange={onChange}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
          />
        </label>

        <label className="text-sm text-slate-300">
          Aadhaar Number
          <input
            name="aadhaar_number"
            value={values.aadhaar_number}
            onChange={onChange}
            maxLength={12}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
          />
        </label>

        <label className="text-sm text-slate-300 md:col-span-2">
          Address
          <textarea
            name="address"
            value={values.address}
            onChange={onChange}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-full bg-brand-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Create Application"}
      </button>
    </form>
  );
}
