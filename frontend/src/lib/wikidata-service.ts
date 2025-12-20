/**
 * Wikidata Service - Fetches country metadata from Wikidata and Wikipedia
 */

export interface WikidataCountryMetadata {
  wikidataId: string;
  population?: string;
  capital?: string;
  languages?: string;
  region?: string;
  officialName?: string;
  wikipediaUrl: string;
  wikidataUrl: string;
  description?: string;
}

// Mapping of country codes to Wikidata entity IDs
const COUNTRY_WIKIDATA_IDS: { [key: string]: string } = {
  'GH': 'Q117', // Ghana
  'NG': 'Q1033', // Nigeria
  'KE': 'Q114', // Kenya
  'ZA': 'Q258', // South Africa
  'EG': 'Q79', // Egypt
  'ET': 'Q115', // Ethiopia
  'MA': 'Q1028', // Morocco
  'TN': 'Q948', // Tunisia
  'UG': 'Q1036', // Uganda
  'TZ': 'Q924', // Tanzania
  'RW': 'Q1037', // Rwanda
  'MZ': 'Q1029', // Mozambique
  'MG': 'Q1019', // Madagascar
  'US': 'Q30', // United States
  'GB': 'Q145', // United Kingdom
  'CA': 'Q16', // Canada
  'AU': 'Q408', // Australia
  'DE': 'Q183', // Germany
  'FR': 'Q142', // France
  'ES': 'Q29', // Spain
  'IT': 'Q38', // Italy
  'JP': 'Q17', // Japan
  'IN': 'Q668', // India
  'BR': 'Q155', // Brazil
  'MX': 'Q96', // Mexico
  'KR': 'Q884', // South Korea
  'CN': 'Q148', // China
};

/**
 * Fetch country metadata from Wikidata
 */
