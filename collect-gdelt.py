#!/usr/bin/env python3
"""
GDELT Data Collection and Processing Script

This script processes GDELT data files (export, gkg, mentions) and merges them
into clean, consolidated datasets ready for analysis.

Usage:
    python collect-gdelt.py --merge-all          # Merge all CSV files by type
    python collect-gdelt.py --info                # Show dataset information
    python collect-gdelt.py --export-parquet      # Export merged data to Parquet format
"""

import pandas as pd
import glob
import os
from pathlib import Path
from datetime import datetime
import argparse
import sys

# GDELT column definitions based on official documentation
# These columns were determined by examining the actual data structure

EXPORT_COLUMNS = [
    'GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate',
    'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode',
    'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code',
    'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code',
    'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode',
    'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code',
    'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code',
    'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode',
    'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles',
    'AvgTone', 'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode',
    'Actor1Geo_ADM1Code', 'Actor1Geo_ADM2Code', 'Actor1Geo_Lat', 'Actor1Geo_Long',
    'Actor1Geo_FeatureID', 'Actor2Geo_Type', 'Actor2Geo_FullName',
    'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_ADM2Code',
    'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID',
    'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode',
    'ActionGeo_ADM1Code', 'ActionGeo_ADM2Code', 'ActionGeo_Lat', 'ActionGeo_Long',
    'ActionGeo_FeatureID', 'DATEADDED', 'SOURCEURL'
]

GKG_COLUMNS = [
    'GKGRECORDID', 'DATE', 'SourceCollectionIdentifier', 'SourceCommonName',
    'DocumentIdentifier', 'Counts', 'V2Counts', 'Themes', 'V2Themes',
    'Locations', 'V2Locations', 'Persons', 'V2Persons', 'Organizations',
    'V2Organizations', 'V2Tone', 'Dates', 'GCAM', 'SharingImage', 'RelatedImages',
    'SocialImageEmbeds', 'SocialVideoEmbeds', 'Quotations', 'AllNames',
    'Amounts', 'TranslationInfo', 'Extras'
]

MENTIONS_COLUMNS = [
    'GLOBALEVENTID', 'EventTimeDate', 'MentionTimeDate', 'MentionType',
    'MentionSourceName', 'MentionIdentifier', 'SentenceID', 'Actor1CharOffset',
    'Actor2CharOffset', 'ActionCharOffset', 'InRawText', 'Confidence',
    'MentionDocLen', 'MentionDocTone', 'MentionDocTranslationInfo', 'Extras'
]


