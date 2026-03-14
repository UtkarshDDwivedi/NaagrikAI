import RiskScoreCard from "./RiskScoreCard";

export default function AIValidationPanel({ validation }) {
  return (
    <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-panel backdrop-blur">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-400">AI Co-Pilot Assistant</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Pre-submission Review</h3>
      </div>

      <RiskScoreCard riskScore={validation.risk_score} riskLabel={validation.risk_label} />

      <div className="mt-6 space-y-5">
        <section>
          <h4 className="text-sm uppercase tracking-[0.25em] text-slate-400">Missing Documents</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {validation.missing_documents?.length ? (
              validation.missing_documents.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {item.replaceAll("_", " ")}
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">No missing documents</li>
            )}
          </ul>
        </section>

        <section>
          <h4 className="text-sm uppercase tracking-[0.25em] text-slate-400">AI Suggestions</h4>
          <div className="mt-3 space-y-3">
            {(validation.ai_suggestions || []).map((suggestion, index) => (
              <div key={`${suggestion.type}-${index}`} className="rounded-2xl border border-brand-400/30 bg-brand-400/10 p-4">
                <p className="text-sm text-white">{suggestion.english}</p>
                <p className="mt-2 font-hindi text-sm text-brand-50">{suggestion.hindi}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
