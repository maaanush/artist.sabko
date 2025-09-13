import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CacheEntry = { signedUrl: string; expiresAt: number }

const INFLIGHT = new Map<string, Promise<CacheEntry>>()
const LS_PREFIX = 'supabase:signedUrl:'

function now() { return Date.now() }
function jitter(ms: number) {
  const delta = ms * 0.1
  return Math.max(5000, ms + (Math.random() * 2 - 1) * delta)
}

function storageKey(bucketId: string, path: string) {
  return `${LS_PREFIX}${bucketId}:${path}`
}

function readCache(bucketId: string, path: string): CacheEntry | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(bucketId, path))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.signedUrl || !parsed?.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(bucketId: string, path: string, entry: CacheEntry) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(bucketId, path), JSON.stringify(entry))
  } catch {}
}

async function signAndCache(bucketId: string, path: string, expiresInSeconds: number): Promise<CacheEntry> {
  const key = storageKey(bucketId, path)
  if (INFLIGHT.has(key)) return INFLIGHT.get(key) as Promise<CacheEntry>

  const p = (async () => {
    const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(path, expiresInSeconds)
    if (error || !data?.signedUrl) {
      throw error ?? new Error('Failed to create signed URL')
    }
    const entry: CacheEntry = { signedUrl: data.signedUrl, expiresAt: now() + expiresInSeconds * 1000 }
    writeCache(bucketId, path, entry)
    return entry
  })().finally(() => {
    INFLIGHT.delete(key)
  })

  INFLIGHT.set(key, p)
  return p
}

export function useSignedStorageUrl(bucketId: string, path: string | null | undefined, expiresInSeconds = 3600) {
  const [url, setUrl] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    async function ensureUrl() {
      clearTimer()
      if (!path) {
        setUrl(null)
        return
      }

      const cached = readCache(bucketId, path)
      const safeSkewMs = 60_000 // consider URL due for refresh 60s before expiry
      const stillValid = cached && cached.expiresAt - safeSkewMs > now()

      if (stillValid) {
        setUrl(cached!.signedUrl)
        // schedule refresh near expiry with jitter
        const msUntilRefresh = Math.max(cached!.expiresAt - safeSkewMs - now(), 30_000)
        timerRef.current = window.setTimeout(ensureUrl, jitter(msUntilRefresh))
        return
      }

      try {
        const entry = await signAndCache(bucketId, path, expiresInSeconds)
        setUrl(entry.signedUrl)
        const msUntilRefresh = Math.max(entry.expiresAt - safeSkewMs - now(), Math.max((expiresInSeconds - 60) * 1000, 30_000))
        timerRef.current = window.setTimeout(ensureUrl, jitter(msUntilRefresh))
      } catch {
        // keep previous URL (might still render), retry later
        timerRef.current = window.setTimeout(ensureUrl, jitter(60_000))
      }
    }

    ensureUrl()

    return () => {
      clearTimer()
    }
  }, [bucketId, path, expiresInSeconds])

  return url
}


