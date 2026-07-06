export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
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

export const getCountryName = (code: string): string => {
  return COUNTRIES.find(c => c.code === code)?.name || code;
};

export const getCountryFlag = (code: string): string => {
  return COUNTRIES.find(c => c.code === code)?.flag || '🌍';
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'primary': return '📗';
    case 'secondary': return '📘';
    case 'unreliable': return '🚫';
    default: return '📄';
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'primary': return 'bg-green-100 text-green-800 border-green-300';
    case 'secondary': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'unreliable': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getReliabilityColor = (reliability?: string): string => {
  switch (reliability) {
    case 'credible': return 'bg-green-100 text-green-800 border-green-300';
    case 'unreliable': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'verified': return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};