const documentFields = [
  "land_document",
  "forest_noc",
  "mining_plan",
  "kml_file",
  "affidavit",
  "drone_video"
];

export default function DocumentUpload({ values, onChange, onSubmit, disabled }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Documents</p>
        <h3 className="mt-2 text-xl font-bold text-white">Upload Metadata</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {documentFields.map((field) => (
          <label key={field} className="text-sm text-slate-300">
            {field.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}
            <input
              name={field}
              value={values[field] || ""}
              onChange={onChange}
              placeholder={`/files/${field}.pdf`}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="mt-6 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Upload Documents
      </button>
    </section>
  );
}
