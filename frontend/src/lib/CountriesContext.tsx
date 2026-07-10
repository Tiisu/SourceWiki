import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { countryApi } from './api';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

// Fallback countries list in case API fails
const FALLBACK_COUNTRIES: Country[] = [
  // African Countries (Primary Focus)
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  
  // Other Countries
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
];

function generateFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface CountriesContextType {
  countries: Country[];
  loading: boolean;
  error: string | null;
  getCountryName: (code: string) => string;
  getCountryFlag: (code: string) => string;
}

const CountriesContext = createContext<CountriesContextType | undefined>(undefined);

export const CountriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await countryApi.getAll({ limit: 200 });
        if (response.countries && Array.isArray(response.countries)) {
          const mappedCountries = response.countries.map((c: any) => ({
            code: c.countryCode,
            name: c.countryName,
            flag: generateFlagEmoji(c.countryCode),
          }));
          setCountries(mappedCountries);
        } else {
          setCountries(FALLBACK_COUNTRIES);
        }
      } catch (err) {
        console.error('Failed to fetch countries, using fallback', err);
        setCountries(FALLBACK_COUNTRIES);
        setError('Failed to fetch from API');
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const getCountryName = (code: string): string => {
    return countries.find((c) => c.code === code)?.name || code;
  };

  const getCountryFlag = (code: string): string => {
    return countries.find((c) => c.code === code)?.flag || generateFlagEmoji(code) || '🌍';
  };

  return (
    <CountriesContext.Provider value={{ countries, loading, error, getCountryName, getCountryFlag }}>
      {children}
    </CountriesContext.Provider>
  );
};

export const useCountries = () => {
  const context = useContext(CountriesContext);
  if (context === undefined) {
    throw new Error('useCountries must be used within a CountriesProvider');
  }
  return context;
};
