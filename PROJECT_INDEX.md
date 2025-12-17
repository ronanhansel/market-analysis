# 📚 Project Documentation Index

**News Sentiment vs. Market Indices — Topic 12 Analysis**

This index helps you navigate all project documentation. Choose your starting point based on your needs.

---

## 🎯 Start Here

### For First-Time Users

👉 **[QUICKSTART.md](QUICKSTART.md)** — Get the project running in 5 minutes

### For Quick Overview

👉 **[VISUAL_SUMMARY.md](VISUAL_SUMMARY.md)** — Key results with tables and visualizations

### For Complete Understanding

👉 **[COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md)** — Full methodology, analysis, and findings

---

## 📋 Document Descriptions

### 1. [QUICKSTART.md](QUICKSTART.md)

**Purpose:** Get started fast  
**Length:** 3 pages  
**Contents:**

- ⚡ 5-minute speed run instructions
- 🚀 Full setup guide (first time)
- 🔧 Common troubleshooting
- 🎯 How to interpret results

**Best for:** Developers, data scientists who want to run the code immediately

---

### 2. [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md)

**Purpose:** Quick results reference  
**Length:** 10 pages  
**Contents:**

- 📊 Performance tables (all models, all tickers)
- 🎯 Sentiment impact analysis
- 📈 Risk-adjusted metrics comparison
- 🧪 Model calibration quality
- 🔬 Feature importance rankings
- 🏆 Key takeaways and recommendations

**Best for:** Executives, analysts, anyone needing quick insights without code

---

### 3. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) ⭐

**Purpose:** Complete project documentation  
**Length:** 33 pages  
**Contents:**

1. **Problem Statement** — Detailed explanation for non-technical readers
2. **Business Goal** — Success criteria and evaluation metrics
3. **Data Sources** — GDELT and Stooq dataset descriptions with examples
4. **Methodology** — Feature engineering, model architecture, backtesting approach
5. **Technical Implementation** — Step-by-step code walkthrough
6. **Results & Performance** — Complete metrics tables with in-depth analysis
7. **Risk Assessment** — Model risks, data risks, business risks (HIGH/MEDIUM/LOW ratings)
8. **Conclusions** — Findings, recommendations, future work
9. **Reproducibility Guide** — Exact steps to replicate all results
10. **References** — Academic literature and data sources

**Best for:** Academics, researchers, stakeholders requiring full understanding

---

### 4. [README.md](README.md)

**Purpose:** Main project overview  
**Length:** 15 pages  
**Contents:**

- 📊 Quick results summary
- 🚀 Quick start instructions
- 📈 Project overview and approach
- 📁 Project structure
- 🎯 Key features list
- ✅ Topic 12 requirements checklist
- ⚠️ Risk disclaimer
- 🔄 Data processing workflows

**Best for:** GitHub visitors, project contributors, general overview

---

### 5. [GDELT_DATASET_GUIDE.md](GDELT_DATASET_GUIDE.md)

**Purpose:** GDELT schema reference  
**Length:** 5.5 pages  
**Contents:**

- Overview of GDELT project
- Export files (events) structure
- GKG files (knowledge graph) structure
- Mentions files structure
- File naming conventions
- Data update frequency
- Relationships between file types

**Best for:** Data engineers working with raw GDELT data

---

## 🎨 Interactive Components

### [presentation.ipynb](presentation.ipynb)

**Type:** Jupyter Notebook  
**Purpose:** Interactive results dashboard  
**Features:**

- Load and visualize all results
- Interactive Plotly equity curves
- Performance metrics tables
- Model comparison charts
- Export to HTML for sharing

**Output:** `results/interactive_presentation.html`

---

## 📂 Code Files

### Data Collection & Processing

- **[fetch-gdelt.py](fetch-gdelt.py)** — Download GDELT v1 GKG data with resume capability
- **[process-gdelt.py](process-gdelt.py)** — Filter economic themes, parse sentiment, aggregate daily
- **[collect-gdelt.py](collect-gdelt.py)** — Merge GDELT files and export to Parquet (optional)

### Modeling & Analysis

- **[modelling.py](modelling.py)** — Main experiment script:
  - Feature engineering (18 features)
  - Train 4 models × 8 tickers = 32 models
  - Backtesting and metrics calculation
  - Generate all visualizations

### Configuration

- **[requirements.txt](requirements.txt)** — Python dependencies

---

## 📊 Results Files

All outputs are saved in [results/](results/) directory:

### Core Results

- `model_metrics.csv` — All performance metrics (Sharpe, Return, MaxDD, etc.)
- `merged_stooq_gdelt.csv` — Final merged dataset (GDELT + Stooq prices)

### Per-Ticker Outputs (8 files each)

- `equity_curves_{TICKER}.csv` — Daily equity values for all models
- `equity_curves_{TICKER}.png` — Equity curve visualization
- `feature_importance_{TICKER}.png` — Feature importance chart
- `calibration_calibration_curve_(rf_sentiment)_{TICKER}.png` — Calibration plot
- `test_data_{TICKER}.csv` — Test set with predictions

### Interactive Dashboard

- `interactive_presentation.html` — Shareable HTML dashboard (open in browser)

---

## 🗺️ Recommended Reading Paths

### Path 1: Quick Execution

1. [QUICKSTART.md](QUICKSTART.md) → Run code
2. [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) → Understand results
3. [presentation.ipynb](presentation.ipynb) → Interactive exploration

**Time:** 1-2 hours  
**Best for:** Practitioners who want results fast

