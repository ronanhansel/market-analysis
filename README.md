# Market Analysis with GDELT Data

This repository processes and analyzes GDELT (Global Database of Events, Language, and Tone) data for market analysis and geopolitical event tracking.

## GDELT Dataset

GDELT monitors world news media from nearly every country, identifying people, locations, organizations, themes, sources, emotions, and events. See [`GDELT_DATASET_GUIDE.md`](GDELT_DATASET_GUIDE.md) for detailed information about the dataset structure.

## Setup

To set up the Python environment:

```bash
CONDA_PLUGINS_AUTO_ACCEPT_TOS=yes conda create -n ba python=3.10 -y
conda activate ba
pip install -r requirements.txt
conda install -c conda-forge jupyterlab ipywidgets jupyterlab_widgets
conda install -y plotly nbformat
```

## GDELT Data Workflow

### Step 1: Fetch GDELT v1 Data

Use `fetch-gdelt.py` to download GDELT v1 data (daily aggregated data). This version provides historical daily data from 1979 onwards with a 1-day delay.

**Activate conda environment first:**

```bash
conda activate ba
```

**Basic usage:**

```bash
# Fetch from specific date to today
python fetch-gdelt.py --start 2025-12-01

# Fetch from beginning to specific date
python fetch-gdelt.py --end 2025-12-10

# Fetch date range
python fetch-gdelt.py --start 2025-12-01 --end 2025-12-10

# Fetch only GKG data (recommended for this project)
python fetch-gdelt.py --start 2025-12-01 --filter gkg

# Fetch only events (skip GKG)
python fetch-gdelt.py --start 2025-12-01 --filter events

# Fetch both events and GKG
python fetch-gdelt.py --start 2025-12-01 --filter both

# Use parallel downloading (5 workers is default, increase for faster downloads)
python fetch-gdelt.py --start 2025-12-01 --workers 10

# Overwrite existing files
python fetch-gdelt.py --start 2025-12-01 --overwrite

# Specify output directory
python fetch-gdelt.py --start 2025-12-01 -d ./my-data
```

**Features:**

- **Parallel downloading**: Downloads multiple files simultaneously (default: 5 workers)
- **Resume support**: Automatically skips already downloaded files
- **Date range**: Flexible date selection with `--start` and `--end` flags
- **Table selection**: Choose between events, GKG, or both using `--filter` flag
- **Overwrite mode**: Use `--overwrite` to re-download existing files
- **Progress tracking**: Real-time progress bars with tqdm showing download status

**Output:**

- Files are saved in `data/` directory by default
- Format: `YYYYMMDD000000.export.CSV` (events) or `YYYYMMDD000000.gkg.csv` (GKG)
- Compatible with `collect-gdelt.py` for merging

### Step 2: Process and Merge Data

Use the `collect-gdelt.py` script to process and merge the downloaded files:

```bash
# Show information about downloaded files
python collect-gdelt.py --info -d data

# Merge all files by type (recommended for first-time use)
python collect-gdelt.py --merge-all -d data

# Merge specific file types
python collect-gdelt.py --merge-export -d data      # Events only
python collect-gdelt.py --merge-gkg -d data         # Knowledge graph only
python collect-gdelt.py --merge-mentions -d data    # Mentions only (v2 only)

# Export to Parquet format (more efficient for analysis)
python collect-gdelt.py --export-parquet -d data
```

**Output files:**

- `merged_export.csv` - All events across timestamps
- `merged_gkg.csv` - All knowledge graph records
- `merged_mentions.csv` - All mentions across timestamps (v2 only, not available in v1)

**Note:** GDELT v1 only supports `events` and `gkg` tables. The `mentions` table is only available in GDELT v2 (15-minute updates).

### Step 3: Analyze Data

Use the merged files for your analysis with pandas, SQL databases, or other tools.

```python
import pandas as pd

# Load merged events
events = pd.read_csv('data/merged_export.csv')

# Example: Events by country
events['ActionGeo_CountryCode'].value_counts().head(10)

# Example: Average tone by event type
events.groupby('QuadClass')['AvgTone'].mean()
```

## Complete Workflow Example

```bash
# 1. Activate conda environment
conda activate ba

# 2. Fetch GDELT data for a specific date range (GKG only)
# Using 10 parallel workers for faster downloads
python fetch-gdelt.py --start 2025-11-01 --end 2025-11-30 --filter gkg --workers 10

# 3. Check downloaded files
python collect-gdelt.py --info -d data

# 4. Merge all data
python collect-gdelt.py --merge-all -d data

# 5. (Optional) Convert to Parquet for better performance
python collect-gdelt.py --export-parquet -d data

# 6. Start analysis
jupyter lab eda.ipynb
```

## Dataset Structure

The GDELT v1 dataset consists of two main file types:

1. **Export Files** (Events) - 61 columns with event data including actors, locations, event codes, sentiment scores

   - Daily aggregated data
   - Covers 1979 onwards
   - File format: `YYYYMMDD000000.export.CSV`

2. **GKG Files** (Knowledge Graph) - 27 columns with rich semantic analysis including themes, entities, tone metrics
   - Daily aggregated data
   - Available from 2013 onwards
   - File format: `YYYYMMDD000000.gkg.csv`

See [`GDELT_DATASET_GUIDE.md`](GDELT_DATASET_GUIDE.md) for complete field descriptions and usage examples.

## GDELT v1 vs v2

**GDELT v1 (Daily)** - Used by this project:

- ✅ Daily aggregated data (1-day delay)
- ✅ Historical coverage from 1979
- ✅ Lower data volume
- ✅ Stable and well-documented
- ❌ No real-time updates
- ❌ No mentions table

**GDELT v2 (Real-time):**

- ✅ 15-minute updates
- ✅ Includes mentions table
- ✅ More detailed event tracking
- ❌ Only from 2015 onwards
- ❌ Much larger data volume
- ❌ More complex to manage

## Analysis Tips

- Start with the merged export file for event analysis
- Use GKG data for thematic and content analysis
- Filter by date, location, or actors for targeted analysis
- Consider converting to Parquet format for faster processing with large datasets
- GDELT v1 data typically becomes available ~6 hours after the day ends
- **Performance**: Use `--workers 10` or higher for faster parallel downloads if you have fast internet (200+ Mbps)
- **Resume downloads**: If interrupted, simply run the same command again - already downloaded files will be skipped

## Additional Resources

To install latex-related packages (linux):

```bash
sudo apt update
sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra cm-super dvipng fonts-liberation
```
