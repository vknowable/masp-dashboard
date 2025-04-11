/**
 * Convert raw amount to denominated amount (e.g., convert from micro units)
 * @param raw The raw amount to convert
 * @param exponent The denomination exponent (e.g., 6 for micro units)
 * @returns The denominated amount or null if invalid
 */
export const denomAmount = (
  raw: string | number | undefined | null,
  exponent: number = 6,
): number | null => {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const value = typeof raw === "string" ? parseFloat(raw) : raw;
  if (isNaN(value)) {
    return null;
  }

  return value / Math.pow(10, exponent);
};

// Parse numeric values, returning null for invalid/missing data
export const parseNumeric = (
  value: string | undefined | null,
): number | null => {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Format numbers with commas and decimals, handling undefined and invalid values
 * @param num The number to format
 * @param decimals Number of decimal places
 * @param withPlaceholder Whether to show '--' for invalid values
 * @returns Formatted number string
 */
export const formatNumber = (
  num: string | number | undefined | null,
  decimals: number = 2,
  withPlaceholder = true,
) => {
  // Return placeholder if value is undefined, null, or empty string
  if (num === undefined || num === null || num === "") {
    return withPlaceholder ? "--" : "0";
  }

  // Try to parse the number
  const parsedNum = typeof num === "string" ? parseFloat(num) : num;

  // Check if the parsed result is a valid number
  if (isNaN(parsedNum)) {
    return withPlaceholder ? "--" : "0";
  }

  return parsedNum.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format large numbers with magnitude indicators (B, M, K)
 * @param num The number to format
 * @returns Formatted magnitude string (e.g., "(1.23 B)")
 */
export const formatMagnitude = (num: string | number | undefined | null) => {
  if (num === undefined || num === null || num === "") return "";

  const value = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(value)) return "";

  if (value >= 1e9) {
    return `(${(value / 1e9).toFixed(2)} B)`;
  } else if (value >= 1e6) {
    return `(${(value / 1e6).toFixed(2)} M)`;
  } else if (value >= 1e3) {
    return `(${(value / 1e3).toFixed(2)} K)`;
  }
  return "";
};

/**
 * Format a percentage with a fallback value
 * @param value The percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null) => {
  if (value === null) {
    return "--";
  }
  return `${formatNumber(value, 2, false)}%`;
};

export const getNetChangeColor = (value: number | string | null) => {
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  if (parsedValue === null) return "text-gray-400";
  if (parsedValue > 0) return "text-[#00FF33]";
  if (parsedValue < 0) return "text-red-400";
  return "text-gray-400";
};

/**
 * Format a net change value with magnitude indicators (B, M, k)
 * @param value The net change value
 * @param decimals The number of decimal places to display
 * @returns Formatted net change string (e.g., "+1.23 B")
 */
export function formatNetChange(
  value: string | null,
  decimals: number = 6,
): string {
  if (value === null || value === "--") return "--";

  const num = denomAmount(value, decimals);
  if (num === null || num === 0) return "0";

  const absNum = Math.abs(num);
  let suffix = "";
  let formattedNum = absNum;

  if (absNum >= 1_000_000_000) {
    suffix = "B";
    formattedNum = absNum / 1_000_000_000;
  } else if (absNum >= 1_000_000) {
    suffix = "M";
    formattedNum = absNum / 1_000_000;
  } else if (absNum >= 1_000) {
    suffix = "k";
    formattedNum = absNum / 1_000;
  }

  const sign = num > 0 ? "+" : "-";
  return `${sign}${formattedNum.toFixed(1)} ${suffix}`;
}
