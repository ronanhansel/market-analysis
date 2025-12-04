# GDELT Dataset Structure Guide

## Overview
GDELT (Global Database of Events, Language, and Tone) is a real-time database that monitors world news media from nearly every corner of every country, identifying the people, locations, organizations, themes, sources, emotions, counts, quotes, images and events driving global society.

## Downloaded Files

Your dataset contains three types of files per timestamp:

### 1. **Export Files** (`*.export.CSV`)
**Purpose:** Event records - the core GDELT dataset containing coded events  
**Columns:** 61 tab-separated fields  
**Sample Size:** ~1,131 rows per 15-minute interval  
**File Size:** ~400-450 KB per file

**Key Fields:**
- `GLOBALEVENTID`: Unique identifier for each event
- `SQLDATE`: Date in YYYYMMDD format
- `Actor1Code/Name/CountryCode`: Information about the first actor in the event
- `Actor2Code/Name/CountryCode`: Information about the second actor
- `EventCode/BaseCode/RootCode`: CAMEO event taxonomy codes
- `QuadClass`: Event classification (1=Verbal Cooperation, 2=Material Cooperation, 3=Verbal Conflict, 4=Material Conflict)
- `GoldsteinScale`: Impact score from -10 (most conflict) to +10 (most cooperation)
- `NumMentions/NumSources/NumArticles`: Frequency metrics
- `AvgTone`: Average sentiment tone (-100 to +100)
- `Actor1/2Geo_*`: Geographic information (location, lat/long)
- `DATEADDED`: When the event was added (YYYYMMDDHHMMSS)
- `SOURCEURL`: Source article URL

### 2. **GKG Files** (`*.gkg.csv`)
**Purpose:** Global Knowledge Graph - rich semantic and thematic information extracted from articles  
**Columns:** 27 tab-separated fields  
**Sample Size:** ~1,253 rows per 15-minute interval  
**File Size:** ~13-15 MB per file (LARGEST files)

**Key Fields:**
- `GKGRECORDID`: Unique record identifier
- `DATE`: Publication date/time (YYYYMMDDHHMMSS)
- `SourceCollectionIdentifier`: Source type
- `SourceCommonName`: Source domain
- `DocumentIdentifier`: Article URL
- `V1Counts/V2Counts`: Coded count mentions
- `V1Themes/V2Themes`: Thematic codes and taxonomies
- `V1Locations/V2Locations`: Location mentions with coordinates
- `V1Persons/V2Persons/V2Organizations`: Entity extractions
- `V2Tone`: Multi-dimensional tone metrics
- `V2GCAM`: Global Content Analysis Measures (detailed semantic coding)
- `Extras`: Additional metadata (often contains page title, authors, etc.)

### 3. **Mentions Files** (`*.mentions.CSV`)
**Purpose:** Links events to the specific articles mentioning them  
**Columns:** 16 tab-separated fields  
**Sample Size:** ~2,694 rows per 15-minute interval  
**File Size:** ~520-570 KB per file

**Key Fields:**
- `GLOBALEVENTID`: Links to the Export file event
- `EventTimeDate`: Original event date
- `MentionTimeDate`: When the mention was published (YYYYMMDDHHMMSS)
- `MentionType`: Type of mention (1=Web news, 2=Citation Only, etc.)
- `MentionSourceName`: Source domain
- `MentionIdentifier`: Article URL
- `SentenceID/Actor1/2CharOffset`: Position in the article
- `Confidence`: Confidence score (0-100)

## File Naming Convention
Files follow the pattern: `YYYYMMDDHHMMSS.<type>.<extension>`
- Example: `20251204021500.export.CSV`
- This represents data collected at: 2025-12-04 02:15:00 UTC

## Data Update Frequency
GDELT updates every 15 minutes with new data snapshots.

## Relationships Between Files

```
Export File (Events)
    ↓ GLOBALEVENTID
Mentions File (Article Citations)
    ↓ MentionIdentifier (URL)
GKG File (Detailed Content Analysis)
```

- Each **event** in Export may have multiple **mentions** across different articles
- Each **article** may be analyzed in the **GKG** file with rich semantic data
- Use GLOBALEVENTID to connect Events → Mentions
- Use URLs (DocumentIdentifier/MentionIdentifier) to connect Mentions → GKG

## Data Format Notes
- **Delimiter:** Tab (`\t`)
- **No Headers:** Files do not contain column headers
- **Encoding:** UTF-8
- **Empty Fields:** Often present (multiple consecutive tabs)
- **Complex Fields:** Some fields contain structured data with delimiters like `;`, `#`, `,`

## Use Cases

### 1. Event Analysis (Export Files)
- Track geopolitical events and trends
- Monitor actor relationships and interactions
- Analyze conflict vs. cooperation patterns
- Study event sentiment (GoldsteinScale, AvgTone)

### 2. Content Analysis (GKG Files)
- Extract themes and topics from global news
- Perform entity recognition (persons, organizations, locations)
- Analyze emotional tone and sentiment
- Track taxonomic categorizations

### 3. Source Tracking (Mentions Files)
- Track how events spread across media sources
- Analyze publication patterns
- Study media coverage intensity
- Connect events to their source articles

## Working with the Data

### Recommended Approach
1. **Start Small:** Work with individual files from single timestamps
2. **Understand Structure:** Examine each file type separately
3. **Merge Incrementally:** Combine files of the same type across timestamps
4. **Join Carefully:** Link different file types using keys (GLOBALEVENTID, URLs)

### Storage Recommendations
- Keep raw CSV files for reference
- Store processed data in Parquet format for efficiency
- Use database (SQLite/PostgreSQL) for complex querying
- Consider data partitioning by date for large-scale analysis

## Resources
- GDELT Documentation: http://data.gdeltproject.org/documentation/
- CAMEO Event Codes: http://data.gdeltproject.org/documentation/CAMEO.Manual.1.1b3.pdf
- GKG Specification: http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf
