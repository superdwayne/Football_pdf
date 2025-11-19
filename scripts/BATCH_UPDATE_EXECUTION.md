# Batch Update All Players - Execution Guide

## Overview

This script processes all players in Airtable to:
1. Add photo URLs for all players
2. Fill in all missing data columns
3. Ensure complete data for chart generation

## Execution Steps

The script will:
1. Fetch all players from Airtable
2. For each player:
   - Search Transfermarkt by name
   - Navigate to player profile
   - Extract comprehensive data (photo, stats, profile info, etc.)
   - Convert to Airtable format
   - Update the record with all available data

## Data Fields Updated

### Profile Information
- Photo URL ✅
- First Name, Last Name
- Date of Birth, Age
- Height, Weight
- Nationality, Preferred Foot
- Current Club, Contract Until

### Statistics
- Total Games, Goals, Assists
- Total Yellow Cards, Red Cards
- Total Minutes
- Average Rating

### Valuations
- Transfermarkt Value EUR
- TFG Intrinsic Value EUR
- Premier League Value EUR
- La Liga Value EUR
- Serie A Value EUR
- Bundesliga Value EUR
- Ligue 1 Value EUR
- SPL Value EUR

### JSON Data
- League Appearances JSON
- Transfer History JSON
- Injury Record JSON
- Performance Data JSON
- Positions Played

## Notes

- The script preserves existing data when new data is not available
- Photo URLs are always updated when found
- Statistics are calculated from scraped data
- Valuations are calculated based on market value or performance metrics
- Processing includes delays to avoid rate limits

