/**
 * Reference data for the homepage trade map: country names as they appear in company and RFQ
 * records, a region, and a centre point used to place a marker on the map. This is reference
 * data only. Counts and activity always come from the database.
 */

export type RegionId =
  | 'asia-pacific'
  | 'middle-east'
  | 'europe'
  | 'africa'
  | 'north-america'
  | 'latin-america'
  | 'oceania';

export const REGIONS: ReadonlyArray<{ id: RegionId; label: string }> = [
  { id: 'asia-pacific', label: 'Asia-Pacific' },
  { id: 'middle-east', label: 'Middle East' },
  { id: 'europe', label: 'Europe' },
  { id: 'africa', label: 'Africa' },
  { id: 'north-america', label: 'North America' },
  { id: 'latin-america', label: 'Latin America' },
  { id: 'oceania', label: 'Oceania' },
];

export interface CountryInfo {
  name: string;
  iso2: string;
  region: RegionId;
  lon: number;
  lat: number;
}

// name, ISO 3166-1 alpha-2, region, longitude, latitude (approximate centre)
const TABLE: ReadonlyArray<readonly [string, string, RegionId, number, number]> = [
  // Asia-Pacific
  ['India', 'IN', 'asia-pacific', 78.5, 22],
  ['Pakistan', 'PK', 'asia-pacific', 69.5, 30],
  ['Bangladesh', 'BD', 'asia-pacific', 90.3, 23.8],
  ['Sri Lanka', 'LK', 'asia-pacific', 80.7, 7.8],
  ['Nepal', 'NP', 'asia-pacific', 84, 28.3],
  ['Bhutan', 'BT', 'asia-pacific', 90.4, 27.5],
  ['Maldives', 'MV', 'asia-pacific', 73.5, 3.2],
  ['Afghanistan', 'AF', 'asia-pacific', 66, 33.8],
  ['Kazakhstan', 'KZ', 'asia-pacific', 67, 48.2],
  ['Uzbekistan', 'UZ', 'asia-pacific', 63.9, 41.4],
  ['China', 'CN', 'asia-pacific', 103.8, 35.9],
  ['Hong Kong', 'HK', 'asia-pacific', 114.2, 22.3],
  ['Taiwan', 'TW', 'asia-pacific', 121, 23.7],
  ['Japan', 'JP', 'asia-pacific', 138.3, 36.5],
  ['South Korea', 'KR', 'asia-pacific', 127.8, 36.3],
  ['Mongolia', 'MN', 'asia-pacific', 103.8, 46.8],
  ['Singapore', 'SG', 'asia-pacific', 103.8, 1.35],
  ['Malaysia', 'MY', 'asia-pacific', 102, 4],
  ['Thailand', 'TH', 'asia-pacific', 101, 15.3],
  ['Vietnam', 'VN', 'asia-pacific', 106.3, 16.5],
  ['Indonesia', 'ID', 'asia-pacific', 113.9, -2.2],
  ['Philippines', 'PH', 'asia-pacific', 122.5, 12.5],
  ['Myanmar', 'MM', 'asia-pacific', 96.5, 19.8],
  ['Cambodia', 'KH', 'asia-pacific', 104.9, 12.6],
  ['Laos', 'LA', 'asia-pacific', 103.8, 18.5],
  // Middle East
  ['United Arab Emirates', 'AE', 'middle-east', 54.3, 24.3],
  ['Saudi Arabia', 'SA', 'middle-east', 45, 24],
  ['Qatar', 'QA', 'middle-east', 51.2, 25.3],
  ['Kuwait', 'KW', 'middle-east', 47.6, 29.3],
  ['Oman', 'OM', 'middle-east', 56, 21],
  ['Bahrain', 'BH', 'middle-east', 50.55, 26.05],
  ['Iran', 'IR', 'middle-east', 54.3, 32.4],
  ['Iraq', 'IQ', 'middle-east', 43.7, 33],
  ['Jordan', 'JO', 'middle-east', 36.8, 31],
  ['Israel', 'IL', 'middle-east', 35, 31.5],
  ['Lebanon', 'LB', 'middle-east', 35.9, 33.9],
  ['Turkey', 'TR', 'middle-east', 35.2, 39],
  ['Yemen', 'YE', 'middle-east', 48, 15.9],
  // Europe
  ['United Kingdom', 'GB', 'europe', -2, 54],
  ['Ireland', 'IE', 'europe', -8, 53.2],
  ['France', 'FR', 'europe', 2.5, 46.6],
  ['Germany', 'DE', 'europe', 10.4, 51.1],
  ['Netherlands', 'NL', 'europe', 5.3, 52.2],
  ['Belgium', 'BE', 'europe', 4.5, 50.6],
  ['Spain', 'ES', 'europe', -3.6, 40.2],
  ['Portugal', 'PT', 'europe', -8, 39.6],
  ['Italy', 'IT', 'europe', 12.6, 42.8],
  ['Switzerland', 'CH', 'europe', 8.2, 46.8],
  ['Austria', 'AT', 'europe', 14.5, 47.6],
  ['Poland', 'PL', 'europe', 19.4, 52],
  ['Czech Republic', 'CZ', 'europe', 15.5, 49.8],
  ['Sweden', 'SE', 'europe', 16, 62],
  ['Norway', 'NO', 'europe', 9, 61],
  ['Denmark', 'DK', 'europe', 10, 56],
  ['Finland', 'FI', 'europe', 26, 64],
  ['Greece', 'GR', 'europe', 22, 39],
  ['Romania', 'RO', 'europe', 25, 45.9],
  ['Hungary', 'HU', 'europe', 19.5, 47.1],
  ['Russia', 'RU', 'europe', 60, 58],
  ['Ukraine', 'UA', 'europe', 31.2, 49],
  ['Bulgaria', 'BG', 'europe', 25.5, 42.7],
  ['Serbia', 'RS', 'europe', 20.8, 44],
  ['Croatia', 'HR', 'europe', 16.4, 45.1],
  ['Slovakia', 'SK', 'europe', 19.5, 48.7],
  ['Lithuania', 'LT', 'europe', 23.9, 55.3],
  ['Latvia', 'LV', 'europe', 24.9, 56.9],
  ['Estonia', 'EE', 'europe', 25.5, 58.7],
  ['Malta', 'MT', 'europe', 14.4, 35.9],
  ['Cyprus', 'CY', 'europe', 33.2, 35],
  // Africa
  ['Egypt', 'EG', 'africa', 30, 26.8],
  ['South Africa', 'ZA', 'africa', 24.7, -29],
  ['Kenya', 'KE', 'africa', 37.9, 0.2],
  ['Nigeria', 'NG', 'africa', 8.1, 9.6],
  ['Ethiopia', 'ET', 'africa', 39.6, 8.6],
  ['Tanzania', 'TZ', 'africa', 34.9, -6.3],
  ['Ghana', 'GH', 'africa', -1.2, 7.9],
  ['Morocco', 'MA', 'africa', -6.5, 31.8],
  ['Algeria', 'DZ', 'africa', 2.6, 28.3],
  ['Tunisia', 'TN', 'africa', 9.5, 34],
  ['Uganda', 'UG', 'africa', 32.3, 1.4],
  ['Zambia', 'ZM', 'africa', 27.8, -13.1],
  ['Zimbabwe', 'ZW', 'africa', 29.8, -19],
  ['Mozambique', 'MZ', 'africa', 35.5, -17.3],
  ['Angola', 'AO', 'africa', 17.9, -12.3],
  ['Senegal', 'SN', 'africa', -14.5, 14.5],
  ['Ivory Coast', 'CI', 'africa', -5.5, 7.5],
  ['Cameroon', 'CM', 'africa', 12.4, 5.7],
  ['Sudan', 'SD', 'africa', 30, 15.6],
  ['Libya', 'LY', 'africa', 17.2, 27],
  ['Madagascar', 'MG', 'africa', 46.9, -19.4],
  ['Mauritius', 'MU', 'africa', 57.5, -20.3],
  ['Botswana', 'BW', 'africa', 24.7, -22.3],
  ['Namibia', 'NA', 'africa', 17.1, -22.1],
  ['Rwanda', 'RW', 'africa', 29.9, -2],
  ['DR Congo', 'CD', 'africa', 23.6, -2.9],
  // North America
  ['United States', 'US', 'north-america', -98.6, 39.5],
  ['Canada', 'CA', 'north-america', -101, 58],
  ['Mexico', 'MX', 'north-america', -102.5, 23.9],
  // Latin America
  ['Brazil', 'BR', 'latin-america', -52.8, -10.8],
  ['Argentina', 'AR', 'latin-america', -64, -34.6],
  ['Chile', 'CL', 'latin-america', -71.5, -35.7],
  ['Colombia', 'CO', 'latin-america', -73, 3.9],
  ['Peru', 'PE', 'latin-america', -75.2, -9.2],
  ['Venezuela', 'VE', 'latin-america', -66.2, 7.1],
  ['Ecuador', 'EC', 'latin-america', -78.4, -1.4],
  ['Uruguay', 'UY', 'latin-america', -56, -32.8],
  ['Paraguay', 'PY', 'latin-america', -58, -23.4],
  ['Bolivia', 'BO', 'latin-america', -64.7, -16.7],
  ['Panama', 'PA', 'latin-america', -80.1, 8.5],
  ['Costa Rica', 'CR', 'latin-america', -84.2, 9.9],
  ['Guatemala', 'GT', 'latin-america', -90.4, 15.5],
  ['Dominican Republic', 'DO', 'latin-america', -70.2, 18.9],
  ['Cuba', 'CU', 'latin-america', -79.5, 21.6],
  ['Jamaica', 'JM', 'latin-america', -77.3, 18.1],
  // Oceania
  ['Australia', 'AU', 'oceania', 134.5, -25.7],
  ['New Zealand', 'NZ', 'oceania', 172.5, -41.8],
  ['Fiji', 'FJ', 'oceania', 178, -17.8],
  ['Papua New Guinea', 'PG', 'oceania', 144, -6.5],
];

