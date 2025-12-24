"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart2,
  Calendar,
  ChevronDown,
  Brain,
  Briefcase,
  ArrowRight,
  Target,
  ShieldAlert,
} from "lucide-react";

// --- REAL MODEL PERFORMANCE DATA FROM RESULTS ---
const MODEL_PERFORMANCE = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    bestModel: "Base RF",
    bestReturn: 107.97,
    models: {
      "Buy & Hold": {
        return: 50.63,
        sharpe: 0.78,
        winRate: 52.96,
        maxDD: -33.87,
      },
      "Base RF": {
        return: 107.97,
        sharpe: 1.9,
        winRate: 20.73,
        maxDD: -8.71,
      },
      "Sent RF": {
        return: 100.59,
        sharpe: 1.66,
        winRate: 27.35,
        maxDD: -9.69,
      },
      "Base LSTM": {
        return: 59.92,
        sharpe: 1.26,
        winRate: 29.08,
        maxDD: -13.44,
      },
      "Sent LSTM": {
        return: 14.28,
        sharpe: 0.38,
        winRate: 29.26,
        maxDD: -31.83,
      },
    },
    action: "BUY",
    sentiment: "Positive",
    revenue: "394.3B",
    revenueGrowth: "2.0",
  },
  DAX: {
    symbol: "DAX",
    name: "DAX Performance Index",
    bestModel: "Sent LSTM",
    bestReturn: 28.57,
    models: {
      "Buy & Hold": {
        return: 44.47,
        sharpe: 1.14,
        winRate: 51.92,
        maxDD: -16.41,
      },
      "Base RF": {
        return: 22.32,
        sharpe: 0.96,
        winRate: 22.82,
        maxDD: -10.33,
      },
      "Sent RF": {
        return: 3.45,
        sharpe: 0.2,
        winRate: 21.78,
        maxDD: -12.91,
      },
      "Base LSTM": {
        return: 9.93,
        sharpe: 0.42,
        winRate: 27.84,
        maxDD: -11.49,
      },
      "Sent LSTM": {
        return: 28.57,
        sharpe: 1.41,
        winRate: 14.89,
        maxDD: -9.94,
      },
    },
    action: "ACCUMULATE",
    sentiment: "Cautiously Optimistic",
    revenue: "N/A",
    revenueGrowth: "N/A",
  },
  DJI: {
    symbol: "DJI",
    name: "Dow Jones Industrial",
    bestModel: "Base RF",
    bestReturn: 59.26,
    models: {
      "Buy & Hold": {
        return: 40.17,
        sharpe: 1.11,
        winRate: 52.26,
        maxDD: -16.82,
      },
      "Base RF": {
        return: 59.26,
        sharpe: 1.78,
        winRate: 41.81,
        maxDD: -6.02,
      },
      "Sent RF": {
        return: 40.11,
        sharpe: 1.11,
        winRate: 52.09,
        maxDD: -16.82,
      },
      "Base LSTM": {
        return: 35.84,
        sharpe: 1.37,
        winRate: 26.95,
        maxDD: -9.0,
      },
      "Sent LSTM": {
        return: 17.49,
        sharpe: 0.83,
        winRate: 21.1,
        maxDD: -7.59,
      },
    },
    action: "HOLD",
    sentiment: "Stable",
    revenue: "N/A",
    revenueGrowth: "N/A",
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    bestModel: "Sent RF",
    bestReturn: 114.32,
    models: {
      "Buy & Hold": {
        return: 40.04,
        sharpe: 0.75,
        winRate: 52.44,
        maxDD: -25.36,
      },
      "Base RF": {
        return: -77.65,
        sharpe: -4.07,
        winRate: 22.3,
        maxDD: -78.32,
      },
      "Sent RF": {
        return: 114.32,
        sharpe: 1.62,
        winRate: 49.65,
        maxDD: -11.48,
      },
      "Base LSTM": {
        return: 6.13,
        sharpe: 0.25,
        winRate: 26.95,
        maxDD: -22.06,
      },
      "Sent LSTM": {
        return: 12.04,
        sharpe: 0.37,
        winRate: 37.94,
        maxDD: -20.34,
      },
    },
    action: "HOLD",
    sentiment: "Moderate",
    revenue: "211.9B",
    revenueGrowth: "13.0",
  },
  NDX: {
    symbol: "NDX",
    name: "Nasdaq-100",
    bestModel: "Base RF",
    bestReturn: 84.55,
    models: {
      "Buy & Hold": {
        return: 69.95,
        sharpe: 1.21,
        winRate: 55.4,
        maxDD: -23.55,
      },
      "Base RF": {
        return: 84.55,
        sharpe: 1.4,
        winRate: 54.01,
        maxDD: -18.78,
      },
      "Sent RF": {
        return: 70.69,
        sharpe: 1.22,
        winRate: 55.23,
        maxDD: -23.55,
      },
      "Base LSTM": {
        return: 32.28,
        sharpe: 0.98,
        winRate: 31.21,
        maxDD: -12.56,
      },
      "Sent LSTM": {
        return: 50.12,
        sharpe: 1.06,
        winRate: 40.25,
        maxDD: -26.95,
      },
    },
    action: "STRONG BUY",
    sentiment: "Very Bullish",
    revenue: "N/A",
    revenueGrowth: "N/A",
  },
  NKX: {
    symbol: "NKX",
    name: "Nikkei 225",
    bestModel: "Buy & Hold",
    bestReturn: 48.59,
    models: {
      "Buy & Hold": {
        return: 48.59,
        sharpe: 0.83,
        winRate: 50.7,
        maxDD: -28.83,
      },
      "Base RF": {
        return: -44.7,
        sharpe: -1.45,
        winRate: 15.16,
        maxDD: -51.8,
      },
      "Sent RF": {
        return: -29.94,
        sharpe: -0.64,
        winRate: 33.1,
        maxDD: -40.9,
      },
      "Base LSTM": {
        return: 12.32,
        sharpe: 0.41,
        winRate: 23.58,
        maxDD: -17.5,
      },
      "Sent LSTM": {
        return: 21.13,
        sharpe: 0.62,
        winRate: 20.92,
        maxDD: -16.67,
      },
    },
    action: "HOLD",
    sentiment: "Neutral",
    revenue: "N/A",
    revenueGrowth: "N/A",
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    bestModel: "Base RF",
    bestReturn: 3957.79,
    models: {
      "Buy & Hold": {
        return: 246.12,
        sharpe: 1.32,
        winRate: 51.74,
        maxDD: -41.33,
      },
      "Base RF": {
        return: 3957.79,
        sharpe: 4.31,
        winRate: 43.03,
        maxDD: -13.21,
      },
      "Sent RF": {
        return: 1005.34,
        sharpe: 2.5,
        winRate: 48.26,
        maxDD: -31.97,
      },
      "Base LSTM": {
        return: 56.52,
        sharpe: 0.73,
        winRate: 28.37,
        maxDD: -33.35,
      },
      "Sent LSTM": {
        return: 112.73,
        sharpe: 1.1,
        winRate: 29.96,
        maxDD: -35.8,
      },
    },
    action: "STRONG BUY",
    sentiment: "Highly Bullish",
    revenue: "60.9B",
    revenueGrowth: "126.0",
  },
  SPX: {
    symbol: "SPX",
    name: "S&P 500",
    bestModel: "Sent LSTM",
    bestReturn: 58.02,
    models: {
      "Buy & Hold": {
        return: 57.79,
        sharpe: 1.34,
        winRate: 54.53,
        maxDD: -19.36,
      },
      "Base RF": {
        return: 27.69,
        sharpe: 0.82,
        winRate: 46.52,
        maxDD: -16.21,
      },
      "Sent RF": {
        return: 55.73,
        sharpe: 1.32,
        winRate: 53.14,
        maxDD: -19.25,
      },
      "Base LSTM": {
        return: 9.79,
        sharpe: 0.42,
        winRate: 28.55,
        maxDD: -16.37,
      },
      "Sent LSTM": {
        return: 58.02,
        sharpe: 1.62,
        winRate: 35.46,
        maxDD: -14.11,
      },
    },
    action: "BUY",
    sentiment: "Bullish",
    revenue: "N/A",
    revenueGrowth: "N/A",
  },
};

