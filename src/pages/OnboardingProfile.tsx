import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AvatarMask } from '@/components/AvatarMask'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function OnboardingProfile() {
  const [name, setName] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [pronoun, setPronoun] = useState<string>('')
  const [addressLine1, setAddressLine1] = useState<string>('')
  const [addressLine2, setAddressLine2] = useState<string>('')
  const [addressPincode, setAddressPincode] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Prefer server profile
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id
      if (userId) {
        const { data: prof } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
        if (prof?.name) {
          setName(prof.name)
          return
        }
      }
      const savedName = localStorage.getItem('signup_name') || ''
      setName(savedName)
    })
  }, [])

  async function handleImagePick(file: File) {
    // Read file, center-crop square, resize to 300x300 and output JPEG
    const bitmap = await createImageBitmap(file)
    const minSide = Math.min(bitmap.width, bitmap.height)
    const sx = Math.floor((bitmap.width - minSide) / 2)
    const sy = Math.floor((bitmap.height - minSide) / 2)

    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, 300, 300)

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))), 'image/jpeg', 0.92)
    })

    setAvatarBlob(blob)
    // Preview
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
  }

  function onAvatarClick() {
    fileInputRef.current?.click()
  }

  async function onSubmit() {
    setError(null)
    if (!location.trim()) {
      setError('Location is required')
      return
    }
    if (!avatarBlob) {
      setError('Profile picture is required')
      return
    }

    setSaving(true)
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const userId = userRes.user?.id
      if (!userId) throw new Error('Not authenticated')

      // Upload avatar
      const path = `${userId}/avatar_300.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('profile_picture')
        .upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadErr) throw uploadErr

      // Persist profile fields (storing storage path in avatar_url) and mark step2 done
      const { error: upsertErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          location,
          bio,
          pronoun,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          address_pincode: addressPincode || null,
          onboarding_step2_done: true,
        })
        .eq('id', userId)
      if (upsertErr) throw upsertErr

      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {name || 'new user'}</CardTitle>
            <CardDescription>Complete your profile details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex items-start gap-6">
                <AvatarMask imageSrc={previewUrl} aria-label="Profile picture" onClick={onAvatarClick} />
                <div className="flex-1 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">
                      Location <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pronoun">Pronoun (optional)</Label>
                    <Input
                      id="pronoun"
                      placeholder="e.g., she/her, he/him, they/them"
                      value={pronoun}
                      onChange={(e) => setPronoun(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="grid gap-4">
                <div>
                  <Label>Address (optional)</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line1">Address line 1</Label>
                  <Input
                    id="address_line1"
                    placeholder="Apartment, suite, building"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line2">Address line 2 (optional)</Label>
                  <Input
                    id="address_line2"
                    placeholder="Floor, landmark"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_pincode">Pincode</Label>
                  <Input
                    id="address_pincode"
                    placeholder="Pincode"
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex items-center justify-end">
                <Button onClick={onSubmit} disabled={saving || !location.trim() || !previewUrl}>
                  {saving ? 'Saving…' : 'Save and continue'}
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImagePick(file)
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


