import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateId = (): string => 
  Math.random().toString(36).substring(2) + Date.now().toString(36)

export const formatMoney = (amount: number): string => 
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)

export const formatDate = (date: string | number): string => {
  if (typeof date === 'number') {
    return new Date(date).toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
}

export const formatDateSql = (date: string | number): string => {
  if (typeof date === 'number') {
    return new Date(date).toISOString().split('T')[0];
  }
  return new Date(date).toISOString().split('T')[0];
}