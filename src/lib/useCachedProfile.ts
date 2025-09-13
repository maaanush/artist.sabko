import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import { readJsonCache, writeJsonCache } from './utils'

export type ProfileSummary = {
  id: string
  name: string | null
  location: string | null
  avatar_url: string | null
  onboarding_step2_done: boolean | null
}

const LS_KEY = 'profiles:summary:self'
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

type HookState = {
  profile: ProfileSummary | null
  loading: boolean
  error: string | null
}

export function useCachedProfileSummary(ttlMs: number = DEFAULT_TTL_MS) {
  const [state, setState] = useState<HookState>({ profile: null, loading: true, error: null })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    async function init() {
      const cached = readJsonCache<ProfileSummary>(LS_KEY)
      if (cached) {
        setState({ profile: cached, loading: false, error: null })
      }

      const { data: userRes } = await supabase.auth.getUser()
      const userId = userRes.user?.id
      if (!userId) {
        if (mountedRef.current) setState({ profile: null, loading: false, error: null })
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, location, avatar_url, onboarding_step2_done')
        .eq('id', userId)
        .maybeSingle()

      if (!mountedRef.current) return

      if (error) {
        setState((prev) => ({ profile: prev.profile, loading: false, error: error.message }))
        return
      }

      const profile: ProfileSummary = {
        id: (data as any)?.id || userId,
        name: (data as any)?.name ?? null,
        location: (data as any)?.location ?? null,
        avatar_url: (data as any)?.avatar_url ?? null,
        onboarding_step2_done: (data as any)?.onboarding_step2_done ?? null,
      }
      writeJsonCache(LS_KEY, profile, ttlMs)
      setState({ profile, loading: false, error: null })
    }

    init()
    return () => { mountedRef.current = false }
  }, [ttlMs])

  async function refresh() {
    const { data: userRes } = await supabase.auth.getUser()
    const userId = userRes.user?.id
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, location, avatar_url, onboarding_step2_done')
      .eq('id', userId)
      .maybeSingle()
    if (error) return
    const profile: ProfileSummary = {
      id: (data as any)?.id || userId,
      name: (data as any)?.name ?? null,
      location: (data as any)?.location ?? null,
      avatar_url: (data as any)?.avatar_url ?? null,
      onboarding_step2_done: (data as any)?.onboarding_step2_done ?? null,
    }
    writeJsonCache(LS_KEY, profile, ttlMs)
    setState({ profile, loading: false, error: null })
  }

  function mutate(next: Partial<ProfileSummary>) {
    setState((prev) => {
      const merged: ProfileSummary | null = prev.profile ? { ...prev.profile, ...next } as ProfileSummary : null
      if (merged) writeJsonCache(LS_KEY, merged, ttlMs)
      return { ...prev, profile: merged }
    })
  }

  return { ...state, refresh, mutate }
}


