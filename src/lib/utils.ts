import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple localStorage JSON cache with TTL
type CacheRecord<T> = { v: T; e: number }

export function readJsonCache<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const obj = JSON.parse(raw) as CacheRecord<T>
    if (!obj || typeof obj.e !== 'number') return null
    if (Date.now() > obj.e) return null
    return obj.v
  } catch {
    return null
  }
}

export function writeJsonCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof localStorage === 'undefined') return
  try {
    const rec: CacheRecord<T> = { v: value, e: Date.now() + ttlMs }
    localStorage.setItem(key, JSON.stringify(rec))
  } catch {}
}

export function removeCache(key: string) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.removeItem(key) } catch {}
}
