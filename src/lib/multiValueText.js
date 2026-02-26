const TOKEN_SPLIT_REGEX = /[,\n;|]+/;

const normalizeToken = (value) => (value || '').toString().trim().replace(/\s+/g, ' ');

export const parseMultiValueText = (value) => {
  const rawValues = Array.isArray(value)
    ? value
    : (value || '').toString().split(TOKEN_SPLIT_REGEX);

  const tokens = [];
  const seen = new Set();

  rawValues.forEach((raw) => {
    const token = normalizeToken(raw);
    if (!token) return;
    const key = token.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tokens.push(token);
  });

  return tokens;
};

export const formatMultiValueText = (value) => parseMultiValueText(value).join('; ');
