export default function AlertBar({ alerts }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#d97706] bg-gov-primary text-white shadow-gov">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-white/30 px-4 py-3 text-sm font-bold">सूचनाएं</div>
        <div className="relative min-w-0 flex-1 overflow-hidden py-3">
          <div className="gov-marquee whitespace-nowrap text-sm">
            {alerts.map((alert, index) => (
              <span key={`${alert}-${index}`} className="mr-10 inline-block">
                {alert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
