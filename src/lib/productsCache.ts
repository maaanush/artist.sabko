import { supabase } from './supabaseClient'
import { readJsonCache, writeJsonCache } from './utils'

export type Product = { id: string; name: string; base_price: number }

const LS_KEY = 'products:list'
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function fetchProductsCached(ttlMs: number = DEFAULT_TTL_MS): Promise<Product[]> {
  const cached = readJsonCache<Product[]>(LS_KEY)
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, base_price')
    .order('name', { ascending: true })

  if (error) throw error
  const mapped: Product[] = (data as Array<any>).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    base_price: Number(p.base_price),
  }))
  writeJsonCache(LS_KEY, mapped, ttlMs)
  return mapped
}


