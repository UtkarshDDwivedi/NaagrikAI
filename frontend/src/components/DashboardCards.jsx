const toneClasses = {
  info: "border-l-gov-info bg-[#eef6fe]",
  warning: "border-l-gov-warning bg-[#fff7e8]",
  error: "border-l-gov-error bg-[#fdeeee]",
  success: "border-l-gov-success bg-[#edf7ee]"
};

export default function DashboardCards({ metrics }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.title}
          className={`rounded-md border border-gov-border border-l-4 p-4 shadow-gov ${toneClasses[metric.tone]}`}
        >
          <p className="text-sm font-medium text-slate-700">{metric.title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{metric.value}</p>
        </article>
      ))}
    </section>
  );
}
