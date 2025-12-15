'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  ReferenceDot,
} from 'recharts';
import { AnomalyDataPoint } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface StockChartProps {
  data: AnomalyDataPoint[];
}

export function StockChart({ data }: StockChartProps) {
  const chartData = data.map((point) => ({
    date: formatDate(point.date),
    close: point.close,
    volume: point.volume,
    anomalyScore: point.anomalyScore,
    isAnomaly: point.isAnomaly,
    bbUpper: point.bbUpper,
    bbLower: point.bbLower,
    ma20: point.ma20,
  }));

  const anomalies = data.filter((d) => d.isAnomaly);

  return (
    <div className="space-y-6">
      {/* Price Chart with Anomalies */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Price & Anomalies</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === 'close' || name === 'bbUpper' || name === 'bbLower' || name === 'ma20') {
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Legend />

            {/* Bollinger Bands */}
            {data[0]?.bbUpper && (
              <>
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="#cccccc"
                  strokeDasharray="3 3"
                  dot={false}
                  name="BB Upper"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbLower"
                  stroke="#cccccc"
                  strokeDasharray="3 3"
                  dot={false}
                  name="BB Lower"
                />
              </>
            )}

            {/* Moving Average */}
            {data[0]?.ma20 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma20"
                stroke="#ff7300"
                strokeWidth={1}
                dot={false}
                name="MA(20)"
              />
            )}

            {/* Close Price */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke="#1f77b4"
              strokeWidth={2}
              dot={false}
              name="Close Price"
            />

            {/* Anomaly Points */}
            {anomalies.map((anomaly, index) => (
              <ReferenceDot
                key={index}
                x={formatDate(anomaly.date)}
                y={anomaly.close}
                r={6}
                fill="red"
                stroke="darkred"
                strokeWidth={2}
                yAxisId="price"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Volume</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: any) => value.toLocaleString()}
            />
            <Bar dataKey="volume" fill="#82ca9d" name="Volume" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Score Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Anomaly Score</h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => value.toFixed(2)} />
            <Area
              type="monotone"
              dataKey="anomalyScore"
              stroke="#ff6b6b"
              fill="#ff6b6b"
              fillOpacity={0.6}
              name="Anomaly Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
