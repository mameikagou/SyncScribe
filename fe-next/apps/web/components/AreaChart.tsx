"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, AreaSeries, UTCTimestamp } from 'lightweight-charts';

interface AreaChartProps {
  data: { time: number; value: number }[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  colors: {
    backgroundColor = 'white',
    lineColor = '#2962FF',
    textColor = 'black',
    areaTopColor = '#2962FF',
    areaBottomColor = 'rgba(41, 98, 255, 0.28)',
  } = {},
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });

    areaSeries.setData(
      data.map((item) => ({
        ...item,
        time: item.time as UTCTimestamp,
      }))
    );
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  return <div ref={chartContainerRef} id="container" style={{ width: '100%' }} />;
};

export default AreaChart;