const COUNTRIES: CountryInfo[] = TABLE.map(([name, iso2, region, lon, lat]) => ({ name, iso2, region, lon, lat }));

const normalise = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[.’']/g, '')
    .replace(/\s+/g, ' ');

/** Spellings that appear in records. Values point at a canonical name in the table above. */
const ALIASES: Record<string, string> = {
  uae: 'united arab emirates',
  emirates: 'united arab emirates',
  usa: 'united states',
  us: 'united states',
  america: 'united states',
  'united states of america': 'united states',
  uk: 'united kingdom',
  britain: 'united kingdom',
  'great britain': 'united kingdom',
  england: 'united kingdom',
  scotland: 'united kingdom',
  wales: 'united kingdom',
  korea: 'south korea',
  'republic of korea': 'south korea',
  'russian federation': 'russia',
  'viet nam': 'vietnam',
  czechia: 'czech republic',
  'cote divoire': 'ivory coast',
  'hong kong sar': 'hong kong',
  'peoples republic of china': 'china',
  prc: 'china',
  turkiye: 'turkey',
  holland: 'netherlands',
  'the netherlands': 'netherlands',
  ksa: 'saudi arabia',
  burma: 'myanmar',
  drc: 'dr congo',
  'democratic republic of the congo': 'dr congo',
};

const BY_NAME = new Map(COUNTRIES.map((country) => [normalise(country.name), country]));
const BY_ISO = new Map(COUNTRIES.map((country) => [country.iso2.toLowerCase(), country]));

/** Finds a country from a free-text value such as "India", "UAE" or "IN". Returns null when unknown. */
export function findCountry(raw: string | null | undefined): CountryInfo | null {
  if (!raw) return null;
  const key = normalise(raw);
  if (!key) return null;
  return BY_NAME.get(key) ?? BY_NAME.get(ALIASES[key] ?? '') ?? (key.length === 2 ? BY_ISO.get(key) ?? null : null);
}

/** Flag emoji for a two-letter country code. */
export function flagEmoji(iso2: string | null | undefined): string {
  if (!iso2 || iso2.length !== 2) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((letter) => base + letter.charCodeAt(0) - 65));
}

export function flagForCountry(raw: string | null | undefined): string {
  return flagEmoji(findCountry(raw)?.iso2);
}
