import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format height from total inches to ft'in" */
export function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

/** Format OVR as zero-padded two-digit string */
export function padOVR(ovr: number): string {
  return ovr.toString().padStart(2, '0')
}
