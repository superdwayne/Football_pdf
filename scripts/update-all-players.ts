// Script to update all existing players in Airtable with comprehensive data from Transfermarkt

// Mapping of player names to Transfermarkt URLs
const PLAYER_URLS: Record<string, string> = {
  "MIKE MAIGNAN": "https://www.transfermarkt.com/mike-maignan/profil/spieler/173293",
  "ALEXANDER ISAK": "https://www.transfermarkt.com/alexander-isak/profil/spieler/340027",
  "ANTONIO RÜDIGER": "https://www.transfermarkt.com/antonio-rudiger/profil/spieler/126665",
  "DAVIDE CALABRIA": "https://www.transfermarkt.com/davide-calabria/profil/spieler/204355",
  "KYLIAN MBAPPÉ": "https://www.transfermarkt.com/kylian-mbappe/profil/spieler/342229",
  "ERLING HAALAND": "https://www.transfermarkt.com/erling-haaland/profil/spieler/418560",
  "VINÍCIUS JÚNIOR": "https://www.transfermarkt.com/vinicius-junior/profil/spieler/371998",
  "GAVI": "https://www.transfermarkt.com/gavi/profil/spieler/504105",
  "FLORIAN WIRTZ": "https://www.transfermarkt.com/florian-wirtz/profil/spieler/401923",
  "FRENKIE DE JONG": "https://www.transfermarkt.com/frenkie-de-jong/profil/spieler/326330",
  "NICOLÒ BARELLA": "https://www.transfermarkt.com/nicolo-barella/profil/spieler/281963",
  "PEDRI": "https://www.transfermarkt.com/pedri/profil/spieler/504105",
  "PHIL FODEN": "https://www.transfermarkt.com/phil-foden/profil/spieler/357662",
  "FEDERICO VALVERDE": "https://www.transfermarkt.com/federico-valverde/profil/spieler/357662",
  "Lamine Yamal": "https://www.transfermarkt.com/lamine-yamal/profil/spieler/937958",
  "Kylian Mbappé": "https://www.transfermarkt.com/kylian-mbappe/profil/spieler/342229",
  "Bukayo Saka": "https://www.transfermarkt.com/bukayo-saka/profil/spieler/433177",
}

/**
 * Enhanced extraction function that gets all available data
 */
export const ENHANCED_EXTRACTION_FUNCTION = `
() => {
  const data = {};
  
  // Get clean player name
  const nameEl = document.querySelector('h1.data-header__headline-wrapper');
  if (nameEl) {
    const fullName = nameEl.textContent?.trim() || '';
    data.name = fullName.replace(/^#\\d+\\s*/, '').trim();
    const parts = data.name.split(' ');
    data.firstName = parts[0] || '';
    data.lastName = parts.slice(1).join(' ') || '';
  }
  
  // Get photo
  const img = document.querySelector('.data-header__profile-image img, .data-header__profile-container img');
  if (img) {
    data.photo = img.src || img.getAttribute('data-src') || '';
  }
  
  // Extract all info table data
  const infoRows = document.querySelectorAll('.info-table tr, table.info-table tr, [class*="info-table"] tr');
  infoRows.forEach(row => {
    const label = row.querySelector('th, td:first-child')?.textContent?.trim() || '';
    const value = row.querySelector('td:last-child, td:nth-child(2)')?.textContent?.trim() || '';
    
    if (label.toLowerCase().includes('date of birth') || label.toLowerCase().includes('born') || label.toLowerCase().includes('geboren')) {
      data.dob = value;
      const match = value.match(/(\\d{1,2})[./](\\d{1,2})[./](\\d{4})/);
      if (match) {
        const birth = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        data.age = new Date().getFullYear() - birth.getFullYear();
      }
    } else if (label.toLowerCase().includes('height') || label.toLowerCase().includes('größe')) {
      data.height = value;
    } else if (label.toLowerCase().includes('weight') || label.toLowerCase().includes('gewicht')) {
      data.weight = value;
    } else if (label.toLowerCase().includes('citizenship') || label.toLowerCase().includes('nationality') || label.toLowerCase().includes('staatsangehörigkeit')) {
      data.nationality = value;
    } else if (label.toLowerCase().includes('foot') || label.toLowerCase().includes('preferred') || label.toLowerCase().includes('fuß')) {
      data.preferredFoot = value;
    } else if (label.toLowerCase().includes('contract') || label.toLowerCase().includes('vertrag') || label.toLowerCase().includes('expires')) {
      data.contractUntil = value;
    }
  });
  
  // Get club - try multiple selectors
  const clubSelectors = [
    '.data-header__club-info a',
    '.data-header__items a[href*="/verein/"]',
    'a[href*="/verein/"]',
    '[class*="club-info"] a'
  ];
  for (const selector of clubSelectors) {
    const clubLink = document.querySelector(selector);
    if (clubLink) {
      data.currentClub = clubLink.textContent?.trim() || '';
      if (data.currentClub) break;
    }
  }
  
  // Get market value
  const valueEl = document.querySelector('.data-header__market-value-wrapper .data-header__market-value, .tm-player-market-value-development__current-value, [class*="market-value"]');
  if (valueEl) {
    data.marketValue = valueEl.textContent?.trim() || '';
  }
  
  // Get positions
  data.positions = [];
  const posEls = document.querySelectorAll('.detail-position__position, .data-header__position, [class*="position"]');
  posEls.forEach(el => {
    const pos = el.textContent?.trim()
      .replace(/Other position:\\s*/i, '')
      .replace(/Weitere Position:\\s*/i, '')
      .replace(/Main position:\\s*/i, '')
      .replace(/Main position:\\s*/i, '');
    if (pos && pos.length < 50 && !data.positions.includes(pos) && !pos.toLowerCase().includes('position')) {
      data.positions.push(pos);
    }
  });
  
  // Get statistics from performance table - scroll to find it
  data.statistics = [];
  const statsRows = document.querySelectorAll('.items tbody tr, table.items tbody tr, [class*="items"] tbody tr');
  statsRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      const season = cells[0]?.textContent?.trim() || '';
      const comp = cells[1]?.textContent?.trim() || '';
      const games = parseInt(cells[2]?.textContent?.trim() || '0', 10);
      const goals = parseInt(cells[3]?.textContent?.trim() || '0', 10);
      const assists = parseInt(cells[4]?.textContent?.trim() || '0', 10);
      const yellow = parseInt(cells[5]?.textContent?.trim() || '0', 10);
      const red = parseInt(cells[6]?.textContent?.trim() || '0', 10);
      const minsText = cells[7]?.textContent?.trim() || '0';
      const mins = parseInt(minsText.replace(/[^\\d]/g, ''), 10);
      
      if (season && comp && games > 0) {
        data.statistics.push({ 
          season, 
          competition: comp, 
          games, 
          goals, 
          assists, 
          yellowCards: yellow, 
          redCards: red, 
          minutes: mins 
        });
      }
    }
  });
  
  return data;
}
`



