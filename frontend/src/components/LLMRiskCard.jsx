function toHindiRisk(label) {
  if (label === "High") return "उच्च";
  if (label === "Medium") return "मध्यम";
  return "कम";
}

export default function LLMRiskCard({ validation, hasValidated }) {
  const usingLlm = validation.risk_method === "llm";
  const score = Math.round(validation.risk_score ?? 0);
  const baselineScore = Math.round(validation.rule_based_risk_score ?? 0);

  return (
    <section className="rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">LLM Risk Assessment</h2>
            <p className="mt-1 text-sm text-slate-600">OpenAI-backed review with rule-based fallback</p>
          </div>
          <span
            className={
              usingLlm
                ? "rounded-full border border-[#b9dfbc] bg-[#edf7ee] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2e7d32]"
                : "rounded-full border border-[#f8d39f] bg-[#fff7e8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#a66300]"
            }
          >
            {usingLlm ? `LLM${validation.llm_model ? ` • ${validation.llm_model}` : ""}` : "Rule-based fallback"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-md border border-gov-border bg-[#fafafa] p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Displayed Risk</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{score}%</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {validation.risk_label} / {toHindiRisk(validation.risk_label)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Baseline: {baselineScore}%</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-gov-border bg-[#fcfcfc] p-3">
            <p className="text-sm font-semibold text-slate-800">Assessment Summary</p>
            <p className="mt-2 text-sm text-slate-700">
              {hasValidated
                ? validation.risk_summary || "No LLM summary available yet. Configure OPENAI_API_KEY and run validation again."
                : "Create the application and run validation to generate the risk assessment."}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-gov-border bg-white p-3">
              <p className="text-sm font-semibold text-slate-800">Why this score</p>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                {validation.risk_reasons?.length ? (
                  validation.risk_reasons.map((reason) => (
                    <p key={reason} className="rounded-md bg-[#f5f7fa] px-3 py-2">
                      {reason}
                    </p>
                  ))
                ) : (
                  <p className="rounded-md bg-[#f5f7fa] px-3 py-2">
                    {hasValidated
                      ? "Detailed LLM reasons will appear here when the API key is configured."
                      : "No risk reasons yet because validation has not been run."}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-gov-border bg-white p-3">
              <p className="text-sm font-semibold text-slate-800">Scoring Source</p>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <p className="rounded-md bg-[#f5f7fa] px-3 py-2">Displayed score: {usingLlm ? "OpenAI LLM assessment" : "Local rule engine"}</p>
                <p className="rounded-md bg-[#f5f7fa] px-3 py-2">Rule-based baseline: {baselineScore}% ({validation.rule_based_risk_label})</p>
                <p className="rounded-md bg-[#f5f7fa] px-3 py-2">
                  {usingLlm
                    ? `Model: ${validation.llm_model || "configured model"}`
                    : "Set OPENAI_API_KEY on the backend to enable the LLM result."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
