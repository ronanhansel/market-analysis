#!/usr/bin/env python3
"""
GDELT Data Fetching Script (Version 1.0 - Daily Data)

This script uses the gdelt Python library to fetch GDELT v1 data,
which provides daily updates from 1979 onwards. The downloaded data
is saved in tab-separated format compatible with collect-gdelt.py.

Usage:
    python fetch-gdelt.py --start 2025-12-01               # From start date to today
    python fetch-gdelt.py --end 2025-12-10                 # From beginning to end date
    python fetch-gdelt.py --start 2025-12-01 --end 2025-12-10  # Date range
    python fetch-gdelt.py --start 2025-12-01 --overwrite   # Overwrite existing files
"""

import gdelt
import pandas as pd
import argparse
import sys
from pathlib import Path
from datetime import datetime, timedelta
import os
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading


class GDELTFetcher:
    """Fetch GDELT v1 data using the gdelt library"""
    
    def __init__(self, data_dir='data', overwrite=False, max_workers=5):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.overwrite = overwrite
        self.max_workers = max_workers
        self.gd = gdelt.gdelt(version=1)
        
        # Track statistics (thread-safe)
        self.stats = {
            'downloaded': 0,
            'skipped': 0,
            'failed': 0,
            'total_rows': 0
        }
        self.stats_lock = threading.Lock()
    
    def generate_date_range(self, start_date, end_date):
        """Generate list of dates between start and end (inclusive)"""
        dates = []
        current = start_date
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)
        return dates
    
    def date_to_filename(self, date, table_type):
        """
        Convert date to GDELT filename format matching collect-gdelt.py expectations
        Format: YYYYMMDDHHMMSS.<type>.CSV
        For v1 daily data, we use 000000 for time since it's daily aggregated
        """
        date_str = date.strftime('%Y%m%d')
        if table_type == 'events':
            return f"{date_str}000000.export.CSV"
        elif table_type == 'gkg':
            return f"{date_str}000000.gkg.csv"
        else:
            raise ValueError(f"Unknown table type: {table_type}")
    
    def file_exists(self, filepath):
        """Check if file exists and is not empty"""
        return filepath.exists() and filepath.stat().st_size > 0
    
    def fetch_date(self, date, table='events'):
        """
        Fetch GDELT data for a specific date and table type
        
        Args:
            date: datetime object
            table: 'events' or 'gkg'
        
        Returns:
            pandas DataFrame or None if failed
        """
        # Format date for gdelt library (YYYY MM DD)
        date_str = date.strftime('%Y %m %d')
        
        try:
            tqdm.write(f"  📥 Fetching {table} data for {date.strftime('%Y-%m-%d')}...", end=' ')
            
            # Fetch data
            df = self.gd.Search([date_str], table=table)
            
            if df is not None and len(df) > 0:
                tqdm.write(f"✓ ({len(df):,} rows)")
                return df
            else:
                tqdm.write(f"✗ No data returned")
                return None
                
        except Exception as e:
            tqdm.write(f"✗ Error: {e}")
            return None
    
    def save_data(self, df, date, table='events'):
        """
        Save DataFrame to TSV format compatible with collect-gdelt.py
        
        Args:
            df: pandas DataFrame
            date: datetime object
            table: 'events' or 'gkg'
        """
        filename = self.date_to_filename(date, table)
        filepath = self.data_dir / filename
        
        # Check if file exists and overwrite flag
        if self.file_exists(filepath) and not self.overwrite:
            print(f"  File exists, skipping: {filename}")
            with self.stats_lock:
                self.stats['skipped'] += 1
            return True
        
        try:
            # Save as TSV without header (to match GDELT raw format)
            df.to_csv(filepath, sep='\t', index=False, header=False, encoding='utf-8')
            size_kb = filepath.stat().st_size / 1024
            tqdm.write(f"  💾 Saved: {filename} ({size_kb:.1f} KB)")
            with self.stats_lock:
                self.stats['downloaded'] += 1
                self.stats['total_rows'] += len(df)
            return True
        except Exception as e:
            tqdm.write(f"  ❌ Error saving {filename}: {e}")
            with self.stats_lock:
                self.stats['failed'] += 1
            return False
    
    def fetch_and_save_single(self, date, table):
        """
        Fetch and save data for a single date and table combination.
        This method is designed to be called in parallel.
        
        Args:
            date: datetime object
            table: 'events' or 'gkg'
        
        Returns:
            tuple: (success: bool, date: datetime, table: str, message: str)
        """
        filename = self.date_to_filename(date, table)
        filepath = self.data_dir / filename
        
        # Check if file already exists
        if self.file_exists(filepath) and not self.overwrite:
            size_kb = filepath.stat().st_size / 1024
            with self.stats_lock:
                self.stats['skipped'] += 1
            return (True, date, table, f"⏭️  Skipped (exists): {filename} ({size_kb:.1f} KB)")
        
        # Fetch data
        df = self.fetch_date(date, table)
        
        if df is not None:
            success = self.save_data(df, date, table)
            if success:
                size_kb = filepath.stat().st_size / 1024
                return (True, date, table, f"✓ Saved: {filename} ({size_kb:.1f} KB)")
            else:
                return (False, date, table, f"✗ Failed to save: {filename}")
        else:
            with self.stats_lock:
                self.stats['failed'] += 1
            return (False, date, table, f"✗ Failed to fetch {table} for {date.strftime('%Y-%m-%d')}")
    
    def fetch_date_range(self, start_date, end_date, tables=None):
        """
        Fetch GDELT data for a date range
        
        Args:
            start_date: datetime object
            end_date: datetime object
            tables: list of table types ['events', 'gkg'] or None for both
        """
        if tables is None:
            tables = ['events', 'gkg']
        
        dates = self.generate_date_range(start_date, end_date)
        total_dates = len(dates)
        
        print("=" * 70)
        print("GDELT v1 Data Fetcher (Parallel Mode)")
        print("=" * 70)
        print(f"Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"Total Days: {total_dates}")
        print(f"Tables: {', '.join(tables)}")
        print(f"Output Directory: {self.data_dir.absolute()}")
        print(f"Overwrite Mode: {'ON' if self.overwrite else 'OFF'}")
        print(f"Parallel Workers: {self.max_workers}")
        print("=" * 70)
        print()
        
        # Create list of all tasks (date, table combinations)
        tasks = [(date, table) for date in dates for table in tables]
        total_tasks = len(tasks)
        
        # Progress bar for all tasks
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            futures = {executor.submit(self.fetch_and_save_single, date, table): (date, table) 
                      for date, table in tasks}
            
            # Process completed tasks with progress bar
            with tqdm(total=total_tasks, desc="Downloading", unit="file") as pbar:
                for future in as_completed(futures):
                    date, table = futures[future]
                    try:
                        success, ret_date, ret_table, message = future.result()
                        tqdm.write(f"  {message}")
                    except Exception as e:
                        tqdm.write(f"  ❌ Exception for {date.strftime('%Y-%m-%d')} {table}: {e}")
                        with self.stats_lock:
                            self.stats['failed'] += 1
                    
                    pbar.update(1)
        
        print()
        
        self.print_summary()
    
    def print_summary(self):
        """Print download summary statistics"""
        print("=" * 70)
        print("Download Summary")
        print("=" * 70)
        print(f"Files Downloaded: {self.stats['downloaded']}")
        print(f"Files Skipped: {self.stats['skipped']}")
        print(f"Failed Downloads: {self.stats['failed']}")
        print(f"Total Rows Downloaded: {self.stats['total_rows']:,}")
        print("=" * 70)
        print()
        print("Next Steps:")
        print(f"  1. Check downloaded files: ls -lh {self.data_dir}")
        print(f"  2. Merge data: python collect-gdelt.py --merge-all -d {self.data_dir}")
        print()


def parse_date(date_str):
    """Parse date string in YYYY-MM-DD format"""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")


def main():
    parser = argparse.ArgumentParser(
        description='Fetch GDELT v1 data (daily updates)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch from specific date to today
  python fetch-gdelt.py --start 2025-12-01
  
  # Fetch from beginning to specific date
  python fetch-gdelt.py --end 2025-12-10
  
  # Fetch date range
  python fetch-gdelt.py --start 2025-12-01 --end 2025-12-10
  
  # Overwrite existing files
  python fetch-gdelt.py --start 2025-12-01 --overwrite
  
  # Fetch only events (not GKG)
  python fetch-gdelt.py --start 2025-12-01 --tables events
  
  # Fetch only GKG using --filter
  python fetch-gdelt.py --start 2025-12-01 --filter gkg
  
  # Use more parallel workers for faster downloads
  python fetch-gdelt.py --start 2025-12-01 --workers 10
  
  # Specify output directory
  python fetch-gdelt.py --start 2025-12-01 -d ./gdelt-data

Notes:
  - GDELT v1 provides daily aggregated data
  - Date range is inclusive (both start and end dates are fetched)
  - Default behavior is to skip existing files (use --overwrite to replace)
  - Downloaded files are compatible with collect-gdelt.py for merging
        """
    )
    
    parser.add_argument('--start', type=parse_date,
                       help='Start date (YYYY-MM-DD). If not specified, fetches from GDELT v1 start date.')
    parser.add_argument('--end', type=parse_date,
                       help='End date (YYYY-MM-DD). If not specified, fetches until today.')
    parser.add_argument('--overwrite', action='store_true',
                       help='Overwrite existing files instead of skipping them')
    parser.add_argument('-d', '--data-dir', type=str, default='data',
                       help='Directory to save downloaded files (default: data)')
    parser.add_argument('--tables', nargs='+', choices=['events', 'gkg'],
                       help='Which tables to download (default: both events and gkg)')
    parser.add_argument('--filter', type=str, choices=['events', 'gkg', 'both'],
                       help='Filter which dataset to download: events, gkg, or both (default: both). Alias for --tables')
    parser.add_argument('-w', '--workers', type=int, default=5,
                       help='Number of parallel workers for downloading (default: 5)')
    
    args = parser.parse_args()
    
    # If no arguments provided, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)
    
    # Set default dates
    today = datetime.now().date()
    today = datetime(today.year, today.month, today.day)
    
    # GDELT v1 starts from 1979-01-01
    gdelt_v1_start = datetime(1979, 1, 1)
    
    start_date = args.start if args.start else gdelt_v1_start
    end_date = args.end if args.end else today
    
    # Validate date range
    if start_date > end_date:
        print(f"Error: Start date ({start_date.strftime('%Y-%m-%d')}) is after end date ({end_date.strftime('%Y-%m-%d')})")
        sys.exit(1)
    
    if end_date > today:
        print(f"Warning: End date ({end_date.strftime('%Y-%m-%d')}) is in the future. Setting to today.")
        end_date = today
    
    # Handle --filter flag (alias for --tables)
    tables = args.tables
    if args.filter:
        if args.filter == 'both':
            tables = ['events', 'gkg']
        else:
            tables = [args.filter]
    
    # Create fetcher and download data
    fetcher = GDELTFetcher(data_dir=args.data_dir, overwrite=args.overwrite, max_workers=args.workers)
    
    try:
        fetcher.fetch_date_range(start_date, end_date, tables=tables)
    except KeyboardInterrupt:
        print("\n\nDownload interrupted by user.")
        fetcher.print_summary()
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
