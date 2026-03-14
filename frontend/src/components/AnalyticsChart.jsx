import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function AnalyticsChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#e4e4e4"
            },
            ticks: {
              color: "#475569"
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: "#334155"
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  return (
    <section className="rounded-md border border-gov-border bg-white shadow-gov">
      <div className="border-b border-gov-border bg-gov-section px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">रीयल टाइम सेवा विश्लेषण</h2>
      </div>
      <div className="h-[320px] p-4">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
