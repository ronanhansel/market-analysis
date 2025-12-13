import pandas as pd
import glob
import os
import csv
import time
from multiprocessing import Pool, cpu_count
from tqdm import tqdm  # Progress bar

# --- CONFIGURATION ---
INPUT_DIR = "data"                  # Folder containing .gkg.csv files
OUTPUT_FILE = "results/gdelt_economic_signals.csv"  # Final aggregated output
LOG_FILE = "processed_log.txt"      # Tracks finished files
CPU_CORES = max(1, cpu_count() - 1) # Leave 1 core free for OS

# GDELT V1 GKG Column Names (Files have no headers)
COL_NAMES = [   
    "DATE", "NUMARTS", "COUNTS", "THEMES", "LOCATIONS", 
    "PERSONS", "ORGANIZATIONS", "TONE", "CAMEOEVENTIDS", 
    "SOURCES", "SOURCEURLS"
]

# TARGET THEMES (Economic & Volatility Drivers)
# If ANY of these substrings appear in THEMES, we keep the row.
KEEP_THEMES = [
    "ECON_", "TAX_", "BUS_", 
    "WB_470", "WB_325", "WB_1104", "WB_698", "WB_2433",
    "IMF", "WORLD_BANK", "FED", "CENTRAL_BANK"
]

def is_relevant(theme_str):
    """Fast string check for themes."""
    if not isinstance(theme_str, str):
        return False
    # Check if any keyword exists in the theme string
    for k in KEEP_THEMES:
        if k in theme_str:
            return True
    return False

def process_file(file_path):
    """
    Worker function: Reads one CSV, filters, aggregates, returns result.
    """
    try:
        # 1. Read specific columns only to save RAM
        # quoted=csv.QUOTE_NONE is crucial because GDELT V1 is messy with quotes
        df = pd.read_csv(
            file_path, 
            sep='\t', 
            names=COL_NAMES, 
            usecols=['DATE', 'THEMES', 'TONE'],
            dtype={'DATE': str, 'THEMES': str, 'TONE': str},
            on_bad_lines='skip',
            encoding='utf-8',
            quoting=csv.QUOTE_NONE
        )
        
        # 2. Filter Rows (Discard non-economic news immediately)
        df = df[df['THEMES'].apply(is_relevant)]
        
        if df.empty:
            return (file_path, None)

        # 3. Parse TONE
        # Format: "AvgTone,Pos,Neg,Polarity,ARD,SGRD"
        # We need index 0 (AvgTone) and 3 (Polarity)
        tone_data = df['TONE'].str.split(',', expand=True)
        
        # Safety check: ensure split worked
        if tone_data.shape[1] < 4:
            return (file_path, None)

        df['AvgTone'] = pd.to_numeric(tone_data[0], errors='coerce')
        df['Polarity'] = pd.to_numeric(tone_data[3], errors='coerce')

        # 4. Aggregate to 1 Row Per Date
        agg_df = df.groupby('DATE').agg({
            'AvgTone': ['mean', 'std'],
            'Polarity': 'mean',
            'THEMES': 'count' # Volume
        }).reset_index()

        # Flatten MultiIndex columns
        agg_df.columns = ['Date', 'News_Sentiment', 'News_Disagreement', 'News_Volatility', 'News_Volume']
        
        return (file_path, agg_df)

    except Exception as e:
        # Return the error but don't crash the main process
        return (file_path, None)

if __name__ == "__main__":
    # 1. Setup Resume Logic
    processed_files = set()
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            processed_files = set(f.read().splitlines())

    # Create output file with header if it doesn't exist
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'w') as f:
            f.write("Date,News_Sentiment,News_Disagreement,News_Volatility,News_Volume\n")

    # 2. Get File List
    all_files = glob.glob(os.path.join(INPUT_DIR, "*.gkg.csv"))
    files_to_process = [f for f in all_files if os.path.basename(f) not in processed_files]
    
    print(f"Total files: {len(all_files)}")
    print(f"Already processed: {len(processed_files)}")
    print(f"Remaining: {len(files_to_process)}")

    if not files_to_process:
        print("All files processed!")
        exit()

    # 3. Parallel Processing with TQDM
    # We use 'imap' (or imap_unordered) which yields results lazily, allowing tqdm to update.
    with open(OUTPUT_FILE, 'a') as csv_out, open(LOG_FILE, 'a') as log_out:
        with Pool(processes=CPU_CORES) as pool:
            # imap_unordered is faster as it yields whoever finishes first
            iterator = pool.imap_unordered(process_file, files_to_process)
            
            # Wrap the iterator with tqdm for the progress bar
            for file_path, result_df in tqdm(iterator, total=len(files_to_process), unit="file"):
                
                # Write Data (if valid)
                if result_df is not None:
                    result_df.to_csv(csv_out, header=False, index=False)
                
                # Update Log (regardless of whether data was found, so we don't retry empties)
                log_out.write(os.path.basename(file_path) + "\n")
                
                # Flush explicitly periodically if you are paranoid about crashes
                # csv_out.flush()
                # log_out.flush()

    print("Processing Complete.")