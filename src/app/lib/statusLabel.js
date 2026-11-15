export function statusLabel(value) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown';
  const words = value.trim().replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
