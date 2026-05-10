import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./PriceHistoryModal.css";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const PriceHistoryModal = ({ name, platform, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/price-history?name=${encodeURIComponent(name)}&platform=${encodeURIComponent(platform)}`
        );
        const result = await res.json();
        if (result.success) setHistory(result.history);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [name, platform]);

  const labels = history.map(h =>
    new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  );
  const prices = history.map(h => h.price);

  const priceData = {
    labels,
    datasets: [{
      label: "Price (₹)",
      data: prices,
      borderColor: "rgba(0,229,201,1)",
      backgroundColor: "rgba(0,229,201,0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "rgba(0,229,201,1)",
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#131826",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#f0f2f8",
        bodyColor: "#8891a8",
        padding: 12,
        callbacks: { label: ctx => ` ₹${ctx.raw?.toLocaleString()}` }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#8891a8", font: { size: 11 } },
        border: { color: "rgba(255,255,255,0.06)" }
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#8891a8", font: { size: 11 },
          callback: v => "₹" + v?.toLocaleString()
        },
        border: { color: "rgba(255,255,255,0.06)" }
      }
    }
  };

  const minP = prices.length > 0 ? Math.min(...prices) : null;
  const maxP = prices.length > 0 ? Math.max(...prices) : null;
  const latestP = prices[prices.length - 1] || null;
  const trend = prices.length >= 2 ? (prices[prices.length - 1] - prices[0]) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className={`platform-badge ${platform}`} style={{ display: "inline-block", marginBottom: 8 }}>
              {platform?.toUpperCase()}
            </div>
            <h2>📈 Price History</h2>
            <p className="modal-product-name">{name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner" />
            <p>Loading price history...</p>
          </div>
        ) : history.length < 2 ? (
          <div className="modal-empty">
            <p>📊 Not enough data yet.</p>
            <p>Price history builds up as this product is searched over time.</p>
            <p style={{ marginTop: 8, color: "var(--text-muted)" }}>
              Currently {history.length} data {history.length === 1 ? "point" : "points"} recorded.
            </p>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="modal-stats">
              <div className="modal-stat">
                <span className="stat-label">Current</span>
                <span className="stat-value">₹{latestP?.toLocaleString()}</span>
              </div>
              <div className="modal-stat">
                <span className="stat-label">Lowest Ever</span>
                <span className="stat-value low">₹{minP?.toLocaleString()}</span>
              </div>
              <div className="modal-stat">
                <span className="stat-label">Highest Ever</span>
                <span className="stat-value high">₹{maxP?.toLocaleString()}</span>
              </div>
              <div className="modal-stat">
                <span className="stat-label">Trend</span>
                <span className={`stat-value ${trend <= 0 ? "low" : "high"}`}>
                  {trend <= 0 ? `▼ ₹${Math.abs(trend).toLocaleString()}` : `▲ ₹${trend.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* CHART */}
            <div className="modal-chart">
              <Line data={priceData} options={chartOptions} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceHistoryModal;