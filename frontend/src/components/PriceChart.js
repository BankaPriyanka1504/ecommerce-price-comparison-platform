import React, { useState } from "react";
import {
  Chart as ChartJS,
  BarElement, CategoryScale, LinearScale,
  ArcElement, Tooltip, Legend,
  RadialLinearScale, PointElement, LineElement, Filler
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
  RadialLinearScale, PointElement, LineElement, Filler
);

const parsePrice = (p) => parseInt(String(p || "0").replace(/[^\d]/g, "")) || 0;
const parseRating = (r) => {
  if (!r || r === "N/A" || r === "No rating") return null;
  const m = String(r).match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

const PLATFORM_COLORS = {
  AMAZON: { bar: "rgba(255,153,0,0.85)", border: "#ff9900", radar: "rgba(255,153,0,0.2)" },
  MYNTRA: { bar: "rgba(255,107,138,0.85)", border: "#ff6b8a", radar: "rgba(255,107,138,0.2)" },
};

const tooltipDefaults = {
  backgroundColor: "#131826",
  borderColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  titleColor: "#f0f2f8",
  bodyColor: "#8891a8",
  padding: 14,
  cornerRadius: 10,
};

const axisDefaults = {
  x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8891a8", font: { size: 12 } }, border: { color: "rgba(255,255,255,0.06)" } },
  y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8891a8", font: { size: 12 } }, border: { color: "rgba(255,255,255,0.06)" } }
};

export default function PriceChart({ data }) {
  const [activeChart, setActiveChart] = useState("price");
  if (!data) return null;

  // ── Build per-platform aggregates ──
  const platforms = [];
  ["amazon", "myntra"].forEach(key => {
    const items = data[key] || [];
    if (!items.length) return;
    const prices  = items.map(i => parsePrice(i.price)).filter(p => p > 0);
    const ratings = items.map(i => parseRating(i.rating)).filter(r => r !== null);
    if (!prices.length) return;
    platforms.push({
      key,
      label: key.toUpperCase(),
      count:    items.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      avgRating: ratings.length ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0,
      items,
    });
  });

  if (!platforms.length) return null;

  const labels      = platforms.map(p => p.label);
  const colorArray  = labels.map(l => PLATFORM_COLORS[l] || PLATFORM_COLORS.AMAZON);

  // ── Best platform score (lower price + higher rating = better) ──
  const maxAvgPrice  = Math.max(...platforms.map(p => p.avgPrice));
  const scored = platforms.map(p => ({
    ...p,
    score: ((1 - p.avgPrice / maxAvgPrice) * 60) + (p.avgRating / 5) * 40
  }));
  const best = scored.reduce((a, b) => b.score > a.score ? b : a);
  const worst = scored.reduce((a, b) => b.score < a.score ? b : a);

  // ── Cheapest single item across ALL platforms ──
  const allItems = platforms.flatMap(p => p.items.map(i => ({ ...i, platform: p.key })));
  const cheapest = allItems.reduce((a, b) => parsePrice(a.price) < parsePrice(b.price) ? a : b, allItems[0]);

  // ══════════════════════════════════
  // CHART 1: Price Range — min to max bar showing the spread
  // ══════════════════════════════════
  const priceRangeData = {
    labels,
    datasets: [
      {
        label: "Lowest Price (₹)",
        data: platforms.map(p => p.minPrice),
        backgroundColor: colorArray.map(c => c.bar),
        borderColor: colorArray.map(c => c.border),
        borderWidth: 1, borderRadius: 6, borderSkipped: false,
      },
      {
        label: "Average Price (₹)",
        data: platforms.map(p => p.avgPrice),
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1, borderRadius: 6, borderSkipped: false,
      },
      {
        label: "Highest Price (₹)",
        data: platforms.map(p => p.maxPrice),
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1, borderRadius: 6, borderSkipped: false,
      },
    ]
  };
  const priceRangeOpts = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { color: "#8891a8", font: { size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` ₹${ctx.raw?.toLocaleString()}` } }
    },
    scales: { ...axisDefaults, y: { ...axisDefaults.y, ticks: { ...axisDefaults.y.ticks, callback: v => "₹" + v.toLocaleString() } } }
  };

  // ══════════════════════════════════
  // CHART 2: Value Score — composite score doughnut
  // ══════════════════════════════════
  const valueScoreData = {
    labels: scored.map(p => p.label),
    datasets: [{
      data: scored.map(p => Math.round(p.score)),
      backgroundColor: scored.map(p => (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).bar),
      borderColor: "#0d1120", borderWidth: 3, hoverOffset: 8
    }]
  };
  const valueScoreOpts = {
    responsive: true, cutout: "65%",
    plugins: {
      legend: { position: "bottom", labels: { color: "#8891a8", font: { size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` Value Score: ${ctx.raw}/100` } }
    }
  };

  // ══════════════════════════════════
  // CHART 3: Radar — multi-dimension comparison
  // ══════════════════════════════════
  const radarMax = { price: maxAvgPrice, rating: 5, count: Math.max(...platforms.map(p => p.count)) };
  const radarData = {
    labels: ["Price\n(lower=better)", "Rating", "No. of\nResults"],
    datasets: platforms.map(p => ({
      label: p.label,
      data: [
        Math.round((1 - p.avgPrice / radarMax.price) * 100),
        Math.round((p.avgRating / 5) * 100),
        Math.round((p.count / radarMax.count) * 100),
      ],
      backgroundColor: (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).radar,
      borderColor: (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).border,
      borderWidth: 2, pointBackgroundColor: (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).border,
      pointRadius: 4,
    }))
  };
  const radarOpts = {
    responsive: true,
    scales: {
      r: {
        min: 0, max: 100,
        grid: { color: "rgba(255,255,255,0.06)" },
        angleLines: { color: "rgba(255,255,255,0.06)" },
        pointLabels: { color: "#8891a8", font: { size: 11 } },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { position: "bottom", labels: { color: "#8891a8", font: { size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}/100` } }
    }
  };

  const chartTabs = [
    { key: "price",  label: "💰 Price Range" },
    { key: "value",  label: "🏅 Value Score" },
    { key: "radar",  label: "🕸️ Full Comparison" },
  ];

  return (
    <div className="premium-chart">

      {/* HEADER */}
      <div className="chart-header">
        <h2>📊 Smart Comparison Dashboard</h2>
        <p>Detailed price, rating & value analysis across platforms</p>
      </div>

      {/* QUICK INSIGHT CARDS */}
      <div className="insight-cards">
        <div className="insight-card green">
          <div className="insight-icon">🏆</div>
          <div className="insight-body">
            <div className="insight-label">Best Overall Platform</div>
            <div className="insight-value">{best.label}</div>
            <div className="insight-sub">Avg ₹{best.avgPrice.toLocaleString()} · ⭐{best.avgRating || "N/A"}</div>
          </div>
        </div>
        <div className="insight-card cyan">
          <div className="insight-icon">💸</div>
          <div className="insight-body">
            <div className="insight-label">Cheapest Single Item</div>
            <div className="insight-value">{cheapest.price}</div>
            <div className="insight-sub">{cheapest.platform?.toUpperCase()} · {cheapest.name?.slice(0, 30)}...</div>
          </div>
        </div>
        <div className="insight-card gold">
          <div className="insight-icon">📉</div>
          <div className="insight-body">
            <div className="insight-label">Lowest Avg Price</div>
            <div className="insight-value">₹{Math.min(...platforms.map(p => p.avgPrice)).toLocaleString()}</div>
            <div className="insight-sub">{platforms.find(p => p.avgPrice === Math.min(...platforms.map(x => x.avgPrice)))?.label}</div>
          </div>
        </div>
        <div className="insight-card red">
          <div className="insight-icon">⭐</div>
          <div className="insight-body">
            <div className="insight-label">Highest Rated Platform</div>
            <div className="insight-value">{platforms.reduce((a, b) => b.avgRating > a.avgRating ? b : a).label}</div>
            <div className="insight-sub">Avg rating {platforms.reduce((a, b) => b.avgRating > a.avgRating ? b : a).avgRating} / 5.0</div>
          </div>
        </div>
      </div>

      {/* CHART TABS */}
      <div className="chart-tabs">
        {chartTabs.map(tab => (
          <button key={tab.key}
            className={`chart-tab ${activeChart === tab.key ? "active" : ""}`}
            onClick={() => setActiveChart(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CHART AREA */}
      <div className="chart-area">

        {/* Price Range Chart */}
        {activeChart === "price" && (
          <div className="chart-panel">
            <div className="chart-explain">
              <h3>💰 Price Range Comparison</h3>
              <p>This chart shows the <strong>lowest</strong>, <strong>average</strong>, and <strong>highest</strong> prices found for this product across each platform. A shorter gap between the bars means prices are consistent. A large gap means prices vary a lot — worth comparing individual items carefully.</p>
            </div>
            <div className="chart-wrap">
              <Bar data={priceRangeData} options={priceRangeOpts} />
            </div>
            <div className="chart-takeaway">
              💡 <strong>Takeaway:</strong> The platform with the lowest "Lowest Price" bar is where you can find the best single deal. The "Average Price" bar shows what most items cost there.
            </div>
          </div>
        )}

        {/* Value Score Doughnut */}
        {activeChart === "value" && (
          <div className="chart-panel">
            <div className="chart-explain">
              <h3>🏅 Platform Value Score</h3>
              <p>We calculate a <strong>composite value score (0–100)</strong> for each platform by combining two factors: <strong>Price (60%)</strong> — platforms with lower average prices score higher, and <strong>Rating (40%)</strong> — platforms with higher-rated products score higher. This gives you one number to compare "which platform gives you more for your money."</p>
            </div>
            <div className="chart-wrap doughnut-wrap">
              <Doughnut data={valueScoreData} options={valueScoreOpts} />
              <div className="doughnut-center">
                <span className="doughnut-center-label">Best Value</span>
                <span className="doughnut-center-value">{best.label}</span>
              </div>
            </div>
            <div className="score-breakdown">
              {scored.map(p => (
                <div className="score-row" key={p.key}>
                  <span className="score-platform">{p.label}</span>
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{
                      width: `${p.score}%`,
                      background: (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).border
                    }} />
                  </div>
                  <span className="score-num">{Math.round(p.score)}/100</span>
                </div>
              ))}
            </div>
            <div className="chart-takeaway">
              💡 <strong>Takeaway:</strong> {best.label} has the best overall value score. {worst.label !== best.label ? `${worst.label} scores lower — either prices are higher or ratings are lower.` : "Both platforms score similarly."}
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {activeChart === "radar" && (
          <div className="chart-panel">
            <div className="chart-explain">
              <h3>🕸️ Multi-Dimension Comparison</h3>
              <p>This radar chart compares platforms across <strong>3 dimensions</strong> simultaneously — all scored 0 to 100. <strong>Price</strong> (higher = cheaper relative to others), <strong>Rating</strong> (higher = better-rated products), and <strong>Results</strong> (higher = more products found). A platform with a larger filled area is generally better across all dimensions.</p>
            </div>
            <div className="chart-wrap radar-wrap">
              <Radar data={radarData} options={radarOpts} />
            </div>
            <div className="radar-legend">
              {platforms.map(p => (
                <div className="radar-legend-item" key={p.key}>
                  <span className="radar-dot" style={{ background: (PLATFORM_COLORS[p.label] || PLATFORM_COLORS.AMAZON).border }} />
                  <strong>{p.label}</strong>
                  <span>Price score: {Math.round((1 - p.avgPrice / maxAvgPrice) * 100)}</span>
                  <span>Rating: {p.avgRating}/5</span>
                  <span>{p.count} results</span>
                </div>
              ))}
            </div>
            <div className="chart-takeaway">
              💡 <strong>Takeaway:</strong> Look for the platform whose shaded area covers the most of the chart — that platform performs best across price, quality, and selection.
            </div>
          </div>
        )}

      </div>

      {/* RECOMMENDED PLATFORM */}
      <div className="best-platform">
        <h2>🏆 Recommended Platform</h2>
        <div className="best-box">
          <h3>{best.label}</h3>
          <p>Average price starting at ₹{best.avgPrice.toLocaleString()}</p>
          <p>Average rating: {best.avgRating || "N/A"} / 5.0</p>
          <p>{best.count} products found</p>
          <p style={{ marginTop: 8, color: "var(--cyan)", fontSize: 13 }}>Value Score: {Math.round(best.score)} / 100</p>
        </div>
      </div>

    </div>
  );
}