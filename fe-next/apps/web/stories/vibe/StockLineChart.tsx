'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from 'lightweight-charts';

export type StockPoint = {
  time: string; // ISO date string
  price: number;
};

export interface StockLineChartProps {
  symbol?: string;
  data: StockPoint[];
  accentColor?: string;
}

// Vibe sandbox版本：轻量依赖 + 内部自带样式，避免污染主线组件。
export function StockLineChart({
  symbol = 'ACME',
  data,
  accentColor = '#22d3ee',
}: StockLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { latestPrice, changeText, changeColor } = useMemo(() => {
    const first = data[0]?.price ?? 0;
    const last = data[data.length - 1]?.price ?? 0;
    const diff = last - first;
    const pct = first ? (diff / first) * 100 : 0;
    const sign = diff > 0 ? '+' : '';
    return {
      latestPrice: last,
      changeText: `${sign}${diff.toFixed(2)} (${sign}${pct.toFixed(2)}%)`,
      changeColor: diff >= 0 ? '#34d399' : '#f87171',
    };
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#e2e8f0',
        attributionLogo: false, // 5.1版本支持移除logo
      },
      width: containerRef.current.clientWidth,
      height: 260,
      grid: {
        vertLines: { color: 'rgba(226, 232, 240, 0.08)' },
        horzLines: { color: 'rgba(226, 232, 240, 0.08)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: 'rgba(226, 232, 240, 0.12)',
      },
      rightPriceScale: {
        borderColor: 'rgba(226, 232, 240, 0.12)',
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: accentColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: false,
      lineStyle: LineStyle.Solid,
    });

    series.setData(
      data.map((point) => ({
        time: (Date.parse(point.time) / 1000) as UTCTimestamp,
        value: point.price,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, accentColor]);

  return (
    <div
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.15), transparent 35%), #0f172a',
        border: '1px solid rgba(34, 211, 238, 0.25)',
        boxShadow: '0 20px 80px rgba(15, 23, 42, 0.5)',
        borderRadius: '18px',
        padding: '16px',
        color: '#e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', letterSpacing: '0.08em', opacity: 0.7 }}>
            {symbol.toUpperCase()} • generatedUI
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>
            ${latestPrice.toFixed(2)}
            <span style={{ marginLeft: '10px', fontSize: '14px', color: changeColor }}>
              {changeText}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(226, 232, 240, 0.08)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span
            style={{ width: '8px', height: '8px', borderRadius: '999px', background: accentColor }}
          />
          Live Sentiment
        </div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '260px' }} />
    </div>
  );
}

export default StockLineChart;
