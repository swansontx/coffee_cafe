import { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { brewApi } from '../api/client';
import { AnalyticsData, BrewMethod } from '../types';
import { formatDateTime } from '../utils/calculations';

export default function SCAChart() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<BrewMethod | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [methodFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = methodFilter !== 'all' ? { method: methodFilter } : {};
      const analyticsData = await brewApi.getAnalytics(filters);
      setData(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for chart
  const chartData = data.map((brew) => ({
    tds: brew.tds,
    extraction: brew.extraction_yield,
    name: `${brew.coffee_name} (${brew.method})`,
    rating: brew.rating,
    timestamp: brew.timestamp,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">TDS: {data.tds.toFixed(2)}%</p>
          <p className="text-sm">Extraction: {data.extraction.toFixed(2)}%</p>
          {data.rating && (
            <p className="text-sm">
              Rating: {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formatDateTime(data.timestamp)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          SCA Brewing Control Chart
        </h2>

        {/* Method Filter */}
        <div className="flex space-x-2">
          {['all', 'espresso', 'batch', 'pourover'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method as BrewMethod | 'all')}
              className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                methodFilter === method
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">
            No brew data available. Log some brews to see them plotted here!
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="tds"
                name="TDS"
                unit="%"
                domain={[0.5, 2.5]}
                label={{ value: 'TDS / Strength (%)', position: 'bottom', offset: 0 }}
              />

              <YAxis
                type="number"
                dataKey="extraction"
                name="Extraction"
                unit="%"
                domain={[14, 26]}
                label={{ value: 'Extraction Yield (%)', angle: -90, position: 'left' }}
              />

              {/* Ideal Zone (SCA Standard) */}
              <ReferenceArea
                x1={1.15}
                x2={1.45}
                y1={18}
                y2={22}
                fill="#10b981"
                fillOpacity={0.1}
                label={{ value: 'Ideal', position: 'center' }}
              />

              {/* Under-extracted zone */}
              <ReferenceArea
                x1={0.5}
                x2={2.5}
                y1={14}
                y2={18}
                fill="#3b82f6"
                fillOpacity={0.05}
              />

              {/* Over-extracted zone */}
              <ReferenceArea
                x1={0.5}
                x2={2.5}
                y1={22}
                y2={26}
                fill="#f97316"
                fillOpacity={0.05}
              />

              {/* Reference lines for ideal range */}
              <ReferenceLine
                y={18}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: '18% (Under)', position: 'left', fill: '#666' }}
              />
              <ReferenceLine
                y={22}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: '22% (Over)', position: 'left', fill: '#666' }}
              />

              <ReferenceLine
                x={1.15}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: 'Weak', position: 'top', fill: '#666' }}
              />
              <ReferenceLine
                x={1.45}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: 'Strong', position: 'top', fill: '#666' }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Scatter
                name="Brew Sessions"
                data={chartData}
                fill="#8b5cf6"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 mr-2"></div>
              <span>Under-extracted (below 18%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 mr-2"></div>
              <span>Ideal (18-22%, 1.15-1.45% TDS)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 mr-2"></div>
              <span>Over-extracted (above 22%)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
