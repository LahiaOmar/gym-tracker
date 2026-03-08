import type { WeightUnit } from '@/src/domain';

const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;

/**
 * Base unit for storage. All weights are stored in kg internally.
 */
export const BASE_UNIT: WeightUnit = 'kg';

/**
 * Convert weight from one unit to another.
 * @param weight - The weight value to convert
 * @param from - The source unit
 * @param to - The target unit
 * @returns The converted weight value
 */
export function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') {
    return weight * KG_TO_LB;
  }
  return weight * LB_TO_KG;
}

/**
 * Convert a weight value from storage (kg) to the user's display unit.
 * @param weightInKg - The weight value stored in kg
 * @param displayUnit - The user's preferred display unit
 * @returns The converted weight value
 */
export function toDisplayWeight(weightInKg: number, displayUnit: WeightUnit): number {
  return convertWeight(weightInKg, BASE_UNIT, displayUnit);
}

/**
 * Convert a weight value from user input to storage unit (kg).
 * @param weight - The weight value entered by user
 * @param inputUnit - The unit the user entered the weight in
 * @returns The weight in kg for storage
 */
export function toStorageWeight(weight: number, inputUnit: WeightUnit): number {
  return convertWeight(weight, inputUnit, BASE_UNIT);
}

/**
 * Format a weight value for display with optional decimal places.
 * @param weight - The weight value (already in display unit)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted weight string
 */
export function formatWeight(weight: number, decimals: number = 1): string {
  const rounded = Math.round(weight * Math.pow(10, decimals)) / Math.pow(10, decimals);
  if (decimals === 0 || rounded === Math.floor(rounded)) {
    return Math.floor(rounded).toLocaleString();
  }
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Convert weight from storage (kg) and format for display.
 * This is the main function to use when displaying weights to users.
 * @param weightInKg - The weight value stored in kg
 * @param displayUnit - The user's preferred display unit
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted weight string in the user's preferred unit
 */
export function displayWeight(
  weightInKg: number,
  displayUnit: WeightUnit,
  decimals: number = 1
): string {
  const converted = toDisplayWeight(weightInKg, displayUnit);
  return formatWeight(converted, decimals);
}

/**
 * Convert weight from storage (kg) and format with unit label.
 * @param weightInKg - The weight value stored in kg
 * @param displayUnit - The user's preferred display unit
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "100 kg" or "220.5 lb"
 */
export function displayWeightWithUnit(
  weightInKg: number,
  displayUnit: WeightUnit,
  decimals: number = 1
): string {
  return `${displayWeight(weightInKg, displayUnit, decimals)} ${displayUnit}`;
}

/**
 * Get the unit label in uppercase for headers.
 * @param unit - The weight unit
 * @returns Uppercase unit string like "KG" or "LB"
 */
export function getUnitLabel(unit: WeightUnit): string {
  return unit.toUpperCase();
}

/**
 * Get the default weight unit.
 */
export function getDefaultUnit(): WeightUnit {
  return 'kg';
}

/**
 * Get the weight unit from user or fallback to default.
 * @param userUnit - The user's weight unit preference (may be undefined)
 * @returns The weight unit to use
 */
export function getWeightUnit(userUnit: WeightUnit | undefined | null): WeightUnit {
  return userUnit ?? 'kg';
}

/**
 * Parse weight input string that may use comma or period as decimal separator.
 * @param input - The user input string (e.g., "12.5" or "12,5")
 * @returns The parsed number, or 0 if invalid
 */
export function parseWeightInput(input: string): number {
  if (!input) return 0;
  const normalized = input.replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
