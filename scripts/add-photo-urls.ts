// Script to add photo URLs for all players in Airtable
// Uses browser MCP to search Transfermarkt and extract photo URLs

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"

/**
 * Extract photo URL from Transfermarkt search results or profile page
 */
export const PHOTO_EXTRACTION_FUNCTION = `
() => {
  // Try to get photo from search results first
  const searchResults = document.querySelectorAll('table tbody tr');
  for (const row of searchResults) {
    const img = row.querySelector('img[src*="transfermarkt"], img[alt*="Player"]');
    if (img && img.src && img.src.includes('transfermarkt')) {
      return { photo: img.src, source: 'search' };
    }
  }
  
  // If on profile page, get the main photo
  const profileImg = document.querySelector('.data-header__profile-image img, .data-header__profile-container img');
  if (profileImg) {
    return { photo: profileImg.src || profileImg.getAttribute('data-src') || '', source: 'profile' };
  }
  
  return { photo: '', source: 'none' };
}
`

/**
 * Get photo URL from player profile page
 */
export const PROFILE_PHOTO_EXTRACTION = `
() => {
  const img = document.querySelector('.data-header__profile-image img, .data-header__profile-container img, img[alt*="Player"]');
  if (img) {
    return img.src || img.getAttribute('data-src') || '';
  }
  return '';
}
`



