export default function Sidebar({ items, activeItem, onSelect }) {
  return (
    <aside className="hidden w-[270px] shrink-0 rounded-md border border-gov-border bg-gov-sidebar shadow-gov lg:block">
      <div className="border-b border-gov-border px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">सेवा नेविगेशन</p>
      </div>

      <nav className="p-2">
        {items.map((item) => {
          const active = item.id === activeItem;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm ${
                active
                  ? "bg-gov-primary font-semibold text-white"
                  : "text-slate-700 hover:bg-[#ececec]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-sm border text-xs ${
                  active ? "border-white/40 bg-white/15" : "border-gov-border bg-white"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
