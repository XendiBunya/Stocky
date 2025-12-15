'use client';

import React, { useState } from 'react';
import { DetectionMethod } from '@/lib/types';

interface ConfigPanelProps {
  onAnalyze: (config: AnalysisConfig) => void;
  isLoading: boolean;
}

export interface AnalysisConfig {
  ticker: string;
  startDate: string;
  endDate: string;
  method: DetectionMethod;
  features: string[];
  params: Record<string, number>;
  enableNews: boolean;
  newsApiKey?: string;
  newsWindow: number;
}

export function ConfigPanel({ onAnalyze, isLoading }: ConfigPanelProps) {
  const [config, setConfig] = useState<AnalysisConfig>({
    ticker: 'AAPL',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    method: 'z_score',
    features: ['returns', 'volume_change'],
    params: { zThreshold: 3.0 },
    enableNews: false,
    newsWindow: 1,
  });

  const handlePresetChange = (preset: string) => {
    const daysMap: Record<string, number> = {
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '2y': 730,
    };

    const days = daysMap[preset];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    setConfig({
      ...config,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const handleMethodChange = (method: DetectionMethod) => {
    let defaultParams: Record<string, number> = {};

    switch (method) {
      case 'z_score':
        defaultParams = { zThreshold: 3.0 };
        break;
      case 'iqr':
        defaultParams = { iqrMultiplier: 1.5 };
        break;
      case 'isolation_forest':
        defaultParams = { contamination: 0.1, nEstimators: 100 };
        break;
      case 'combined':
        defaultParams = { votingThreshold: 2 };
        break;
    }

    setConfig({ ...config, method, params: defaultParams });
  };

  const handleFeatureToggle = (feature: string) => {
    const features = config.features.includes(feature)
      ? config.features.filter((f) => f !== feature)
      : [...config.features, feature];

    setConfig({ ...config, features });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(config);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-primary">Configuration</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stock Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Stock Ticker(s)
          </label>
          <input
            type="text"
            value={config.ticker}
            onChange={(e) =>
              setConfig({ ...config, ticker: e.target.value.toUpperCase() })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., AAPL"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter stock ticker symbol
          </p>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {['30d', '3m', '6m', '1y', '2y'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) =>
                  setConfig({ ...config, startDate: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) =>
                  setConfig({ ...config, endDate: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Detection Method */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Detection Method
          </label>
          <select
            value={config.method}
            onChange={(e) =>
              handleMethodChange(e.target.value as DetectionMethod)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="z_score">Z-Score</option>
            <option value="iqr">IQR (Interquartile Range)</option>
            <option value="isolation_forest">Isolation Forest</option>
            <option value="bollinger">Bollinger Bands</option>
            <option value="combined">Combined</option>
          </select>
        </div>

        {/* Method Parameters */}
        <div>
          <label className="block text-sm font-medium mb-2">Parameters</label>
          {config.method === 'z_score' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Z-Score Threshold: {config.params.zThreshold}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={config.params.zThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    params: { zThreshold: parseFloat(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          )}

          {config.method === 'iqr' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                IQR Multiplier: {config.params.iqrMultiplier}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={config.params.iqrMultiplier}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    params: { iqrMultiplier: parseFloat(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          )}

          {config.method === 'isolation_forest' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Contamination: {config.params.contamination}
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                  value={config.params.contamination}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      params: {
                        ...config.params,
                        contamination: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {config.method === 'combined' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Voting Threshold: {config.params.votingThreshold}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={config.params.votingThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    params: { votingThreshold: parseInt(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Features to Analyze
          </label>
          <div className="space-y-2">
            {['returns', 'volume_change', 'range_pct', 'volatility'].map(
              (feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">
                    {feature.replace('_', ' ')}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* News Correlation */}
        <div>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={config.enableNews}
              onChange={(e) =>
                setConfig({ ...config, enableNews: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm font-medium">Enable News Correlation</span>
          </label>

          {config.enableNews && (
            <div className="pl-6 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  NewsAPI Key (Optional)
                </label>
                <input
                  type="password"
                  value={config.newsApiKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, newsApiKey: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Leave empty for Yahoo Finance"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  News Window: {config.newsWindow} day(s)
                </label>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={config.newsWindow}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      newsWindow: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || config.features.length === 0}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyzing...' : '🚀 Run Analysis'}
        </button>
      </form>
    </div>
  );
}
