import { useState, useEffect } from 'react';
import { countryApi } from './api';
import { ALL_COUNTRIES, Country } from './countries';

/**
 * Hook to fetch countries from API with fallback to comprehensive list
 * @returns {Object} { countries, loading, error }
 */
export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>(ALL_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await countryApi.getList();
        
        if (response.success && response.data?.countries) {
          // Use countries from API
          setCountries(response.data.countries);
        } else if (response.success && response.countries) {
          // Handle alternative response format
          setCountries(response.countries);
        } else {
          // Fallback to comprehensive list
          console.warn('API response format unexpected, using fallback countries');
          setCountries(ALL_COUNTRIES);
        }
      } catch (err) {
        // On error, use fallback
        console.warn('Failed to fetch countries from API, using fallback:', err);
        setCountries(ALL_COUNTRIES);
        setError('Using fallback country list');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
};

