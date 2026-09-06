import React, { useState } from 'react';

interface EquityPoint {
  timestamp: string;
  equity: number;
  cash: number;
  drawdown: number;
}

interface EquityCurveChartProps {
  data: EquityPoint[];
  height?: number;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data, height = 260 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500 bg-[#0d1322] rounded-xl border border-slate-800">
        No equity curve data available
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = 800; // viewBox width

  const equities = data.map((d) => d.equity);
  const minEquity = Math.floor(Math.min(...equities) * 0.98);
  const maxEquity = Math.ceil(Math.max(...equities) * 1.02);

  const getX = (index: number) => {
    const divisor = Math.max(1, data.length - 1);
    return padding.left + (index / divisor) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    return height - padding.bottom - ((val - minEquity) / (maxEquity - minEquity || 1)) * (height - padding.top - padding.bottom);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(' ');
  const areaPoints = `${getX(0)},${height - padding.bottom} ${points} ${getX(data.length - 1)},${height - padding.bottom}`;

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="relative w-full bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">30-Day Portfolio Equity Curve</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold font-mono text-white">
              ${hoveredPoint?.equity != null ? hoveredPoint.equity.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-mono text-emerald-400">
              Cash: ${hoveredPoint?.cash != null ? hoveredPoint.cash.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Drawdown: {hoveredPoint?.drawdown != null ? hoveredPoint.drawdown : '0'}%
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-mono">
            {hoveredPoint?.timestamp ? new Date(hoveredPoint.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
          </span>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const clampedX = Math.max(padding.left, Math.min(width - padding.right, mouseX));
            const ratio = (clampedX - padding.left) / (width - padding.left - padding.right);
            const index = Math.round(ratio * (data.length - 1));
            setHoverIndex(index);
          }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            const val = maxEquity - ratio * (maxEquity - minEquity);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Gradient Area */}
          <polygon points={areaPoints} fill="url(#equityGradient)" />

          {/* Equity Line */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Hover indicator */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].equity)}
                r="5"
                fill="#38bdf8"
                stroke="#0b101b"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
