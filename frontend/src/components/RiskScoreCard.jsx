export default function RiskScoreCard({ riskScore, riskLabel }) {
  const palette =
    riskLabel === "High"
      ? "from-rose-500/30 to-orange-500/20 text-rose-200"
      : riskLabel === "Medium"
        ? "from-amber-400/30 to-yellow-200/10 text-amber-100"
        : "from-emerald-400/30 to-lime-300/10 text-emerald-100";

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${palette} p-5`}>
      <p className="text-xs uppercase tracking-[0.3em]">Rejection Risk</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-bold">{Math.round(riskScore || 0)}%</span>
        <span className="mb-1 rounded-full border border-white/20 px-3 py-1 text-sm">{riskLabel || "Low"}</span>
      </div>
    </div>
  );
}
