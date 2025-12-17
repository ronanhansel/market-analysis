import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, precision_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import warnings
import os
import traceback

warnings.filterwarnings("ignore")

# === Configuration ===
DATA_PATH = 'results/merged_stooq_gdelt.csv'
RESULTS_DIR = 'results'
SEQ_LEN = 10  # Sequence length for LSTM
TEST_SIZE_RATIO = 0.2
RANDOM_SEED = 42

# Ensure results directory exists
os.makedirs(RESULTS_DIR, exist_ok=True)

# === Helper Functions ===

def set_seeds(seed=RANDOM_SEED):
    """
    Resets all random seeds to ensure reproducibility for EACH ticker iteration.
    This is critical: without this, the second ticker in the loop gets a 
    different random state than the first, leading to different LSTM weights.
    """
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    # optional: torch.backends.cudnn.deterministic = True

def save_plot(fig, filename):
    path = os.path.join(RESULTS_DIR, filename)
    fig.savefig(path)
    print(f"Plot saved to {path}")
    plt.close(fig)

def plot_equity_curves(equity_curves, ticker, title="Equity Curves"):
    plt.figure(figsize=(12, 6))
    for name, equity in equity_curves.items():
        plt.plot(equity, label=name)
    
    plt.title(f"{title} - {ticker}")
    plt.xlabel("Days")
    plt.ylabel("Equity ($)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    save_plot(plt.gcf(), f"equity_curves_{ticker}.png")

def plot_feature_importance(importances, ticker, title="Feature Importance"):
    plt.figure(figsize=(10, 8))
    # Sort for better visualization
    importances = importances.sort_values(ascending=True)
    plt.barh(importances.index, importances.values)
    plt.title(f"{title} - {ticker}")
    plt.xlabel("Importance")
    plt.tight_layout()
    save_plot(plt.gcf(), f"feature_importance_{ticker}.png")

def load_and_process_data(filepath, ticker='SPX'):
    print(f"Loading data from {filepath} for {ticker}...")
    df = pd.read_csv(filepath)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date').set_index('Date')
    
    # Select columns for the specific ticker
    # Expected columns: {ticker}_Open, {ticker}_Close, {ticker}_Volume
    # And generic News columns: News_Sentiment, News_Disagreement, News_Volatility, News_Volume
    
    cols_map = {
        f'{ticker}_Open': 'Open',
        f'{ticker}_Close': 'Close',
        f'{ticker}_Volume': 'Volume'
    }
    
    # Check if columns exist
    missing_cols = [c for c in cols_map.keys() if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing columns for ticker {ticker}: {missing_cols}")
        
    # Rename columns
    df = df.rename(columns=cols_map)
    
    # Keep only relevant columns to avoid dropping rows due to NaNs in unrelated columns
    keep_cols = ['Open', 'Close', 'Volume', 'News_Sentiment', 'News_Disagreement', 'News_Volatility', 'News_Volume']
    
    # Verify all keep_cols exist (News columns might be missing if GDELT data is missing)
    existing_cols = [c for c in keep_cols if c in df.columns]
    df = df[existing_cols]
    
    # Calculate Returns
    df['Return'] = np.log(df['Close'] / df['Close'].shift(1))
    
    # Target: Next Day Direction (1 = Up, 0 = Down)
    df['Target'] = (df['Return'].shift(-1) > 0).astype(int)
    
    # Drop NaN from initial shift AND final target shift
    df = df.dropna()
    return df

def create_features(df):
    data = df.copy()
    
    # === Base Market Features ===
    # Lags
    for lag in [1, 2, 3, 5, 10]:
        data[f'Ret_Lag{lag}'] = data['Return'].shift(lag)
    
    # Volatility
    data['Vol_5'] = data['Return'].rolling(5).std()
    data['Vol_20'] = data['Return'].rolling(20).std()
    
    # Momentum / Intraday
    if 'Open' in data.columns:
        data['Intraday_Move'] = (data['Close'] - data['Open']) / data['Open']
    else:
        data['Intraday_Move'] = 0 # Fallback if Open not available

    # Trend (Price relative to MA)
    data['MA_50'] = data['Close'].rolling(50).mean()
    data['Trend_50'] = data['Close'] / data['MA_50'] - 1
    
    # Longer Momentum
    data['Mom_20'] = data['Close'].pct_change(20)
    data['Mom_60'] = data['Close'].pct_change(60)

    # RSI (14-day)
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    data['RSI'] = 100 - (100 / (1 + rs))
    
    # === Sentiment Features ===
    # Moving Averages of Sentiment
    data['Sent_MA_3'] = data['News_Sentiment'].rolling(3).mean()
    data['Sent_MA_7'] = data['News_Sentiment'].rolling(7).mean()
    data['Sent_MA_14'] = data['News_Sentiment'].rolling(14).mean()
    
    # Sentiment Volatility
    data['Sent_Vol_5'] = data['News_Volatility'].rolling(5).mean()
    
    # Interaction: Sentiment * Volume (Normalized)
    vol_ma = data['News_Volume'].rolling(20).mean()
    data['News_Vol_Rel'] = data['News_Volume'] / vol_ma
    data['Sent_Impact'] = data['News_Sentiment'] * data['News_Vol_Rel']
    
    # Drop NaNs generated by rolling/shifting
    data = data.dropna()
    return data

def get_feature_sets():
    base_features = [
        'Ret_Lag1', 'Ret_Lag2', 'Ret_Lag3', 'Ret_Lag5', 'Ret_Lag10',
        'Vol_5', 'Vol_20', 'Intraday_Move', 'Trend_50', 'RSI',
        'Mom_20', 'Mom_60'
    ]
    
    sentiment_features = [
        'Sent_MA_3', 'Sent_MA_7', 'Sent_MA_14', 
        'Sent_Vol_5', 'Sent_Impact', 'News_Disagreement'
    ]
    
    return base_features, sentiment_features

# === Models ===

def train_rf(X_train, y_train, X_test, y_test):
    print(f"Class Balance (Train): {y_train.value_counts(normalize=True).to_dict()}")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=4, # Shallower tree to capture broad trends
        min_samples_leaf=20, 
        random_state=RANDOM_SEED, # RF handles its own seeding
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    return preds, probs, model

class LSTMModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=64, num_layers=2, dropout=0.3):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_dim, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :]) # Last time step
        return self.sigmoid(out)

