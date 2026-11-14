const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePositiveInteger = (value, fallback) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return fallback;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getPagination = (pageValue, limitValue) => {
  const limit = Math.min(parsePositiveInteger(limitValue, DEFAULT_LIMIT), MAX_LIMIT);
  let page = parsePositiveInteger(pageValue, DEFAULT_PAGE);

  if (!Number.isSafeInteger((page - 1) * limit)) {
    page = DEFAULT_PAGE;
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};
