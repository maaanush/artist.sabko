import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function Admin() {
  const navigate = useNavigate()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'products'>('users')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) {
        navigate('/login', { replace: true })
        return
      }
      const role = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role
      if (role !== 'admin') {
        navigate('/dashboard', { replace: true })
        return
      }
      setAuthorized(true)
    })
  }, [navigate])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setInviteMsg('Not authenticated')
      return
    }
    try {
      const resp = await fetch('https://iadikxulenwatjizhthr.functions.supabase.co/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!resp.ok) {
        let msg = 'Failed'
        try {
          const txt = await resp.text()
          msg = txt || msg
        } catch {}
        setInviteMsg(msg)
      } else {
        setInviteMsg('Invite sent')
        setInviteEmail('')
      }
    } catch (err) {
      setInviteMsg('Network error')
    }
  }

  if (!authorized) {
    return null
  }

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: 24 }}>
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="mt-6 border-b">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          <button
            className={activeTab === 'users' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('users')}
            type="button"
          >
            Users
          </button>
          <button
            className={activeTab === 'products' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('products')}
            type="button"
          >
            Products
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invite a user</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <Button type="submit">Send invite</Button>
              {inviteMsg && <p className="text-sm text-muted-foreground">{inviteMsg}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'products' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Products admin coming soon.</p>
          </CardContent>
        </Card>
      )}

      <button className="mt-6" onClick={signOut}>Sign out</button>
    </div>
  )
}