def train_lstm(X_train, y_train, X_test, y_test, input_dim):
    # Convert to sequences
    def create_sequences(X, y, seq_len):
        xs, ys = [], []
        for i in range(len(X) - seq_len):
            xs.append(X[i:(i + seq_len)])
            ys.append(y[i + seq_len])
        return np.array(xs), np.array(ys)

    # Scale data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    X_train_seq, y_train_seq = create_sequences(X_train_scaled, y_train.values, SEQ_LEN)
    X_test_seq, y_test_seq = create_sequences(X_test_scaled, y_test.values, SEQ_LEN)
    
    # Tensors
    train_data = TensorDataset(torch.FloatTensor(X_train_seq), torch.FloatTensor(y_train_seq))
    train_loader = DataLoader(train_data, batch_size=32, shuffle=False)
    
    model = LSTMModel(input_dim)
    criterion = nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Train
    model.train()
    for epoch in range(50): 
        for X_batch, y_batch in train_loader:
            optimizer.zero_grad()
            y_pred = model(X_batch)
            loss = criterion(y_pred, y_batch.unsqueeze(1))
            loss.backward()
            optimizer.step()
            
    # Predict
    model.eval()
    with torch.no_grad():
        probs = model(torch.FloatTensor(X_test_seq)).numpy().flatten()
        preds = (probs > 0.5).astype(int)
        
    return preds, probs, model

def backtest_strategy(returns, preds, strategy_name):
    # Align lengths (LSTM loses SEQ_LEN data points)
    min_len = min(len(returns), len(preds))
    returns = returns[-min_len:]
    preds = preds[-min_len:]
    
    equity = [1.0]
    for i in range(len(returns)):
        ret = returns[i]
        # Strategy: If pred=1 (Up), Buy. If pred=0 (Down), Cash (0 return).
        # Simple Long-Only strategy based on signal.
        pos = 1 if preds[i] == 1 else 0
        equity.append(equity[-1] * (1 + pos * ret))
        
    total_return = (equity[-1] - 1) * 100
    return equity, total_return

