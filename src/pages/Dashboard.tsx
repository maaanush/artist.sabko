import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ProfileAvatarPicker } from '@/components/ProfileAvatarPicker'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const navigate = useNavigate()
  const [name, setName] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login', { replace: true })
        return
      }
      // If user hasn't completed onboarding step 2, redirect
      supabase
        .from('profiles')
        .select('onboarding_step2_done, location, name')
        .eq('id', data.user.id)
        .maybeSingle()
        .then(({ data: prof }) => {
          if (prof) {
            if (prof.onboarding_step2_done === false) {
              navigate('/onboarding/2', { replace: true })
            }
            setName((prof as { name: string | null }).name ?? null)
            setLocation((prof as { location: string | null }).location ?? null)
          }
        })
    })
  }, [navigate])

  function handleEditProfile() {
    // Placeholder: will implement later
  }

  function handleUpload() {
    // Placeholder: will implement later
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: 24 }}>
      <div className="flex items-center gap-3">
        <ProfileAvatarPicker size={120} aria-label="Profile picture" />
        <div>
          <h1>Hi {name ?? ''}</h1>
          {location && <p className="text-sm text-muted-foreground">{location}</p>}
        </div>
      </div>
      <div className="mt-6 flex gap-3">

        <Button className="ml-2" variant="default" onClick={handleUpload} aria-label="Upload">
          Upload
        </Button>
        <Button variant="secondary" onClick={handleEditProfile} aria-label="Edit profile">
          Edit profile
        </Button>
        <Button className="ml-auto" variant="secondary" onClick={signOut} aria-label="Sign out">
          Sign out
        </Button>
      </div>
    </div>
  )
}


