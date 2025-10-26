// Mock data and utilities for WikiSourceVerifier

export interface User {
  id: string;
  username: string;
  email: string;
  country: string;
  role: 'admin' | 'verifier' | 'contributor';
  points: number;
  badges: string[];
  joinDate: string;
}

export interface Submission {
  id: string;
  url: string;
  title: string;
  publisher: string;
  country: string;
  category: 'primary' | 'secondary' | 'unreliable';
  status: 'pending' | 'verified' | 'rejected';
  submitterId: string;
  submitterName: string;
  wikipediaArticle?: string;
  fileName?: string;
  mediaType: 'url' | 'pdf';
  submittedDate: string;
  verifiedDate?: string;
  verifierId?: string;
  verifierNotes?: string;
  reliability?: 'credible' | 'unreliable';
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
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
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
];

export const BADGES = [
  { id: 'first-submission', name: 'First Submission', icon: '🌟', description: 'Submitted your first reference' },
  { id: '10-verified', name: '10 Verified Sources', icon: '✅', description: 'Had 10 sources verified' },
  { id: 'country-expert', name: 'Country Expert', icon: '🏆', description: 'Top contributor in a country' },
  { id: 'early-adopter', name: 'Early Adopter', icon: '🚀', description: 'One of the first users' },
  { id: 'super-verifier', name: 'Super Verifier', icon: '⭐', description: 'Verified 50+ sources' },
  { id: 'quality-contributor', name: 'Quality Contributor', icon: '💎', description: '90% verification success rate' },
];

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'WikiEditor2024',
    email: 'editor@example.com',
    country: 'US',
    role: 'contributor',
    points: 150,
    badges: ['first-submission', '10-verified', 'early-adopter'],
    joinDate: '2024-01-15',
  },
  {
    id: '2',
    username: 'SourceVerifier',
    email: 'verifier@example.com',
    country: 'GB',
    role: 'verifier',
    points: 450,
    badges: ['super-verifier', 'country-expert'],
    joinDate: '2024-01-10',
  },
  {
    id: '3',
    username: 'AdminUser',
    email: 'admin@example.com',
    country: 'CA',
    role: 'admin',
    points: 1000,
    badges: ['early-adopter', 'super-verifier', 'country-expert'],
    joinDate: '2024-01-01',
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: '1',
    url: 'https://www.nature.com/articles/climate-change-2024',
    title: 'Climate Change Impact Study 2024',
    publisher: 'Nature Publishing Group',
    country: 'GB',
    category: 'primary',
    status: 'verified',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    wikipediaArticle: 'https://en.wikipedia.org/wiki/Climate_change',
    mediaType: 'url',
    submittedDate: '2024-10-20',
    verifiedDate: '2024-10-21',
    verifierId: '2',
    reliability: 'credible',
    verifierNotes: 'Peer-reviewed journal, excellent source',
  },
  {
    id: '2',
    url: 'https://arxiv.org/abs/2024.12345',
    title: 'Quantum Computing Advances',
    publisher: 'arXiv',
    country: 'US',
    category: 'primary',
    status: 'pending',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    mediaType: 'url',
    submittedDate: '2024-10-25',
  },
  {
    id: '3',
    url: 'https://www.bbc.com/news/world-europe-12345678',
    title: 'European Union Policy Update',
    publisher: 'BBC News',
    country: 'GB',
    category: 'secondary',
    status: 'verified',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    wikipediaArticle: 'https://en.wikipedia.org/wiki/European_Union',
    mediaType: 'url',
    submittedDate: '2024-10-18',
    verifiedDate: '2024-10-19',
    verifierId: '2',
    reliability: 'credible',
  },
  {
    id: '4',
    url: 'https://example-blog.com/conspiracy-theory',
    title: 'Unverified Claims Article',
    publisher: 'Random Blog',
    country: 'US',
    category: 'unreliable',
    status: 'verified',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    mediaType: 'url',
    submittedDate: '2024-10-15',
    verifiedDate: '2024-10-16',
    verifierId: '2',
    reliability: 'unreliable',
    verifierNotes: 'No editorial oversight, unverified claims',
  },
  {
    id: '5',
    url: 'https://history.gov/documents/historical-analysis.pdf',
    title: 'Historical Analysis of WWII',
    publisher: 'National Archives',
    country: 'US',
    category: 'primary',
    status: 'pending',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    fileName: 'historical-analysis.pdf',
    mediaType: 'pdf',
    submittedDate: '2024-10-26',
  },
  {
    id: '6',
    url: 'https://www.sciencedirect.com/article/medical-research',
    title: 'Medical Research Findings',
    publisher: 'Elsevier',
    country: 'DE',
    category: 'primary',
    status: 'verified',
    submitterId: '1',
    submitterName: 'WikiEditor2024',
    wikipediaArticle: 'https://en.wikipedia.org/wiki/Medical_research',
    mediaType: 'url',
    submittedDate: '2024-10-22',
    verifiedDate: '2024-10-23',
    verifierId: '2',
    reliability: 'credible',
  },
];

export const leaderboardData = [
  { username: 'AdminUser', country: 'CA', points: 1000, verified: 85 },
  { username: 'SourceVerifier', country: 'GB', points: 450, verified: 52 },
  { username: 'WikiEditor2024', country: 'US', points: 150, verified: 12 },
  { username: 'FactChecker', country: 'AU', points: 320, verified: 38 },
  { username: 'AcademicSource', country: 'DE', points: 280, verified: 29 },
];

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'wikisource_user',
  SUBMISSIONS: 'wikisource_submissions',
};

// Utility functions
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

// Initialize data from localStorage or use mock data
export const initializeData = () => {
  const storedSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  if (!storedSubmissions) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(mockSubmissions));
  }
};

// API simulation functions
export const saveSubmissions = (submissions: Submission[]) => {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
};

export const getSubmissions = (): Submission[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  return stored ? JSON.parse(stored) : mockSubmissions;
};

export const saveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const getUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};
