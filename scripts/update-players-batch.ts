// Batch update script for all players in Airtable
// This processes players systematically: search → navigate → extract → update

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"

// Players that need updating (from Airtable records)
export const PLAYERS_TO_UPDATE = [
  { recordId: "rec0BtzTZRbFHNRQF", name: "MIKE MAIGNAN", searchQuery: "Mike Maignan" },
  { recordId: "rec0ekNJkOKtQlxXQ", name: "ANTONIO RÜDIGER", searchQuery: "Antonio Rüdiger" },
  { recordId: "rec1EDrZ5lGsy0Fnj", name: "DAVIDE CALABRIA", searchQuery: "Davide Calabria" },
  { recordId: "rec1M3Ah2OMWzePKp", name: "KYLIAN MBAPPÉ", searchQuery: "Kylian Mbappé" },
  { recordId: "rec4Kz37Ql133U2DH", name: "ERLING HAALAND", searchQuery: "Erling Haaland" },
  { recordId: "recZZdyMPstoG6C8y", name: "VINÍCIUS JÚNIOR", searchQuery: "Vinicius Junior" },
  { recordId: "rec1oBO2SRtBX951E", name: "GAVI", searchQuery: "Gavi" },
  { recordId: "rec5dbLaOn6CLZDGT", name: "FLORIAN WIRTZ", searchQuery: "Florian Wirtz" },
  { recordId: "recAEp2Ooh8cke69j", name: "FRENKIE DE JONG", searchQuery: "Frenkie de Jong" },
  { recordId: "recLSWwie9T6TY3mJ", name: "NICOLÒ BARELLA", searchQuery: "Nicolò Barella" },
  { recordId: "recNT0LiiaIs9QHr8", name: "PEDRI", searchQuery: "Pedri" },
  { recordId: "recTC8crnto2vHo9p", name: "PHIL FODEN", searchQuery: "Phil Foden" },
  { recordId: "reck44Wj5OzCoGBAg", name: "FEDERICO VALVERDE", searchQuery: "Federico Valverde" },
  { recordId: "recPuMVuRuDtmODiK", name: "Lamine Yamal", searchQuery: "Lamine Yamal" },
  { recordId: "recmkg3TdBPXRQx80", name: "Kylian Mbappé", searchQuery: "Kylian Mbappé" },
  { recordId: "rectLlHB7JDd2L3zv", name: "Bukayo Saka", searchQuery: "Bukayo Saka" },
]

/**
 * Enhanced extraction that gets all visible data from the page
 */
export const COMPREHENSIVE_EXTRACTION = `
() => {
  const data = {};
  const nameEl = document.querySelector('h1.data-header__headline-wrapper');
  if (nameEl) {
    const fullName = nameEl.textContent?.trim() || '';
    data.name = fullName.replace(/^#\\d+\\s*/, '').trim();
    const parts = data.name.split(' ');
    data.firstName = parts[0] || '';
    data.lastName = parts.slice(1).join(' ') || '';
  }
  const img = document.querySelector('.data-header__profile-image img, .data-header__profile-container img');
  if (img) {
    data.photo = img.src || img.getAttribute('data-src') || '';
  }
  const allText = document.body.innerText;
  const dobMatch = allText.match(/Date of birth\\/Age:\\s*(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})\\s*\\((\\d+)\\)/);
  if (dobMatch) {
    data.dob = dobMatch[1] + '/' + dobMatch[2] + '/' + dobMatch[3];
    data.age = parseInt(dobMatch[4], 10);
  }
  const heightMatch = allText.match(/Height:\\s*([\\d,\.]+\\s*m)/);
  if (heightMatch) {
    data.height = heightMatch[1].replace(',', '.');
  }
  const weightMatch = allText.match(/Weight:\\s*([\\d,\.]+\\s*kg)/);
  if (weightMatch) {
    data.weight = weightMatch[1].replace(',', '.');
  }
  const footMatch = allText.match(/Foot:\\s*(\\w+)/);
  if (footMatch) {
    data.preferredFoot = footMatch[1];
  }
  const contractMatch = allText.match(/Contract expires:\\s*(\\d{2}\\/\\d{2}\\/\\d{4})/);
  if (contractMatch) {
    data.contractUntil = contractMatch[1];
  }
  const nationalityMatch = allText.match(/Citizenship:\\s*([^\\n]+)/);
  if (nationalityMatch) {
    data.nationality = nationalityMatch[1].trim();
  }
  const infoRows = document.querySelectorAll('.info-table tr, table.info-table tr, [class*="info-table"] tr, [class*="data"] tr');
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
      data.height = value.replace(',', '.');
    } else if (label.toLowerCase().includes('weight') || label.toLowerCase().includes('gewicht')) {
      data.weight = value.replace(',', '.');
    } else if (label.toLowerCase().includes('citizenship') || label.toLowerCase().includes('nationality') || label.toLowerCase().includes('staatsangehörigkeit')) {
      data.nationality = value;
    } else if (label.toLowerCase().includes('foot') || label.toLowerCase().includes('preferred') || label.toLowerCase().includes('fuß')) {
      data.preferredFoot = value;
    } else if (label.toLowerCase().includes('contract') || label.toLowerCase().includes('vertrag') || label.toLowerCase().includes('expires')) {
      data.contractUntil = value;
    }
  });
  const clubSelectors = ['.data-header__club-info a', '.data-header__items a[href*="/verein/"]', 'a[href*="/verein/"]', '[class*="club-info"] a'];
  for (const selector of clubSelectors) {
    const clubLink = document.querySelector(selector);
    if (clubLink) {
      data.currentClub = clubLink.textContent?.trim() || '';
      if (data.currentClub && !data.currentClub.includes('Without') && !data.currentClub.includes('Retired')) break;
    }
  }
  const valueEl = document.querySelector('.data-header__market-value-wrapper .data-header__market-value, .tm-player-market-value-development__current-value, [class*="market-value"]');
  if (valueEl) {
    data.marketValue = valueEl.textContent?.trim() || '';
  }
  data.positions = [];
  const posEls = document.querySelectorAll('.detail-position__position, .data-header__position, [class*="position"]');
  posEls.forEach(el => {
    const pos = el.textContent?.trim().replace(/Other position:\\s*/i, '').replace(/Weitere Position:\\s*/i, '').replace(/Main position:\\s*/i, '');
    if (pos && pos.length < 50 && !data.positions.includes(pos) && !pos.toLowerCase().includes('position')) {
      data.positions.push(pos);
    }
  });
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
        data.statistics.push({ season, competition: comp, games, goals, assists, yellowCards: yellow, redCards: red, minutes: mins });
      }
    }
  });
  return data;
}
`




