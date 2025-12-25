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
  Info,
} from "lucide-react";

// Company revenue data (static - not in model metrics)
const COMPANY_DATA: Record<string, { revenue: string; revenueGrowth: string }> =
  {
    AAPL: { revenue: "394.3B", revenueGrowth: "2.0" },
    MSFT: { revenue: "211.9B", revenueGrowth: "13.0" },
    NVDA: { revenue: "60.9B", revenueGrowth: "126.0" },
    DAX: { revenue: "N/A", revenueGrowth: "N/A" },
    DJI: { revenue: "N/A", revenueGrowth: "N/A" },
    NDX: { revenue: "N/A", revenueGrowth: "N/A" },
    NKX: { revenue: "N/A", revenueGrowth: "N/A" },
    SPX: { revenue: "N/A", revenueGrowth: "N/A" },
  };

// Initial placeholder - will be populated from CSV
const MODEL_PERFORMANCE_INITIAL = {
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
      ARIMA: {
        return: -12.01,
        sharpe: -0.18,
        winRate: 23.69,
        maxDD: -38.82,
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
      ARIMA: {
        return: 24.0,
        sharpe: 0.91,
        winRate: 28.57,
        maxDD: -12.66,
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
      ARIMA: {
        return: 15.98,
        sharpe: 0.61,
        winRate: 25.44,
        maxDD: -11.88,
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
      ARIMA: {
        return: 29.94,
        sharpe: 0.82,
        winRate: 23.69,
        maxDD: -11.75,
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
      ARIMA: {
        return: 40.24,
        sharpe: 1.01,
        winRate: 23.52,
        maxDD: -11.91,
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
      ARIMA: {
        return: 9.02,
        sharpe: 0.31,
        winRate: 25.26,
        maxDD: -31.02,
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
      ARIMA: {
        return: 136.33,
        sharpe: 1.19,
        winRate: 28.57,
        maxDD: -33.99,
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
      ARIMA: {
        return: 22.12,
        sharpe: 0.75,
        winRate: 23.69,
        maxDD: -11.84,
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

// Helper function to determine action based on metrics
function determineAction(
  bestReturn: number,
  sharpe: number,
  maxDD: number
): string {
  if (bestReturn > 100 && sharpe >= 1.5 && maxDD >= -30) return "STRONG BUY";
  if (bestReturn >= 20 && sharpe >= 0.8) return "BUY";
  if (bestReturn >= 5) return "ACCUMULATE";
  if (bestReturn < -5) return "SELL";
  return "HOLD";
}

// Helper function to determine sentiment
function determineSentiment(action: string): string {
  const sentimentMap: Record<string, string> = {
    "STRONG BUY": "Highly Bullish",
    BUY: "Bullish",
    ACCUMULATE: "Cautiously Optimistic",
    HOLD: "Neutral",
    SELL: "Bearish",
  };
  return sentimentMap[action] || "Neutral";
}

// Helper to parse CSV
function parseCSV(csvText: string) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    return obj;
  });
}

// Load model performance from CSV
async function loadModelPerformance() {
  try {
    const response = await fetch("/model_metrics.csv");
    if (!response.ok) throw new Error("Failed to load metrics");

    const csvText = await response.text();
    const data = parseCSV(csvText);

    const performance: any = {};

    // Group by ticker
    SYMBOLS.forEach((ticker) => {
      const tickerData = data.filter((row: any) => row.Ticker === ticker);
      if (tickerData.length === 0) return;

      const models: any = {};
      let bestModel = "";
      let bestReturn = -Infinity;

      tickerData.forEach((row: any) => {
        const modelName = row.Model;
        const returnVal = parseFloat(row.Return);
        const sharpe = parseFloat(row.Sharpe);
        const maxDD = parseFloat(row.MaxDD) * 100;
        const winRate = parseFloat(row.WinRate) * 100;

        models[modelName] = {
          return: returnVal,
          sharpe: sharpe,
          winRate: winRate,
          maxDD: maxDD,
        };

        // Track best model (exclude Buy & Hold)
        if (modelName !== "Buy & Hold" && returnVal > bestReturn) {
          bestReturn = returnVal;
          bestModel = modelName;
        }
      });

      const bestModelMetrics = models[bestModel];
      const action = determineAction(
        bestReturn,
        bestModelMetrics.sharpe,
        bestModelMetrics.maxDD
      );

      performance[ticker] = {
        symbol: ticker,
        name: ticker, // Could be enhanced with full names
        bestModel: bestModel,
        bestReturn: bestReturn,
        models: models,
        action: action,
        sentiment: determineSentiment(action),
        revenue: COMPANY_DATA[ticker]?.revenue || "N/A",
        revenueGrowth: COMPANY_DATA[ticker]?.revenueGrowth || "N/A",
      };
    });

    return performance;
  } catch (error) {
    console.error("Error loading model performance:", error);
    return MODEL_PERFORMANCE_INITIAL;
  }
}

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
  tooltip,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: any;
  colorClass?: string;
  tooltip?: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 rounded-lg bg-indigo-50">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      {tooltip && (
        <div className="relative">
          <Info className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" />
          <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl">
            {tooltip}
            <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        </div>
      )}
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
  const [modelPerformance, setModelPerformance] = useState<any>(
    MODEL_PERFORMANCE_INITIAL
  );
  const [loading, setLoading] = useState(true);

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

    // Load model performance data
    loadModelPerformance().then((data) => {
      setModelPerformance(data);
      setLoading(false);
    });
  }, []);

  const data = useMemo(
    () => modelPerformance[selectedSymbol],
    [selectedSymbol, modelPerformance]
  );

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Loading Dashboard...
          </div>
          <div className="text-gray-500">Fetching model performance data</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">
            Data Not Available
          </div>
          <div className="text-gray-500">
            Please run modelling.py to generate results
          </div>
        </div>
      </div>
    );
  }

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
              <div className="text-center h-full">
                <div className="text-sm text-gray-500 mb-1">
                  Suggested Action
                </div>
                <ActionBadge action={data.action} />
              </div>
            </div>
          </div>

          {/* Action Rule Transparency */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  Action Rule Applied
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-300">
                      {data.bestModel}
                    </span>
                    <span>→</span>
                    <span className="font-semibold">
                      Return: {data.bestReturn.toFixed(2)}%
                    </span>
                    <span>|</span>
                    <span className="font-semibold">
                      Sharpe:{" "}
                      {data.models[
                        data.bestModel as keyof typeof data.models
                      ].sharpe.toFixed(2)}
                    </span>
                    <span>|</span>
                    <span className="font-semibold">
                      MaxDD:{" "}
                      {data.models[
                        data.bestModel as keyof typeof data.models
                      ].maxDD.toFixed(2)}
                      %
                    </span>
                  </div>
                  <div className="text-gray-500 mt-2">
                    {data.action === "STRONG BUY" && (
                      <>
                        <strong>Rule:</strong> Return &gt; 100% AND Sharpe ≥ 1.5
                        AND MaxDD ≥ -30% → Exceptional risk-adjusted performance
                      </>
                    )}
                    {data.action === "BUY" && (
                      <>
                        <strong>Rule:</strong> Return ≥ 20% AND Sharpe ≥ 0.8 →
                        Strong positive returns with favorable risk profile
                      </>
                    )}
                    {data.action === "ACCUMULATE" && (
                      <>
                        <strong>Rule:</strong> Return ≥ 5% → Positive momentum,
                        moderate accumulation suggested
                      </>
                    )}
                    {data.action === "HOLD" && (
                      <>
                        <strong>Rule:</strong> Return between -5% and 5% OR
                        insufficient signal strength → Maintain current
                        positions
                      </>
                    )}
                    {data.action === "SELL" && (
                      <>
                        <strong>Rule:</strong> Return &lt; -5% OR negative
                        risk-adjusted metrics → Consider reducing exposure
                      </>
                    )}
                  </div>
                  <div className="text-gray-400 mt-2 italic">
                    Action adjusted by GDELT sentiment ({data.sentiment}) for
                    additional market context validation.
                  </div>
                </div>
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
            title="Market Sentiment"
            value={data.sentiment}
            subtext="Based on GDELT analysis"
            icon={Activity}
          />
          <MetricCard
            title="Sharpe Ratio"
            value={data.models[
              data.bestModel as keyof typeof data.models
            ].sharpe.toFixed(2)}
            subtext="Risk-adjusted return"
            icon={BarChart2}
            colorClass="text-indigo-600"
          />
        </div>

        {/* Model Return & Performance Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Model Return & Performance Comparison
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(data.models)
              .sort(([, a], [, b]) => (b as any).return - (a as any).return)
              .map(([modelName, metrics]) => {
                const m = metrics as any;
                const isWinner = modelName === data.bestModel;
                return (
                  <div
                    key={modelName}
                    className={`relative p-4 rounded-lg border ${
                      isWinner
                        ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                        : "bg-white border-gray-200"
                    } hover:shadow-md transition-all`}
                  >
                    {isWinner && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-yellow-400 rounded-full p-1.5">
                          <Target className="w-4 h-4 text-yellow-900" />
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div
                        className={`text-xs font-semibold mb-2 ${
                          isWinner ? "text-indigo-900" : "text-gray-600"
                        }`}
                      >
                        {modelName}
                      </div>
                      <div
                        className={`text-2xl font-bold mb-3 ${
                          m.return >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {m.return >= 0 ? "+" : ""}
                        {m.return.toFixed(1)}%
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Sharpe:</span>
                          <span className="font-semibold">
                            {m.sharpe.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win:</span>
                          <span className="font-semibold">
                            {m.winRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>MaxDD:</span>
                          <span className="font-semibold text-red-600">
                            {m.maxDD.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    test period (May 2013 - present).
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
                This dashboard presents market analysis using sentiment analysis
                from GDELT news data combined with machine learning models
                including LSTM, ARIMA networks and Random Forest classifiers.
                Models are evaluated on historical market data (May 2013 -
                December 2025) to provide quantitative investment insights.
              </p>
              <p className="text-xs mt-2 w-full text-indigo-700 font-mono">
                Data sources: Stooq historical prices, GDELT Global Knowledge
                Graph.
              </p>
            </div>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Methodology Update (December 2025)
              </h3>
              <p className="text-sm text-amber-800">
                Performance figures have been corrected to use{" "}
                <strong>simple returns</strong> instead of log returns for
                accurate compounding, and{" "}
                <strong>proper signal-to-return alignment</strong> to eliminate
                look-ahead bias. Previous versions unintentionally inflated
                results by applying next-day predictions to same-day returns.
                The corrected methodology ensures that model signals at time{" "}
                <em>t</em> are used to trade returns at time <em>t+1</em>,
                providing a realistic assessment of strategy performance.
              </p>
              <p className="text-xs mt-2 text-amber-700 italic">
                All results shown reflect the corrected backtest methodology
                using simple returns = (Close<sub>t</sub> / Close<sub>t-1</sub>)
                - 1 and aligned signal execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