class GDELTProcessor:
    """Process and merge GDELT data files"""
    
    def __init__(self, data_dir='.'):
        self.data_dir = Path(data_dir)
        self.export_files = sorted(glob.glob(str(self.data_dir / '*.export.CSV')))
        self.gkg_files = sorted(glob.glob(str(self.data_dir / '*.gkg.csv')))
        self.mentions_files = sorted(glob.glob(str(self.data_dir / '*.mentions.CSV')))
        
    def show_info(self):
        """Display information about available GDELT files"""
        print("=" * 70)
        print("GDELT Dataset Information")
        print("=" * 70)
        print(f"\nData Directory: {self.data_dir.absolute()}")
        print(f"\nExport Files (Events): {len(self.export_files)}")
        print(f"GKG Files (Knowledge Graph): {len(self.gkg_files)}")
        print(f"Mentions Files: {len(self.mentions_files)}")
        
        if self.export_files:
            print("\n" + "-" * 70)
            print("Available Timestamps:")
            print("-" * 70)
            for f in self.export_files:
                timestamp = Path(f).stem.split('.')[0]
                dt = datetime.strptime(timestamp, '%Y%m%d%H%M%S')
                size = os.path.getsize(f) / 1024  # KB
                print(f"  {dt.strftime('%Y-%m-%d %H:%M:%S')} UTC - {size:.1f} KB")
        
        # Show sample record counts
        if self.export_files:
            print("\n" + "-" * 70)
            print("Sample Record Counts (first file):")
            print("-" * 70)
            try:
                export_count = len(pd.read_csv(self.export_files[0], sep='\t', header=None, low_memory=False))
                print(f"  Events: {export_count:,}")
            except Exception as e:
                print(f"  Events: Error reading - {e}")
                
            if self.gkg_files:
                try:
                    gkg_count = len(pd.read_csv(self.gkg_files[0], sep='\t', header=None, low_memory=False))
                    print(f"  GKG Records: {gkg_count:,}")
                except Exception as e:
                    print(f"  GKG Records: Error reading - {e}")
                    
            if self.mentions_files:
                try:
                    mentions_count = len(pd.read_csv(self.mentions_files[0], sep='\t', header=None, low_memory=False))
                    print(f"  Mentions: {mentions_count:,}")
                except Exception as e:
                    print(f"  Mentions: Error reading - {e}")
        
        print("\n" + "=" * 70)
        
    def merge_export_files(self, output_file='merged_export.csv'):
        """Merge all export (events) files into a single CSV"""
        if not self.export_files:
            print("No export files found!")
            return None
            
        print(f"\nMerging {len(self.export_files)} export files...")
        dfs = []
        
        for i, file in enumerate(self.export_files, 1):
            print(f"  [{i}/{len(self.export_files)}] Reading {Path(file).name}...", end=' ')
            try:
                df = pd.read_csv(file, sep='\t', header=None, names=EXPORT_COLUMNS, 
                                low_memory=False, encoding='utf-8')
                dfs.append(df)
                print(f"✓ ({len(df):,} rows)")
            except Exception as e:
                print(f"✗ Error: {e}")
                
        if dfs:
            merged_df = pd.concat(dfs, ignore_index=True)
            merged_df = merged_df.drop_duplicates(subset=['GLOBALEVENTID'], keep='last')
            print(f"\nTotal records: {len(merged_df):,} (after deduplication)")
            
            output_path = self.data_dir / output_file
            merged_df.to_csv(output_path, index=False)
            print(f"Saved to: {output_path}")
            return merged_df
        
        return None
    
    def merge_gkg_files(self, output_file='merged_gkg.csv'):
        """Merge all GKG files into a single CSV"""
        if not self.gkg_files:
            print("No GKG files found!")
            return None
            
        print(f"\nMerging {len(self.gkg_files)} GKG files...")
        dfs = []
        
        for i, file in enumerate(self.gkg_files, 1):
            print(f"  [{i}/{len(self.gkg_files)}] Reading {Path(file).name}...", end=' ')
            try:
                df = pd.read_csv(file, sep='\t', header=None, names=GKG_COLUMNS,
                                low_memory=False, encoding='utf-8')
                dfs.append(df)
                print(f"✓ ({len(df):,} rows)")
            except Exception as e:
                print(f"✗ Error: {e}")
                
        if dfs:
            merged_df = pd.concat(dfs, ignore_index=True)
            merged_df = merged_df.drop_duplicates(subset=['GKGRECORDID'], keep='last')
            print(f"\nTotal records: {len(merged_df):,} (after deduplication)")
            
            output_path = self.data_dir / output_file
            merged_df.to_csv(output_path, index=False)
            print(f"Saved to: {output_path}")
            return merged_df
        
        return None
    
    def merge_mentions_files(self, output_file='merged_mentions.csv'):
        """Merge all mentions files into a single CSV"""
        if not self.mentions_files:
            print("No mentions files found!")
            return None
            
        print(f"\nMerging {len(self.mentions_files)} mentions files...")
        dfs = []
        
        for i, file in enumerate(self.mentions_files, 1):
            print(f"  [{i}/{len(self.mentions_files)}] Reading {Path(file).name}...", end=' ')
            try:
                df = pd.read_csv(file, sep='\t', header=None, names=MENTIONS_COLUMNS,
                                low_memory=False, encoding='utf-8')
                dfs.append(df)
                print(f"✓ ({len(df):,} rows)")
            except Exception as e:
                print(f"✗ Error: {e}")
                
        if dfs:
            merged_df = pd.concat(dfs, ignore_index=True)
            # Mentions can have duplicates (same event mentioned in multiple articles)
            # Only deduplicate exact duplicates
            merged_df = merged_df.drop_duplicates()
            print(f"\nTotal records: {len(merged_df):,} (after deduplication)")
            
            output_path = self.data_dir / output_file
            merged_df.to_csv(output_path, index=False)
            print(f"Saved to: {output_path}")
            return merged_df
        
        return None
    
    def merge_all(self):
        """Merge all file types"""
        print("\n" + "=" * 70)
        print("Merging All GDELT Files")
        print("=" * 70)
        
        export_df = self.merge_export_files()
        gkg_df = self.merge_gkg_files()
        mentions_df = self.merge_mentions_files()
        
        print("\n" + "=" * 70)
        print("Merge Complete!")
        print("=" * 70)
        print("\nOutput files:")
        if export_df is not None:
            print(f"  • merged_export.csv - {len(export_df):,} events")
        if gkg_df is not None:
            print(f"  • merged_gkg.csv - {len(gkg_df):,} knowledge graph records")
        if mentions_df is not None:
            print(f"  • merged_mentions.csv - {len(mentions_df):,} mentions")
        print()
        
    def export_to_parquet(self):
        """Export merged CSV files to Parquet format for better performance"""
        try:
            import pyarrow as pa
            import pyarrow.parquet as pq
        except ImportError:
            print("Error: pyarrow not installed. Install with: pip install pyarrow")
            return
            
        print("\n" + "=" * 70)
        print("Exporting to Parquet Format")
        print("=" * 70)
        
        files = [
            ('merged_export.csv', 'merged_export.parquet'),
            ('merged_gkg.csv', 'merged_gkg.parquet'),
            ('merged_mentions.csv', 'merged_mentions.parquet')
        ]
        
        for csv_file, parquet_file in files:
            csv_path = self.data_dir / csv_file
            if csv_path.exists():
                print(f"\nConverting {csv_file}...", end=' ')
                try:
                    df = pd.read_csv(csv_path, low_memory=False)
                    parquet_path = self.data_dir / parquet_file
                    df.to_parquet(parquet_path, index=False, compression='snappy')
                    csv_size = csv_path.stat().st_size / (1024 * 1024)
                    parquet_size = parquet_path.stat().st_size / (1024 * 1024)
                    print(f"✓ ({csv_size:.1f} MB → {parquet_size:.1f} MB)")
                except Exception as e:
                    print(f"✗ Error: {e}")
        
        print("\n" + "=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Process and merge GDELT data files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python collect-gdelt.py --info              Show dataset information
  python collect-gdelt.py --merge-all         Merge all files by type
  python collect-gdelt.py --merge-export      Merge only export (events) files
  python collect-gdelt.py --merge-gkg         Merge only GKG files
  python collect-gdelt.py --merge-mentions    Merge only mentions files
  python collect-gdelt.py --export-parquet    Export merged data to Parquet format
        """
    )
    
    parser.add_argument('--info', action='store_true',
                       help='Display information about available GDELT files')
    parser.add_argument('--merge-all', action='store_true',
                       help='Merge all GDELT file types')
    parser.add_argument('--merge-export', action='store_true',
                       help='Merge export (events) files only')
    parser.add_argument('--merge-gkg', action='store_true',
                       help='Merge GKG files only')
    parser.add_argument('--merge-mentions', action='store_true',
                       help='Merge mentions files only')
    parser.add_argument('--export-parquet', action='store_true',
                       help='Export merged CSV files to Parquet format')
    parser.add_argument('-d', '--data-dir', type=str, default='.',
                       help='Directory containing GDELT files (default: current directory)')
    
    args = parser.parse_args()
    
    # If no arguments provided, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)
    
    processor = GDELTProcessor(args.data_dir)
    
    if args.info:
        processor.show_info()
    
    if args.merge_all:
        processor.merge_all()
    elif args.merge_export:
        processor.merge_export_files()
    elif args.merge_gkg:
        processor.merge_gkg_files()
    elif args.merge_mentions:
        processor.merge_mentions_files()
    
    if args.export_parquet:
        processor.export_to_parquet()


if __name__ == '__main__':
    main()