const SYMBOLS = [
  "AAPL",
  "DAX",
  "DJI",
  "MSFT",
  "NDX",
  "NKX",
  "NVDA",
  "SPX",
] as const;
type SymbolKey = (typeof SYMBOLS)[number];

// --- COMPONENTS ---

// Action Badge Component
const ActionBadge = ({ action }: { action: string }) => {
  const colorMap: Record<string, string> = {
    "STRONG BUY": "bg-green-600 text-white",
    BUY: "bg-green-500 text-white",
    ACCUMULATE: "bg-blue-500 text-white",
    HOLD: "bg-gray-500 text-white",
    SELL: "bg-orange-500 text-white",
    "STRONG SELL": "bg-red-600 text-white",
  };

  return (
    <span
      className={`px-4 py-2 rounded-lg font-bold text-sm ${
        colorMap[action] || "bg-gray-400 text-white"
      }`}
    >
      {action}
    </span>
  );
};

// Metric Card Component
const MetricCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass = "text-gray-900",
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: any;
  colorClass?: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 rounded-lg bg-indigo-50">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
      {title}
    </h3>
    <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    {subtext && <div className="text-gray-400 text-sm mt-2">{subtext}</div>}
  </div>
);

// Model Performance Bar
const ModelBar = ({
  name,
  score,
  isWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
}) => (
  <div
    className={`relative p-4 rounded-lg border ${
      isWinner ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200"
    } mb-3 transition-all hover:shadow-md`}
  >
    <div className="flex justify-between items-center mb-2">
      <span
        className={`font-semibold ${
          isWinner ? "text-indigo-900" : "text-gray-700"
        }`}
      >
        {name}
      </span>
      <span
        className={`text-lg font-bold ${
          score >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {score >= 0 ? "+" : ""}
        {score.toFixed(2)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all ${
          isWinner
            ? "bg-indigo-600"
            : score >= 0
            ? "bg-green-500"
            : "bg-red-500"
        }`}
        style={{ width: `${Math.min(Math.abs(score), 100)}%` }}
      />
    </div>
    {isWinner && (
      <div className="absolute -top-2 -right-2">
        <div className="bg-yellow-400 rounded-full p-1.5">
          <Target className="w-4 h-4 text-yellow-900" />
        </div>
      </div>
    )}
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolKey>("AAPL");
  const [currentDate, setCurrentDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const data = useMemo(
    () => MODEL_PERFORMANCE[selectedSymbol],
    [selectedSymbol]
  );

  if (!mounted) return null;

  const isPositive = data.bestReturn >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Market Analysis Dashboard
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {currentDate}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Symbol Selector */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Symbol
              </label>
              <div className="relative">
                <select
                  value={selectedSymbol}
                  onChange={(e) =>
                    setSelectedSymbol(e.target.value as SymbolKey)
                  }
                  className="text-gray-700 w-full px-4 py-3 pr-10 text-lg font-semibold border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                >
                  <optgroup label="Companies">
                    <option value="AAPL">AAPL - Apple Inc.</option>
                    <option value="MSFT">MSFT - Microsoft Corp.</option>
                    <option value="NVDA">NVDA - NVIDIA Corp.</option>
                  </optgroup>
                  <optgroup label="Indices">
                    <option value="DAX">DAX - DAX Performance Index</option>
                    <option value="DJI">DJI - Dow Jones Industrial</option>
                    <option value="NDX">NDX - Nasdaq-100</option>
                    <option value="NKX">NKX - Nikkei 225</option>
                    <option value="SPX">SPX - S&P 500</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Current Model</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {data.bestModel}
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">
                  Suggested Action
                </div>
                <ActionBadge action={data.action} />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Best Model Return"
            value={`${data.bestReturn >= 0 ? "+" : ""}${data.bestReturn.toFixed(
              2
            )}%`}
            subtext={`Using ${data.bestModel}`}
            icon={TrendingUp}
            colorClass={isPositive ? "text-green-600" : "text-red-600"}
          />
          <MetricCard
            title="Market Sentiment"
            value={data.sentiment}
            subtext="Based on GDELT analysis"
            icon={Activity}
          />
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">
              Investment Performance
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Company Revenue
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {data.revenue}
                </div>
                {data.revenueGrowth !== "N/A" && (
                  <div className="text-xs text-green-600">
                    +{data.revenueGrowth}% YoY
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs text-gray-400 mb-1">
                  $1M Investment Returns
                </div>
                <div className="text-2xl font-bold text-green-600">
                  $
                  {((1000000 * (1 + data.bestReturn / 100)) / 1000000).toFixed(
                    2
                  )}
                  M
                </div>
                <div className="text-xs text-gray-500">
                  Profit: +$
                  {((1000000 * data.bestReturn) / 100 / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
          </div>
          <MetricCard
            title="Sharpe Ratio"
            value={data.models[data.bestModel].sharpe.toFixed(2)}
            subtext="Risk-adjusted return"
            icon={BarChart2}
            colorClass="text-indigo-600"
          />
        </div>

        {/* Model Performance Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Model Performance Comparison
            </h2>
          </div>
          <div className="space-y-3">
            {Object.entries(data.models)
              .sort(([, a], [, b]) => (b as any).return - (a as any).return)
              .map(([modelName, metrics]) => (
                <ModelBar
                  key={modelName}
                  name={modelName}
                  score={(metrics as any).return}
                  isWinner={modelName === data.bestModel}
                />
              ))}
          </div>

          {/* Additional Metrics Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Model
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Return
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Sharpe
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Win Rate
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Max DD
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.models).map(([modelName, metrics]) => {
                  const m = metrics as any;
                  return (
                    <tr
                      key={modelName}
                      className={`border-b border-gray-100 ${
                        modelName === data.bestModel ? "bg-indigo-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {modelName}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          m.return >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {m.return >= 0 ? "+" : ""}
                        {m.return.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {m.sharpe.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {m.winRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        {m.maxDD.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Presentation */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Detailed Analysis
            </h2>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              src={`/interactive_presentation_${selectedSymbol}.html`}
              className="w-full"
              style={{ height: "900px" }}
              title={`${data.name} Interactive Presentation`}
            />
          </div>
        </div>

        {/* Risk Disclaimer and Performance Dashboard */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Note */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Risk Disclaimer
                </h3>
                <div className="text-sm text-red-700 space-y-2">
                  <p>
                    <strong>
                      Past performance does not guarantee future results.
                    </strong>{" "}
                    The models presented are based on historical backtesting and
                    may not reflect actual trading conditions.
                  </p>
                  <p>
                    Trading involves substantial risk of loss. Model predictions
                    can be affected by market volatility, liquidity constraints,
                    and unforeseen events.
                  </p>
                  <p>
                    Maximum drawdown figures represent historical losses; actual
                    losses may exceed these values. Models showing negative
                    returns demonstrate real risk exposure.
                  </p>
                  <p className="font-semibold">
                    This is an academic project for educational purposes only.
                    Not financial advice. Consult a licensed financial advisor
                    before making investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Dashboard Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <BarChart2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Performance Dashboard Notes
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    <strong>Return:</strong> Total percentage gain/loss over the
                    test period (May 2023 - present).
                  </p>
                  <p>
                    <strong>Sharpe Ratio:</strong> Risk-adjusted returns (higher
                    is better). Values above 1.0 indicate favorable risk/reward.
                  </p>
                  <p>
                    <strong>Win Rate:</strong> Percentage of profitable trades.
                    Lower win rates can still be profitable with proper risk
                    management.
                  </p>
                  <p>
                    <strong>Max Drawdown:</strong> Largest peak-to-trough
                    decline. Critical for assessing capital preservation.
                  </p>
                  <p>
                    <strong>Best Model Selection:</strong> Determined by highest
                    absolute return. Consider risk metrics (Sharpe, Max DD)
                    alongside returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Info Footer */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-1">
                Business Analytics Capstone Project
              </h3>
              <p className="text-sm text-indigo-700">
                This dashboard presents AI-powered market analysis using
                sentiment analysis from GDELT news data combined with machine
                learning models including LSTM networks and Random Forest
                classifiers. Models are evaluated on historical market data (May
                2023 - December 2024) to provide quantitative investment
                insights. Data sources: Stooq historical prices, GDELT Global
                Knowledge Graph.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