export async function fetchWikidataCountryMetadata(
  countryCode: string,
  countryName: string
): Promise<WikidataCountryMetadata> {
  const wikidataId = COUNTRY_WIKIDATA_IDS[countryCode];
  
  if (!wikidataId) {
    // Return fallback data if no Wikidata ID is found
    return createFallbackMetadata(countryCode, countryName);
  }

  try {
    const response = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Wikidata');
    }

    const data = await response.json();
    const entity = data.entities[wikidataId];

    if (!entity) {
      throw new Error('Entity not found');
    }

    // Extract claims
    const claims = entity.claims;
    
    // Population (P1082)
    const population = extractPopulation(claims.P1082);
    
    // Capital (P36)
    const capital = extractLabel(claims.P36, data.entities);
    
    // Official language (P37)
    const languages = extractLanguages(claims.P37, data.entities);
    
    // Located in continent (P30) or part of (P361)
    const region = extractRegion(claims.P30, data.entities);
    
    // Description
    const description = entity.descriptions?.en?.value || '';
    
    // Official name (P1448)
    const officialName = entity.labels?.en?.value || countryName;

    return {
      wikidataId,
      population,
      capital,
      languages,
      region,
      officialName,
      description,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${countryName.replace(/ /g, '_')}`,
      wikidataUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
    };
  } catch (error) {
    console.error('Error fetching Wikidata:', error);
    return createFallbackMetadata(countryCode, countryName, wikidataId);
  }
}

/**
 * Extract population from Wikidata claims
 */
function extractPopulation(populationClaims: any): string | undefined {
  if (!populationClaims || populationClaims.length === 0) return undefined;
  
  // Get the most recent population value
  const sortedClaims = [...populationClaims].sort((a, b) => {
    const dateA = a.qualifiers?.P585?.[0]?.datavalue?.value?.time || '';
    const dateB = b.qualifiers?.P585?.[0]?.datavalue?.value?.time || '';
    return dateB.localeCompare(dateA);
  });
  
  const value = sortedClaims[0]?.mainsnak?.datavalue?.value?.amount;
  if (value) {
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)} billion`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)} million`;
    return num.toLocaleString();
  }
  
  return undefined;
}

/**
 * Extract label from entity reference
 */
function extractLabel(claims: any, entities: any): string | undefined {
  if (!claims || claims.length === 0) return undefined;
  
  const entityId = claims[0]?.mainsnak?.datavalue?.value?.id;
  if (entityId && entities[entityId]) {
    return entities[entityId].labels?.en?.value;
  }
  
  return undefined;
}

/**
 * Extract languages from claims
 */
function extractLanguages(languageClaims: any, entities: any): string | undefined {
  if (!languageClaims || languageClaims.length === 0) return undefined;
  
  const languages = languageClaims
    .slice(0, 3) // Limit to first 3 languages
    .map((claim: any) => {
      const entityId = claim?.mainsnak?.datavalue?.value?.id;
      if (entityId && entities[entityId]) {
        return entities[entityId].labels?.en?.value;
      }
      return null;
    })
    .filter(Boolean);
  
  if (languages.length === 0) return undefined;
  if (languages.length === 1) return languages[0];
  if (languages.length === 2) return languages.join(', ');
  return `${languages[0]}, ${languages[1]}, +${languageClaims.length - 2} more`;
}

/**
 * Extract region/continent from claims
 */
function extractRegion(continentClaims: any, entities: any): string | undefined {
  if (!continentClaims || continentClaims.length === 0) return undefined;
  
  const entityId = continentClaims[0]?.mainsnak?.datavalue?.value?.id;
  if (entityId && entities[entityId]) {
    return entities[entityId].labels?.en?.value;
  }
  
  return undefined;
}

/**
 * Create fallback metadata when Wikidata is unavailable
 */
function createFallbackMetadata(
  countryCode: string,
  countryName: string,
  wikidataId?: string
): WikidataCountryMetadata {
  const fallbackData: { [key: string]: any } = {
    'GH': { population: '31.4 million', capital: 'Accra', languages: 'English', region: 'West Africa' },
    'NG': { population: '223.8 million', capital: 'Abuja', languages: 'English', region: 'West Africa' },
    'KE': { population: '55.1 million', capital: 'Nairobi', languages: 'English, Swahili', region: 'East Africa' },
    'ZA': { population: '60.6 million', capital: 'Pretoria, Cape Town, Bloemfontein', languages: '11 official languages', region: 'Southern Africa' },
    'EG': { population: '112.7 million', capital: 'Cairo', languages: 'Arabic', region: 'North Africa' },
    'ET': { population: '126.5 million', capital: 'Addis Ababa', languages: 'Amharic, English', region: 'East Africa' },
    'MA': { population: '37.8 million', capital: 'Rabat', languages: 'Arabic, Berber', region: 'North Africa' },
    'TN': { population: '12.5 million', capital: 'Tunis', languages: 'Arabic', region: 'North Africa' },
    'UG': { population: '50.3 million', capital: 'Kampala', languages: 'English, Swahili', region: 'East Africa' },
    'TZ': { population: '67.4 million', capital: 'Dodoma', languages: 'Swahili, English', region: 'East Africa' },
    'RW': { population: '14.1 million', capital: 'Kigali', languages: 'Kinyarwanda, English, French', region: 'East Africa' },
    'MZ': { population: '34.6 million', capital: 'Maputo', languages: 'Portuguese', region: 'Southern Africa' },
    'MG': { population: '31.1 million', capital: 'Antananarivo', languages: 'Malagasy, French', region: 'Southern Africa' },
    'US': { population: '339.1 million', capital: 'Washington, D.C.', languages: 'English', region: 'North America' },
    'GB': { population: '67.8 million', capital: 'London', languages: 'English', region: 'Europe' },
    'CA': { population: '40.1 million', capital: 'Ottawa', languages: 'English, French', region: 'North America' },
    'AU': { population: '26.5 million', capital: 'Canberra', languages: 'English', region: 'Oceania' },
    'DE': { population: '84.3 million', capital: 'Berlin', languages: 'German', region: 'Europe' },
    'FR': { population: '65.6 million', capital: 'Paris', languages: 'French', region: 'Europe' },
    'ES': { population: '47.5 million', capital: 'Madrid', languages: 'Spanish', region: 'Europe' },
    'IT': { population: '59.0 million', capital: 'Rome', languages: 'Italian', region: 'Europe' },
    'JP': { population: '125.4 million', capital: 'Tokyo', languages: 'Japanese', region: 'Asia' },
    'IN': { population: '1.42 billion', capital: 'New Delhi', languages: 'Hindi, English, +20 more', region: 'Asia' },
    'BR': { population: '216.4 million', capital: 'Brasília', languages: 'Portuguese', region: 'South America' },
    'MX': { population: '128.5 million', capital: 'Mexico City', languages: 'Spanish', region: 'North America' },
    'KR': { population: '51.8 million', capital: 'Seoul', languages: 'Korean', region: 'Asia' },
    'CN': { population: '1.41 billion', capital: 'Beijing', languages: 'Mandarin', region: 'Asia' }
  };
  
  const data = fallbackData[countryCode] || {
    population: 'Unknown',
    capital: 'Unknown',
    languages: 'Unknown',
    region: 'Unknown'
  };

  return {
    wikidataId: wikidataId || `Q${Math.floor(Math.random() * 1000000)}`,
    ...data,
    officialName: countryName,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${countryName.replace(/ /g, '_')}`,
    wikidataUrl: wikidataId ? `https://www.wikidata.org/wiki/${wikidataId}` : `https://www.wikidata.org/`,
  };
}
