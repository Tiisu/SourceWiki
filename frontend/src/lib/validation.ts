/**
 * Client-side validation rules for the forms.
 *
 * They mirror the backend (backend/src/middleware/validator.js and the model
 * limits in backend/src/models) so people see a problem while typing instead
 * of after a round trip. The backend stays the source of truth: anything it
 * rejects is still shown next to the field (see applyServerErrors).
 *
 * Every validator returns `true` when the value is fine, otherwise the message
 * to show. That is the shape react-hook-form's `validate` rule expects.
 */

export type ValidationResult = true | string;

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 30,
  emailMax: 255,
  passwordMin: 6,
  urlMax: 2048,
  titleMax: 200,
  publisherMax: 100,
  notesMax: 500,
  pdfMaxBytes: 10 * 1024 * 1024,
} as const;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// "example.com/page" or "www.example.com": a host with a dot and no scheme
const BARE_DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+([:/?#].*)?$/i;

/* ------------------------------ Web addresses ------------------------------ */

const parseHttpUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
  const hasDomain = url.hostname.includes('.') && !url.hostname.endsWith('.');
  return isWeb && hasDomain ? url : null;
};

/** True for http(s) addresses only, so "javascript:..." and "ftp://..." are rejected. */
export const isHttpUrl = (value: string): boolean => parseHttpUrl(value) !== null;

/** Adds "https://" when someone types a bare domain such as "bbc.com/news". */
export const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  return BARE_DOMAIN_PATTERN.test(trimmed) ? `https://${trimmed}` : trimmed;
};

/** "https://www.bbc.com/news/1" -> "bbc.com". Null when the value is not a web address. */
export const hostnameOf = (value: string): string | null => {
  const url = parseHttpUrl(value);
  return url ? url.hostname.toLowerCase().replace(/^www\./, '') : null;
};

const isWikipediaUrl = (value: string): boolean => {
  const host = hostnameOf(value);
  return host !== null && (host === 'wikipedia.org' || host.endsWith('.wikipedia.org'));
};

/* --------------------------------- Email ---------------------------------- */

const EMAIL_DOMAIN_FIXES = new Map<string, string>([
  ['gmial.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gmal.com', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['gmail.co', 'gmail.com'],
  ['gmail.con', 'gmail.com'],
  ['gmail.cm', 'gmail.com'],
  ['yaho.com', 'yahoo.com'],
  ['yahooo.com', 'yahoo.com'],
  ['yahoo.con', 'yahoo.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotmal.com', 'hotmail.com'],
  ['hotmail.con', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
  ['outloo.com', 'outlook.com'],
  ['outlook.con', 'outlook.com'],
  ['iclould.com', 'icloud.com'],
  ['icloud.con', 'icloud.com'],
]);

/** "ama@gmial.com" -> "ama@gmail.com". Null when there is nothing to suggest. */
export const suggestEmail = (email: string): string | null => {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at < 1) return null;

  const fixedDomain = EMAIL_DOMAIN_FIXES.get(trimmed.slice(at + 1).toLowerCase());
  return fixedDomain ? `${trimmed.slice(0, at + 1)}${fixedDomain}` : null;
};

/* -------------------------------- Password -------------------------------- */

export interface PasswordCheck {
  label: string;
  met: boolean;
  /** Required checks block the form; the others are only advice. */
  required: boolean;
}

export const passwordChecks = (password: string): PasswordCheck[] => [
  {
    label: `At least ${LIMITS.passwordMin} characters`,
    met: password.length >= LIMITS.passwordMin,
    required: true,
  },
  {
    label: 'A letter and a number (recommended)',
    met: /\p{L}/u.test(password) && /\d/.test(password),
    required: false,
  },
];

/* ------------------------------- Validators ------------------------------- */

/** Builds a "must not be blank" validator, e.g. required('Username'). */
export const required = (label: string) => (value: string): ValidationResult =>
  value.trim() !== '' || `${label} is required`;

export const validateUsername = (value: string): ValidationResult => {
  const username = value.trim();
  if (!username) return 'Username is required';
  if (username.length < LIMITS.usernameMin) {
    return `Username must be at least ${LIMITS.usernameMin} characters`;
  }
  if (username.length > LIMITS.usernameMax) {
    return `Username cannot exceed ${LIMITS.usernameMax} characters`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can only contain letters, numbers and underscores';
  }
  return true;
};

export const validateEmail = (value: string): ValidationResult => {
  const email = value.trim();
  if (!email) return 'Email is required';
  if (email.length > LIMITS.emailMax || !EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }
  return true;
};

export const validatePassword = (value: string): ValidationResult => {
  if (!value) return 'Password is required';
  if (value.length < LIMITS.passwordMin) {
    return `Password must be at least ${LIMITS.passwordMin} characters`;
  }
  return true;
};

export const validateCountry = (value: string): ValidationResult =>
  value !== '' || 'Please select a country';

export const validateSourceUrl = (value: string): ValidationResult => {
  const url = value.trim();
  if (!url) return 'Source URL is required';
  if (url.length > LIMITS.urlMax) return `URL cannot exceed ${LIMITS.urlMax} characters`;
  if (!isHttpUrl(url)) {
    return 'Enter a full web address, for example https://example.com/article';
  }
  return true;
};

export const validateTitle = (value: string): ValidationResult => {
  const title = value.trim();
  if (!title) return 'Title is required';
  if (title.length > LIMITS.titleMax) return `Title cannot exceed ${LIMITS.titleMax} characters`;
  return true;
};

export const validatePublisher = (value: string): ValidationResult => {
  const publisher = value.trim();
  if (!publisher) return 'Publisher is required';
  if (publisher.length > LIMITS.publisherMax) {
    return `Publisher cannot exceed ${LIMITS.publisherMax} characters`;
  }
  return true;
};

/** Optional field: empty is fine, but a filled value must be a Wikipedia link. */
export const validateWikipediaArticle = (value: string): ValidationResult => {
  const url = value.trim();
  if (!url) return true;
  if (url.length > LIMITS.urlMax || !isWikipediaUrl(url)) {
    return 'Enter a Wikipedia article link, for example https://en.wikipedia.org/wiki/Ghana';
  }
  return true;
};

export const validateNotes = (value: string): ValidationResult =>
  value.trim().length <= LIMITS.notesMax || `Notes cannot exceed ${LIMITS.notesMax} characters`;

export const validatePdf = (file: { name: string; size: number; type: string }): ValidationResult => {
  // Some browsers report an empty type, so fall back to the file extension
  const isPdf = file.type === 'application/pdf' || (!file.type && /\.pdf$/i.test(file.name));
  if (!isPdf) return 'Only PDF files are allowed';
  if (file.size === 0) return 'This file is empty';
  if (file.size > LIMITS.pdfMaxBytes) return 'File size must be less than 10MB';
  return true;
};
