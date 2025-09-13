import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function RootRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        if (!cancelled) navigate('/login', { replace: true })
        return
      }
      const role = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role
      const target = role === 'admin' ? '/admin' : '/dashboard'
      if (!cancelled) navigate(target, { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return null
}


