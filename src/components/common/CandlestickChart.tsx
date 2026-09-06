import React, { useState } from 'react';
import { CandlestickBar } from '../../types/client.ts';

interface CandlestickChartProps {
  bars: CandlestickBar[];
  symbol: string;
  height?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ bars, symbol, height = 320 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<string>('15M');

  if (!bars || bars.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-xs text-slate-500 bg-[#0d1322] rounded-xl border border-slate-800">
        No candlestick bar data available for {symbol}
      </div>
    );
  }

  const width = 850;
  const padding = { top: 25, right: 65, bottom: 45, left: 15 };
  const chartHeight = height - 70; // upper section for price
  const volHeight = 45; // lower section for volume

  const allHighs = bars.map((b) => b.high);
  const allLows = bars.map((b) => b.low);
  const allVols = bars.map((b) => b.volume);

  const minPrice = Math.min(...allLows) * 0.998;
  const maxPrice = Math.max(...allHighs) * 1.002;
  const maxVol = Math.max(...allVols) || 1;

  const barCount = bars.length;
  const availableWidth = width - padding.left - padding.right;
  const candleSpacing = availableWidth / barCount;
  const candleWidth = Math.max(3, candleSpacing * 0.7);

  const getX = (i: number) => padding.left + i * candleSpacing + candleSpacing / 2;
  const getY = (p: number) => {
    return padding.top + (1 - (p - minPrice) / (maxPrice - minPrice || 1)) * (chartHeight - padding.top);
  };

  const getVolY = (v: number) => {
    return height - padding.bottom - (v / maxVol) * volHeight;
  };

  const hoveredBar = hoverIndex !== null ? bars[hoverIndex] : bars[bars.length - 1];

  return (
    <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm select-none">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-base font-bold font-mono text-white tracking-tight">{symbol}</span>
            <span className="ml-2 text-xs font-mono text-cyan-400">Institutional Feed</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              O: <span className="text-white">${hoveredBar?.open != null ? hoveredBar.open.toFixed(2) : '0.00'}</span>
            </span>
            <span className="text-slate-400">
              H: <span className="text-emerald-400">${hoveredBar?.high != null ? hoveredBar.high.toFixed(2) : '0.00'}</span>
            </span>
            <span className="text-slate-400">
              L: <span className="text-rose-400">${hoveredBar?.low != null ? hoveredBar.low.toFixed(2) : '0.00'}</span>
            </span>
            <span className="text-slate-400">
              C: <span className="text-white">${hoveredBar?.close != null ? hoveredBar.close.toFixed(2) : '0.00'}</span>
            </span>
            <span className="text-slate-400">
              Vol: <span className="text-cyan-300">{hoveredBar?.volume != null ? hoveredBar.volume.toLocaleString() : '0'}</span>
            </span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center bg-[#090d16] p-0.5 rounded-lg border border-slate-800 text-xs">
          {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded font-mono transition-colors ${
                timeframe === tf ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Stage */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const clampedX = Math.max(padding.left, Math.min(width - padding.right, mouseX));
            const idx = Math.floor((clampedX - padding.left) / candleSpacing);
            if (idx >= 0 && idx < bars.length) {
              setHoverIndex(idx);
            }
          }}
        >
          {/* Price Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + ratio * (chartHeight - padding.top);
            const price = maxPrice - ratio * (maxPrice - minPrice);
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
                  x={width - padding.right + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${price.toFixed(price > 500 ? 1 : 2)}
                </text>
              </g>
            );
          })}

          {/* Volume separator line */}
          <line
            x1={padding.left}
            y1={height - padding.bottom - volHeight - 5}
            x2={width - padding.right}
            y2={height - padding.bottom - volHeight - 5}
            stroke="#1e293b"
          />

          {/* Render Volume Bars */}
          {bars.map((bar, i) => {
            const x = getX(i);
            const isBullish = bar.close >= bar.open;
            const volY = getVolY(bar.volume);
            const barH = height - padding.bottom - volY;

            return (
              <rect
                key={'vol_' + i}
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={barH}
                fill={isBullish ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}
              />
            );
          })}

          {/* Render Candlesticks */}
          {bars.map((bar, i) => {
            const x = getX(i);
            const isBullish = bar.close >= bar.open;
            const openY = getY(bar.open);
            const closeY = getY(bar.close);
            const highY = getY(bar.high);
            const lowY = getY(bar.low);

            const candleTop = Math.min(openY, closeY);
            const candleH = Math.max(2, Math.abs(closeY - openY));
            const color = isBullish ? '#10b981' : '#f43f5e';

            return (
              <g key={'candle_' + i}>
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
                {/* Real Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleH}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Active Crosshair */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Horizontal line */}
              <line
                x1={padding.left}
                y1={getY(bars[hoverIndex].close)}
                x2={width - padding.right}
                y2={getY(bars[hoverIndex].close)}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Price badge on axis */}
              <rect
                x={width - padding.right + 2}
                y={getY(bars[hoverIndex].close) - 9}
                width={56}
                height={18}
                fill="#0284c7"
                rx="3"
              />
              <text
                x={width - padding.right + 6}
                y={getY(bars[hoverIndex].close) + 4}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ${bars[hoverIndex].close.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
