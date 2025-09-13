import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function OnboardingEmailSent() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('signup_email') || ''
    const savedName = localStorage.getItem('signup_name') || ''
    setEmail(savedEmail)
    setName(savedName)
  }, [])

  async function resend() {
    if (!email) return
    setLoading(true)
    setStatus('')
    try {
      // Resend verification email
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) setStatus(error.message)
      else setStatus('Verification email sent again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user && data.user.email_confirmed_at) {
        clearInterval(interval)
        navigate('/onboarding/2')
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p>Hi {name || 'there'}, we sent a verification link to {email || 'your email'}. Please check your inbox.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resend} disabled={loading}>Resend email</Button>
        </div>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </div>
  )
}


