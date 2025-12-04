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
```

## Download GDELT Data

Download the latest GDELT data using `gdeltloader`:

```bash
# Download last 10 timestamps (15-minute intervals)
gdeltloader --master --download --overwrite --last 10
```

This will download three types of files per timestamp:

- `*.export.CSV` - Event records
- `*.gkg.csv` - Global Knowledge Graph
- `*.mentions.CSV` - Article mentions

## Process and Merge Data

Use the `collect-gdelt.py` script to process and merge the downloaded files:

```bash
# Show information about downloaded files
python collect-gdelt.py --info

# Merge all files by type (recommended for first-time use)
python collect-gdelt.py --merge-all

# Merge specific file types
python collect-gdelt.py --merge-export      # Events only
python collect-gdelt.py --merge-gkg         # Knowledge graph only
python collect-gdelt.py --merge-mentions    # Mentions only

# Export to Parquet format (more efficient for analysis)
python collect-gdelt.py --export-parquet
```

Output files:

- `merged_export.csv` - All events across timestamps
- `merged_gkg.csv` - All knowledge graph records
- `merged_mentions.csv` - All mentions across timestamps

## Dataset Structure

The GDELT dataset consists of three interconnected file types:

1. **Export Files** (Events) - 61 columns with event data including actors, locations, event codes, sentiment scores
2. **GKG Files** (Knowledge Graph) - 27 columns with rich semantic analysis including themes, entities, tone metrics
3. **Mentions Files** - 16 columns linking events to the articles that mention them

See [`GDELT_DATASET_GUIDE.md`](GDELT_DATASET_GUIDE.md) for complete field descriptions and usage examples.

## Analysis Tips

- Start with the merged export file for event analysis
- Use GKG data for thematic and content analysis
- Join mentions to track how events spread across media
- Filter by date, location, or actors for targeted analysis
- Consider converting to Parquet format for faster processing with large datasets

## Additional Resources

To install latex-related packages (linux):

```bash
sudo apt update
sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra cm-super dvipng fonts-liberation
```
