import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Formats an ID to a 6-digit string with leading zeros
 * e.g., 0 -> "#000001", 42 -> "#000043"
 */
export function formatId(id: bigint | number | string): string {
    const numId = typeof id === 'bigint' ? Number(id) : Number(id);
    return `#${String(numId + 1).padStart(6, '0')}`;
}
