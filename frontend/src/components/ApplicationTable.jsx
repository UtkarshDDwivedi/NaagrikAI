const riskClassMap = {
  कम: "bg-[#eef6fe] text-[#1565c0]",
  मध्यम: "bg-[#fff7e8] text-[#a66300]",
  उच्च: "bg-[#fdeeee] text-[#c62828]"
};

const statusClassMap = {
  लंबित: "bg-[#fff7e8] text-[#a66300]",
  "सुधार आवश्यक": "bg-[#fdeeee] text-[#c62828]",
  "समीक्षा पूर्ण": "bg-[#edf7ee] text-[#2e7d32]"
};

export default function ApplicationTable({ rows, onOpen, onDelete }) {
  return (
    <section className="min-w-0 rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">आवेदन सूची</h2>
        <p className="mt-1 text-sm text-slate-600">किसी भी पंक्ति पर क्लिक करके आवेदन खोलें</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f3f3f3] text-left text-slate-700">
              <th className="border-b border-gov-border px-4 py-3 font-semibold">नागरिक</th>
              <th className="border-b border-gov-border px-4 py-3 font-semibold">सेवा</th>
              <th className="border-b border-gov-border px-4 py-3 font-semibold">स्थिति</th>
              <th className="border-b border-gov-border px-4 py-3 font-semibold">जोखिम</th>
              <th className="border-b border-gov-border px-4 py-3 font-semibold">AI चेतावनी</th>
              <th className="border-b border-gov-border px-4 py-3 font-semibold">कार्य</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.id}-${row.citizen}`}
                onClick={() => onOpen?.(row)}
                className="cursor-pointer odd:bg-white even:bg-[#fafafa] hover:bg-[#fff9ef]"
              >
                <td className="border-b border-gov-border px-4 py-3 font-medium text-slate-800">{row.citizen}</td>
                <td className="border-b border-gov-border px-4 py-3 text-slate-700">{row.service}</td>
                <td className="border-b border-gov-border px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClassMap[row.status] || "bg-[#ececec] text-slate-700"}`}>
                    {row.status}
                  </span>
                </td>
                <td className="border-b border-gov-border px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${riskClassMap[row.risk] || "bg-[#ececec] text-slate-700"}`}>
                    {row.risk}
                  </span>
                </td>
                <td className="border-b border-gov-border px-4 py-3 text-slate-700">{row.aiWarning}</td>
                <td className="border-b border-gov-border px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen?.(row);
                      }}
                      className="gov-table-action gov-table-action-success"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(row);
                      }}
                      className="gov-table-action gov-table-action-danger"
                    >
                      Delete
                    </button>
                    <button type="button" className="gov-table-action gov-table-action-warning">
                      {row.action}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