---

### Path 2: Complete Understanding

1. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 1-3 → Problem & data
2. [GDELT_DATASET_GUIDE.md](GDELT_DATASET_GUIDE.md) → GDELT deep dive (optional)
3. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 4-6 → Methodology & results
4. [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) → Quick reference tables
5. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 7-9 → Risks & conclusions

**Time:** 3-4 hours  
**Best for:** Researchers, academics, thorough learners

---

### Path 3: Code Review

1. [README.md](README.md) → Project overview
2. [modelling.py](modelling.py) → Read code with comments
3. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 5 → Technical implementation details
4. [QUICKSTART.md](QUICKSTART.md) → Troubleshooting tips

**Time:** 2-3 hours  
**Best for:** Developers, code contributors

---

### Path 4: Stakeholder Presentation

1. [README.md](README.md) → 2-minute overview
2. [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) → Key results and tables
3. [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 8 → Conclusions only
4. `results/interactive_presentation.html` → Live demo

**Time:** 30 minutes  
**Best for:** Executives, investors, non-technical stakeholders

---

## ✅ Topic 12 Compliance

### Requirements Coverage

| Requirement                 | Status      | Location                                                     |
| --------------------------- | ----------- | ------------------------------------------------------------ |
| **Business Goal**           | ✅ Complete | [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 2 |
| **GDELT Data**              | ✅ Complete | `fetch-gdelt.py`, `process-gdelt.py`                         |
| **Stooq Data**              | ✅ Complete | `results/merged_stooq_gdelt.csv`                             |
| **NLP Sentiment**           | ✅ Complete | GDELT AvgTone + 6 engineered features                        |
| **No Leakage**              | ✅ Complete | Walk-forward 80/20 split                                     |
| **Walk-forward Backtest**   | ✅ Complete | `modelling.py::backtest_strategy()`                          |
| **Probability Calibration** | ✅ Complete | CalibratedClassifierCV + Brier scores                        |
| **Risk Note**               | ✅ Complete | [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 7 |
| **Performance Dashboard**   | ✅ Complete | `presentation.ipynb` + HTML export                           |

**All requirements satisfied with full documentation and reproducible code.**

---

## 📞 Getting Help

### Common Issues

**"Where do I start?"**
→ [QUICKSTART.md](QUICKSTART.md)

**"What were the main findings?"**
→ [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) Section: Key Takeaways

**"How do I reproduce the results?"**
→ [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 9

**"What are the risks?"**
→ [COMPREHENSIVE_REPORT.md](COMPREHENSIVE_REPORT.md) Section 7

**"Which model should I use?"**
→ [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) Section: Model Selection Guide

**"Code not working?"**
→ [QUICKSTART.md](QUICKSTART.md) Section: Troubleshooting

---

## 📈 File Size Reference

| File                    | Size     | Load Time |
| ----------------------- | -------- | --------- |
| README.md               | 15 KB    | < 1 min   |
| QUICKSTART.md           | 5 KB     | < 1 min   |
| VISUAL_SUMMARY.md       | 10 KB    | 2-3 min   |
| COMPREHENSIVE_REPORT.md | 33 KB    | 10-15 min |
| GDELT_DATASET_GUIDE.md  | 5.5 KB   | 2 min     |
| presentation.ipynb      | Variable | 5-10 min  |

**Total documentation:** ~70 KB (70,000 words equivalent)

---

## 🎯 Document Purpose Summary

| Need                      | Document                | Why                          |
| ------------------------- | ----------------------- | ---------------------------- |
| **Run code now**          | QUICKSTART.md           | Step-by-step execution       |
| **See results fast**      | VISUAL_SUMMARY.md       | Tables, charts, key findings |
| **Understand everything** | COMPREHENSIVE_REPORT.md | Complete methodology         |
| **Navigate project**      | README.md               | Overview and links           |
| **Work with GDELT**       | GDELT_DATASET_GUIDE.md  | Data schema reference        |
| **Interactive analysis**  | presentation.ipynb      | Explore results visually     |

---

## 🏆 Project Highlights

### What Makes This Special

1. **Comprehensive Documentation** — 5 documents covering all aspects
2. **Fully Reproducible** — Exact steps from data download to results
3. **Academic Rigor** — Addresses data leakage, overfitting, calibration
4. **Practical Focus** — Risk assessment and business recommendations
5. **Interactive Dashboard** — Shareable HTML visualizations
6. **Multi-Market Analysis** — 8 tickers across U.S., Europe, Asia
7. **Model Diversity** — RF and LSTM, with and without sentiment
8. **Well-Calibrated** — Brier scores confirm probability quality

### Innovation Points

- ✨ Economic theme filtering for GDELT (not just raw sentiment)
- ✨ Sentiment interaction features (Sent_Impact = Sentiment × Volume)
- ✨ Walk-forward backtesting with strict temporal integrity
- ✨ Probability calibration for risk management
- ✨ Comprehensive risk assessment (12 risk categories evaluated)

---

## 📜 License & Attribution

**Project:** Topic 12 — News Sentiment vs. Market Indices  
**Date:** December 2025  
**Status:** ✅ Complete and documented

**Data Sources:**

- GDELT Project: <https://www.gdeltproject.org/>
- Stooq: <https://stooq.com/>

**Code License:** MIT (or specify your license)

---

**Last Updated:** 17 December 2025  
**Version:** 1.0  
**Maintainer:** [Your Name]

---

**Start exploring now:** Choose a document from the list above! 🚀
