import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

class FootballPlayerScraper:
    """
    Scrapes football player data from various sources including Transfermarkt,
    FBref, and other football statistics websites.
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def search_player(self, player_name: str) -> Dict:
        """
        Main function to search for a player and gather all available data.
        """
        print(f"Searching for player: {player_name}")
        
        player_data = {
            'search_date': datetime.now().isoformat(),
            'player_name': player_name,
            'personal_info': {},
            'career_stats': [],
            'valuations': {},
            'performance_metrics': {},
            'injury_history': [],
            'positions': [],
            'sources': []
        }
        
        # Search multiple sources
        transfermarkt_data = self.scrape_transfermarkt(player_name)
        fbref_data = self.scrape_fbref(player_name)
        
        # Merge data from different sources
        player_data = self.merge_player_data(player_data, transfermarkt_data, fbref_data)
        
        return player_data
    
    def scrape_transfermarkt(self, player_name: str) -> Dict:
        """
        Scrapes Transfermarkt for player information including:
        - Personal details (DOB, height, citizenship, foot)
        - Market value and valuation history
        - Career statistics by season
        - Injury history
        - Contract information
        """
        print("Scraping Transfermarkt...")
        
        data = {
            'source': 'transfermarkt',
            'personal_info': {},
            'career_stats': [],
            'valuations': {},
            'injuries': []
        }
        
        try:
            # Search for player
            search_url = f"https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query={player_name.replace(' ', '+')}"
            response = self.session.get(search_url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract player URL from search results
                player_link = soup.find('a', class_='spielprofil_tooltip')
                if player_link:
                    player_url = "https://www.transfermarkt.com" + player_link['href']
                    
                    # Get detailed player page
                    player_response = self.session.get(player_url, timeout=10)
                    player_soup = BeautifulSoup(player_response.content, 'html.parser')
                    
                    # Extract personal information
                    data['personal_info'] = self._extract_transfermarkt_personal_info(player_soup)
                    
                    # Extract career statistics
                    data['career_stats'] = self._extract_transfermarkt_stats(player_soup)
                    
                    # Extract market value
                    data['valuations'] = self._extract_transfermarkt_value(player_soup)
                    
                    # Extract injury history
                    injury_url = player_url.replace('/profil/', '/verletzungen/')
                    data['injuries'] = self._extract_transfermarkt_injuries(injury_url)
            
            time.sleep(2)  # Respectful delay between requests
            
        except Exception as e:
            print(f"Error scraping Transfermarkt: {e}")
        
        return data
    
    def _extract_transfermarkt_personal_info(self, soup: BeautifulSoup) -> Dict:
        """Extract personal information from Transfermarkt player page."""
        info = {}
        
        try:
            # Extract from info table
            info_table = soup.find('div', class_='info-table')
            if info_table:
                rows = info_table.find_all('span', class_='info-table__content')
                labels = info_table.find_all('span', class_='info-table__content--bold')
                
                for label, value in zip(labels, rows):
                    label_text = label.text.strip().lower()
                    value_text = value.text.strip()
                    
                    if 'date of birth' in label_text or 'age' in label_text:
                        info['dob'] = value_text
                    elif 'height' in label_text:
                        info['height'] = value_text
                    elif 'citizenship' in label_text:
                        info['citizenship'] = value_text
                    elif 'foot' in label_text:
                        info['preferred_foot'] = value_text
                    elif 'position' in label_text:
                        info['position'] = value_text
                    elif 'current club' in label_text:
                        info['current_club'] = value_text
                    elif 'contract' in label_text:
                        info['contract_expires'] = value_text
        
        except Exception as e:
            print(f"Error extracting personal info: {e}")
        
        return info
    
    def _extract_transfermarkt_stats(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract career statistics by season."""
        stats = []
        
        try:
            stats_table = soup.find('table', class_='items')
            if stats_table:
                rows = stats_table.find_all('tr', class_=['odd', 'even'])
                
                for row in rows:
                    season_data = {}
                    cols = row.find_all('td')
                    
                    if len(cols) >= 8:
                        season_data['season'] = cols[0].text.strip()
                        season_data['competition'] = cols[1].text.strip()
                        season_data['club'] = cols[2].text.strip()
                        season_data['appearances'] = cols[3].text.strip()
                        season_data['goals'] = cols[4].text.strip()
                        season_data['assists'] = cols[5].text.strip()
                        season_data['yellow_cards'] = cols[6].text.strip()
                        season_data['red_cards'] = cols[7].text.strip()
                        season_data['minutes'] = cols[8].text.strip() if len(cols) > 8 else ''
                        
                        stats.append(season_data)
        
        except Exception as e:
            print(f"Error extracting stats: {e}")
        
        return stats
    
    def _extract_transfermarkt_value(self, soup: BeautifulSoup) -> Dict:
        """Extract market value information."""
        valuation = {}
        
        try:
            value_box = soup.find('div', class_='tm-player-market-value-development')
            if value_box:
                current_value = value_box.find('a', class_='data-header__market-value-wrapper')
                if current_value:
                    valuation['current_value'] = current_value.text.strip()
        
        except Exception as e:
            print(f"Error extracting valuation: {e}")
        
        return valuation
    
    def _extract_transfermarkt_injuries(self, injury_url: str) -> List[Dict]:
        """Extract injury history."""
        injuries = []
        
        try:
            response = self.session.get(injury_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                injury_table = soup.find('table', class_='items')
                
                if injury_table:
                    rows = injury_table.find_all('tr', class_=['odd', 'even'])
                    
                    for row in rows:
                        cols = row.find_all('td')
                        if len(cols) >= 5:
                            injury = {
                                'season': cols[0].text.strip(),
                                'injury_type': cols[1].text.strip(),
                                'from_date': cols[2].text.strip(),
                                'until_date': cols[3].text.strip(),
                                'days_missed': cols[4].text.strip(),
                                'games_missed': cols[5].text.strip() if len(cols) > 5 else ''
                            }
                            injuries.append(injury)
            
            time.sleep(2)
        
        except Exception as e:
            print(f"Error extracting injuries: {e}")
        
        return injuries
    
    def scrape_fbref(self, player_name: str) -> Dict:
        """
        Scrapes FBref for advanced statistics including:
        - Detailed performance metrics
        - Passing statistics
        - Defensive actions
        - Possession stats
        - Shot creation
        """
        print("Scraping FBref...")
        
        data = {
            'source': 'fbref',
            'performance_metrics': {},
            'advanced_stats': {}
        }
        
        try:
            search_url = f"https://fbref.com/en/search/search.fcgi?search={player_name.replace(' ', '+')}"
            response = self.session.get(search_url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find player page link
                search_results = soup.find('div', class_='search-item-name')
                if search_results:
                    player_link = search_results.find('a')
                    if player_link:
                        player_url = "https://fbref.com" + player_link['href']
                        
                        # Get player stats page
                        player_response = self.session.get(player_url, timeout=10)
                        stats_soup = BeautifulSoup(player_response.content, 'html.parser')
                        
                        # Extract advanced metrics
                        data['advanced_stats'] = self._extract_fbref_advanced_stats(stats_soup)
            
            time.sleep(2)
        
        except Exception as e:
            print(f"Error scraping FBref: {e}")
        
        return data
    
    def _extract_fbref_advanced_stats(self, soup: BeautifulSoup) -> Dict:
        """Extract advanced statistics from FBref."""
        stats = {
            'passing': {},
            'shooting': {},
            'defensive': {},
            'possession': {}
        }
        
        try:
            # Find stats tables
            stats_tables = soup.find_all('table', class_='stats_table')
            
            for table in stats_tables:
                table_id = table.get('id', '')
                
                # Extract relevant stats based on table type
                if 'passing' in table_id:
                    stats['passing'] = self._parse_stats_table(table)
                elif 'shooting' in table_id:
                    stats['shooting'] = self._parse_stats_table(table)
                elif 'defense' in table_id:
                    stats['defensive'] = self._parse_stats_table(table)
                elif 'possession' in table_id:
                    stats['possession'] = self._parse_stats_table(table)
        
        except Exception as e:
            print(f"Error extracting FBref stats: {e}")
        
        return stats
    
    def _parse_stats_table(self, table) -> Dict:
        """Parse a statistics table from FBref."""
        stats = {}
        
        try:
            rows = table.find('tbody').find_all('tr')
            if rows:
                # Get most recent season (usually first row)
                cols = rows[0].find_all(['th', 'td'])
                headers = [th.text.strip() for th in table.find('thead').find_all('th')]
                
                for header, col in zip(headers, cols):
                    if header and col.text.strip():
                        stats[header] = col.text.strip()
        
        except Exception as e:
            print(f"Error parsing stats table: {e}")
        
        return stats
    
    def merge_player_data(self, base_data: Dict, *source_data) -> Dict:
        """Merge data from multiple sources into a comprehensive player profile."""
        
        for data in source_data:
            if not data:
                continue
            
            # Merge personal info
            if 'personal_info' in data:
                base_data['personal_info'].update(data['personal_info'])
            
            # Merge career stats
            if 'career_stats' in data:
                base_data['career_stats'].extend(data['career_stats'])
            
            # Merge valuations
            if 'valuations' in data:
                base_data['valuations'].update(data['valuations'])
            
            # Merge performance metrics
            if 'performance_metrics' in data:
                base_data['performance_metrics'].update(data['performance_metrics'])
            
            # Merge advanced stats
            if 'advanced_stats' in data:
                base_data['performance_metrics'].update(data['advanced_stats'])
            
            # Merge injuries
            if 'injuries' in data:
                base_data['injury_history'].extend(data['injuries'])
            
            # Track sources
            if 'source' in data:
                base_data['sources'].append(data['source'])
        
        return base_data
    
    def export_to_json(self, player_data: Dict, filename: str = None):
        """Export player data to JSON file."""
        if filename is None:
            filename = f"{player_data['player_name'].replace(' ', '_')}_data.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(player_data, f, indent=2, ensure_ascii=False)
        
        print(f"Data exported to {filename}")
    
    def search_multiple_players(self, player_names: List[str]) -> List[Dict]:
        """Search for multiple players and return their data."""
        all_player_data = []
        
        for player_name in player_names:
            print(f"\n{'='*50}")
            player_data = self.search_player(player_name)
            all_player_data.append(player_data)
            print(f"{'='*50}\n")
            time.sleep(3)  # Delay between players
        
        return all_player_data


# Example usage
if __name__ == "__main__":
    scraper = FootballPlayerScraper()
    
    # Search for a single player
    player_name = "David Mella"
    player_data = scraper.search_player(player_name)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"PLAYER DATA SUMMARY FOR {player_name.upper()}")
    print(f"{'='*60}")
    print(f"\nPersonal Info: {json.dumps(player_data['personal_info'], indent=2)}")
    print(f"\nCareer Stats: Found {len(player_data['career_stats'])} seasons")
    print(f"\nValuations: {json.dumps(player_data['valuations'], indent=2)}")
    print(f"\nInjury History: Found {len(player_data['injury_history'])} injuries")
    print(f"\nData Sources: {', '.join(player_data['sources'])}")
    
    # Export to JSON
    scraper.export_to_json(player_data)
    
    # Search multiple players
    # players = ["David Mella", "Ethan Nwaneri", "Omar Marmoush"]
    # all_data = scraper.search_multiple_players(players)
    # 
    # # Export all data
    # with open('all_players_data.json', 'w') as f:
    #     json.dump(all_data, f, indent=2)