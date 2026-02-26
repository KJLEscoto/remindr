export function useCapitalizeWords(str: string) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}