def save_presentation_data(test_df, equity_curves, ticker):
    """Saves data for the interactive presentation."""
    
    # Ensure index is datetime
    if not isinstance(test_df.index, pd.DatetimeIndex):
        test_df.index = pd.to_datetime(test_df.index)
        
    # Save Open, Close, and Sentiment if available
    cols_to_save = ['Close']
    if 'Open' in test_df.columns:
        cols_to_save.insert(0, 'Open')
    if 'News_Sentiment' in test_df.columns:
        cols_to_save.append('News_Sentiment')
        
    output_df = test_df[cols_to_save].copy()
    
    path_data = os.path.join(RESULTS_DIR, f'test_data_{ticker}.csv')
    output_df.to_csv(path_data)
    print(f"Saved {path_data}")
    
    # Save Equity Curves
    max_len = len(test_df)
    eq_df = pd.DataFrame(index=test_df.index)
    
    for model_name, curve in equity_curves.items():
        # Align curves to DataFrame length
        if len(curve) > max_len:
            aligned_curve = curve[-max_len:]
        elif len(curve) < max_len:
            pad = [np.nan] * (max_len - len(curve))
            aligned_curve = pad + curve
        else:
            aligned_curve = curve
            
        eq_df[model_name] = aligned_curve
        
    path_equity = os.path.join(RESULTS_DIR, f'equity_curves_{ticker}.csv')
    eq_df.to_csv(path_equity)
    print(f"Saved {path_equity}")

def save_metrics_to_csv(metrics):
    df = pd.DataFrame(metrics)
    path = os.path.join(RESULTS_DIR, 'model_metrics.csv')
    df.to_csv(path, index=False)
    print(f"Saved {path}")

