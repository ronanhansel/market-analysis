import os

import sys
# Directory to list
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = "file-list.txt"

def list_files(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            files.append(filename)
    return files

def main():
    files = list_files(DATA_DIR)
    with open(OUTPUT_FILE, "w") as f:
        for file in files:
            f.write(file + "\n")
    print(f"Saved {len(files)} files to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
