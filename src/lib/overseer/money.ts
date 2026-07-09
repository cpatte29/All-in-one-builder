/** Parses strings like "$9,000 - $18,000" or "$20,000+" into a usable range. */
export function parsePriceRange(input: string | null | undefined): { min: number; max: number; mid: number } {
  if (!input) return { min: 0, max: 0, mid: 0 };
  const nums = Array.from(input.matchAll(/[\d,]+/g)).map((m) => Number(m[0].replace(/,/g, "")));
  if (nums.length === 0) return { min: 0, max: 0, mid: 0 };
  if (nums.length === 1) {
    const v = nums[0];
    if (input.includes("+")) return { min: v, max: Math.round(v * 1.3), mid: Math.round(v * 1.15) };
    return { min: v, max: v, mid: v };
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max, mid: Math.round((min + max) / 2) };
}

export function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
