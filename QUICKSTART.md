# Quick Start Guide — 5 Minutes to Results

**Get your market analysis running in under 5 minutes!**

---

## ⚡ Speed Run (Already Have Data)

If you already have the processed data in `results/merged_stooq_gdelt.csv`:

```bash
# 1. Activate environment
conda activate ba

# 2. Run experiment
python modelling.py

# 3. View results
open results/interactive_presentation.html
```

**Done!** Results will be in `results/` directory.

---

## 🚀 Full Setup (First Time)

### Step 1: Environment (2 minutes)

```bash
# Create environment
conda create -n ba python=3.10 -y
conda activate ba

# Install packages
pip install -r requirements.txt
conda install -c conda-forge jupyterlab ipywidgets plotly nbformat -y
```

### Step 2: Data Collection (5-30 minutes depending on date range)

**Option A: Sample Data (Fast - 2 minutes)**

```bash
# Download just 1 month of data for testing
python fetch-gdelt.py --start 2025-11-01 --end 2025-11-30 --filter gkg
python process-gdelt.py
```

**Option B: Full Dataset (Slow - 30+ minutes)**

```bash
# Download full historical data (2013-2025)
python fetch-gdelt.py --start 2013-04-01 --end 2025-12-15 --filter gkg
python process-gdelt.py
```

**Note:** You need to manually download market data from Stooq or use your existing CSV. The project expects `results/merged_stooq_gdelt.csv`.

### Step 3: Run Models (30-60 minutes)

```bash
python modelling.py
```

**What happens:**

- Trains 4 models × 8 tickers = 32 models
- Generates equity curves, metrics, plots
- Saves results to `results/` directory

### Step 4: View Results (1 minute)

```bash
# Open interactive dashboard
jupyter lab presentation.ipynb
```

**Or** just open `results/interactive_presentation.html` in your browser!

---

## 📊 What You'll Get

After running, check these files:

```
results/
├── model_metrics.csv                    # ⭐ Main results table
├── equity_curves_*.png                  # Performance charts (8 files)
├── feature_importance_*.png             # What drives predictions (8 files)
├── calibration_*.png                    # Probability quality (8 files)
├── interactive_presentation.html        # 🎯 View this first!
└── test_data_*.csv                      # Detailed predictions (8 files)
```

### Key Questions Answered

1. **Did sentiment help?** → See `model_metrics.csv`, compare "Base RF" vs "Sent RF"
2. **Which model is best?** → Sort by `Sharpe` or `Return` columns
3. **What features matter?** → Check `feature_importance_*.png`
4. **Is it reliable?** → Review `MaxDD` and `calibration_*.png`

---

## 🎯 Interpreting Results

### Open `results/model_metrics.csv`

```csv
Ticker,Model,Accuracy,Return,Sharpe,MaxDD,WinRate,ProfitFactor
SPX,Buy & Hold,,57.79%,1.34,-19.36%,0.55,1.29
SPX,Base RF,51.57%,27.69%,0.82,-16.21%,0.47,1.18
SPX,Sent RF,53.14%,55.73%,1.32,-19.25%,0.53,1.29
SPX,Base LSTM,49.65%,9.79%,0.42,-16.37%,0.29,1.11
SPX,Sent LSTM,50.53%,58.02%,1.62,-14.11%,0.35,1.49
```

**Read it like this:**

- **Sent LSTM beat all models** (58.02% return, 1.62 Sharpe)
- **Sentiment helped:** Sent LSTM > Base LSTM (+48.23% return improvement)
- **Risk-adjusted:** Sent LSTM has best Sharpe (1.62) and lowest MaxDD (-14.11%)

### Look for These Patterns

✅ **Sentiment Works:** Sent RF/LSTM outperforms Base RF/LSTM  
✅ **Good Model:** Sharpe > 1.0, MaxDD < -20%, ProfitFactor > 1.2  
⚠️ **Overfitting Risk:** Accuracy > 55% or Return > 200%  
❌ **Model Failure:** MaxDD < -40% or ProfitFactor < 1.0

---

## 🔧 Troubleshooting

### Error: "No module named 'gdelt'"

```bash
pip install gdelt
```

### Error: "File not found: merged_stooq_gdelt.csv"

You need to either:

1. Download Stooq data manually and merge, OR
2. Use the data processing scripts (check README.md)

### LSTM training is slow

Edit `modelling.py`:

```python
SEQ_LEN = 5  # Change from 10 to 5
# In train_lstm():
    epochs=30  # Change from 50 to 30
```

### Out of memory

Process fewer tickers:

```python
# In modelling.py, change:
TICKERS = ['SPX', 'MSFT', 'NVDA']  # Instead of all 8
```

---

## 🎓 Next Steps

After getting results:

1. **Read [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md)** for key insights
2. **Check [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md)** for methodology
3. **Explore** `presentation.ipynb` for interactive analysis
4. **Validate** on new data (2026) before trusting results

---

## 🚨 Important Reminders

- ⚠️ **This is research, not trading advice**
- ⚠️ **Past performance ≠ future results**
- ⚠️ **Validate before live trading**
- ⚠️ **Add transaction costs (0.2% per trade)**
- ⚠️ **Implement stop-loss rules**

---

## 📞 Need Help?

Check these files:

- [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) — Full documentation
- [README.md](README.md) — Installation and workflow
- [GDELT_DATASET_GUIDE.md](GDELT_DATASET_GUIDE.md) — Data structure reference

---

**Happy analyzing! 🚀**

_Last updated: December 17, 2025_