def run_experiment():
    # Detect tickers
    df_raw = pd.read_csv(DATA_PATH)
    tickers = set()
    for col in df_raw.columns:
        if '_Open' in col:
            tickers.add(col.replace('_Open', ''))
    
    print(f"Detected tickers: {tickers}")
    
    all_metrics = []
    
    # Convert to sorted list to ensure consistent iteration order if we re-run
    sorted_tickers = sorted(list(tickers))
    
    for ticker in sorted_tickers:
        print(f"\n{'='*30}")
        print(f"Processing Ticker: {ticker}")
        print(f"{'='*30}")
        
        # === CRITICAL FIX: RESET SEEDS HERE ===
        # This ensures that 'SPX' gets the exact same random initialization 
        # as it did in the single-file version, regardless of iteration order.
        set_seeds(RANDOM_SEED) 
        
        try:
            # 1. Load
            df = load_and_process_data(DATA_PATH, ticker=ticker)
            df = create_features(df)
            
            base_feats, sent_feats = get_feature_sets()
            all_feats = base_feats + sent_feats
            
            # 2. Split
            train_size = int(len(df) * (1 - TEST_SIZE_RATIO))
            train_df = df.iloc[:train_size]
            test_df = df.iloc[train_size:]
            
            print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")
            print(f"Test Date Range: {test_df.index.min()} to {test_df.index.max()}")
            
            results = []
            
            # === Experiment 1: Base Model (RF) ===
            print("\n--- Running Base Model (RF) ---")
            preds_base_rf, probs_base_rf, _ = train_rf(
                train_df[base_feats], train_df['Target'],
                test_df[base_feats], test_df['Target']
            )
            acc_base_rf = accuracy_score(test_df['Target'], preds_base_rf)
            print(f"Base RF Accuracy: {acc_base_rf:.2%}")
            
            # === Experiment 2: Sentiment Model (RF) ===
            print("\n--- Running Sentiment Model (RF) ---")
            preds_sent_rf, probs_sent_rf, model_sent_rf = train_rf(
                train_df[all_feats], train_df['Target'],
                test_df[all_feats], test_df['Target']
            )
            acc_sent_rf = accuracy_score(test_df['Target'], preds_sent_rf)
            print(f"Sentiment RF Accuracy: {acc_sent_rf:.2%}")
            
            # Feature Importance
            importances = pd.Series(model_sent_rf.feature_importances_, index=all_feats).sort_values(ascending=False)
            print("\nTop 5 Features (Sentiment RF):")
            print(importances.head(5))
            plot_feature_importance(importances, ticker)

            # === Experiment 3: Base Model (LSTM) ===
            print("\n--- Running Base Model (LSTM) ---")
            # Note: LSTM predictions will be shorter by SEQ_LEN
            preds_base_lstm, probs_base_lstm, _ = train_lstm(
                train_df[base_feats], train_df['Target'],
                test_df[base_feats], test_df['Target'],
                input_dim=len(base_feats)
            )
            # Align targets for LSTM
            y_test_lstm = test_df['Target'].iloc[SEQ_LEN:].values
            acc_base_lstm = accuracy_score(y_test_lstm, preds_base_lstm)
            print(f"Base LSTM Accuracy: {acc_base_lstm:.2%}")

            # === Experiment 4: Sentiment Model (LSTM) ===
            print("\n--- Running Sentiment Model (LSTM) ---")
            preds_sent_lstm, probs_sent_lstm, _ = train_lstm(
                train_df[all_feats], train_df['Target'],
                test_df[all_feats], test_df['Target'],
                input_dim=len(all_feats)
            )
            acc_sent_lstm = accuracy_score(y_test_lstm, preds_sent_lstm)
            print(f"Sentiment LSTM Accuracy: {acc_sent_lstm:.2%}")

            # === Backtesting ===
            print("\n=== Backtest Results (Cumulative Return) ===")
            actual_returns = test_df['Return'].values
            
            equity_curves = {}
            metrics = []

            # Buy & Hold
            equity_bh = [1.0]
            for r in actual_returns:
                equity_bh.append(equity_bh[-1] * (1 + r))
            bh_return = (equity_bh[-1] - 1) * 100
            print(f"Buy & Hold: {bh_return:.2f}%")
            equity_curves['Buy & Hold'] = equity_bh
            metrics.append({'Ticker': ticker, 'Model': 'Buy & Hold', 'Accuracy': np.nan, 'Return': bh_return})
            
            # RF Base
            equity_base_rf, ret_base_rf = backtest_strategy(actual_returns, preds_base_rf, "Base RF")
            print(f"Base RF:    {ret_base_rf:.2f}%")
            equity_curves['Base RF'] = equity_base_rf
            metrics.append({'Ticker': ticker, 'Model': 'Base RF', 'Accuracy': acc_base_rf, 'Return': ret_base_rf})
            
            # RF Sentiment
            equity_sent_rf, ret_sent_rf = backtest_strategy(actual_returns, preds_sent_rf, "Sent RF")
            print(f"Sent RF:    {ret_sent_rf:.2f}%")
            equity_curves['Sent RF'] = equity_sent_rf
            metrics.append({'Ticker': ticker, 'Model': 'Sent RF', 'Accuracy': acc_sent_rf, 'Return': ret_sent_rf})
            
            # LSTM Base
            lstm_returns = actual_returns[SEQ_LEN:]
            equity_base_lstm, ret_base_lstm = backtest_strategy(lstm_returns, preds_base_lstm, "Base LSTM")
            print(f"Base LSTM:  {ret_base_lstm:.2f}%")
            equity_curves['Base LSTM'] = [np.nan]*SEQ_LEN + equity_base_lstm
            metrics.append({'Ticker': ticker, 'Model': 'Base LSTM', 'Accuracy': acc_base_lstm, 'Return': ret_base_lstm})
            
            # LSTM Sentiment
            equity_sent_lstm, ret_sent_lstm = backtest_strategy(lstm_returns, preds_sent_lstm, "Sent LSTM")
            print(f"Sent LSTM:  {ret_sent_lstm:.2f}%")
            equity_curves['Sent LSTM'] = [np.nan]*SEQ_LEN + equity_sent_lstm
            metrics.append({'Ticker': ticker, 'Model': 'Sent LSTM', 'Accuracy': acc_sent_lstm, 'Return': ret_sent_lstm})
            
            all_metrics.extend(metrics)

            # === Reporting & Plotting ===
            print("\n=== Generating Reports ===")
            
            # 1. Save Data for Interactive Presentation
            save_presentation_data(test_df, equity_curves, ticker)
            
            # 2. Plot Equity Curves
            plot_equity_curves(equity_curves, ticker)

        except Exception as e:
            print(f"Error processing {ticker}: {e}")
            traceback.print_exc()

    # Save all metrics
    save_metrics_to_csv(all_metrics)

if __name__ == "__main__":
    run_experiment()