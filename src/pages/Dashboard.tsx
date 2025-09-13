import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ProfileAvatarPicker } from '@/components/ProfileAvatarPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Dashboard() {
  const navigate = useNavigate()
  const [name, setName] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState<boolean>(false)

  // Edit form state
  const [editName, setEditName] = useState<string>('')
  const [editPhone, setEditPhone] = useState<string>('')
  const [editLocation, setEditLocation] = useState<string>('')
  const [editPronoun, setEditPronoun] = useState<string>('')
  const [editBio, setEditBio] = useState<string>('')
  const [addressLine1, setAddressLine1] = useState<string>('')
  const [addressLine2, setAddressLine2] = useState<string>('')
  const [addressPincode, setAddressPincode] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleEditProfile() {
    setError(null)
    // Load current profile into form and open dialog
    const { data: userRes } = await supabase.auth.getUser()
    const userId = userRes.user?.id
    if (!userId) return
    const { data: prof, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (fetchErr) {
      console.error('EditProfile fetch error', fetchErr)
    }
    console.log('EditProfile fetched profile', prof)
    const p = (prof as any) || {}
    setEditName(p.name ?? '')
    setEditPhone(p.phone ?? '')
    setEditLocation(p.location ?? '')
    setEditPronoun(p.pronoun ?? '')
    setEditBio(p.bio ?? '')
    setAddressLine1(p.address_line1 ?? '')
    setAddressLine2(p.address_line2 ?? '')
    setAddressPincode(p.address_pincode ?? '')
    setShowEdit(true)
  }

  async function handleSaveProfile() {
    setSaving(true)
    setError(null)
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const userId = userRes.user?.id
      if (!userId) throw new Error('Not authenticated')

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name: editName || null,
          phone: editPhone || null,
          location: editLocation || null,
          pronoun: editPronoun || null,
          bio: editBio || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          address_pincode: addressPincode || null,
        })
        .eq('id', userId)
      if (updateErr) throw updateErr

      // Reflect updated values on the dashboard
      setName(editName || null)
      setLocation(editLocation || null)
      setShowEdit(false)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseDialog() {
    if (saving) return
    setShowEdit(false)
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

      {showEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative z-10 w-full flex justify-center px-2">
            <Card className="w-[98%] max-w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
              {/* Dialog header */}
              <CardHeader>
                <CardTitle>Edit profile</CardTitle>
              </CardHeader>
              {/* Dialog body (scrollable) */}
              <CardContent className="flex-1 overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_name">Name</Label>
                    <Input id="edit_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input id="edit_phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_location">Location</Label>
                    <Input id="edit_location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_pronoun">Pronoun</Label>
                    <Input id="edit_pronoun" value={editPronoun} onChange={(e) => setEditPronoun(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_bio">Bio</Label>
                    <textarea
                      id="edit_bio"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="addr1">Address line 1</Label>
                    <Input id="addr1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addr2">Address line 2 (optional)</Label>
                    <Input id="addr2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" value={addressPincode} onChange={(e) => setAddressPincode(e.target.value)} />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              </CardContent>
              {/* Dialog footer */}
              <CardFooter className="justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseDialog} disabled={saving} aria-label="Cancel">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving} aria-label="Save profile">
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}


