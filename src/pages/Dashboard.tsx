import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCachedProfileSummary } from '@/lib/useCachedProfile'
import { fetchProductsCached } from '@/lib/productsCache'
import { ProfileAvatarPicker } from '@/components/ProfileAvatarPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignedStorageUrl } from '@/lib/useSignedStorageUrl'

export default function Dashboard() {
  const navigate = useNavigate()
  const [name, setName] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'artworks' | 'sales' | 'payments'>('artworks')

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
  const [editLoading, setEditLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [uploadTitle, setUploadTitle] = useState<string>('')
  const [uploadDescription, setUploadDescription] = useState<string>('')
  const [uploadSaving, setUploadSaving] = useState<boolean>(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadProductsLoading, setUploadProductsLoading] = useState<boolean>(false)
  const [uploadProducts, setUploadProducts] = useState<Array<{
    id: string
    name: string
    base_price: number
    enabled: boolean
    margin: string
  }>>([])

  // Artworks grid state
  type Artwork = {
    id: string
    title: string
    description: string | null
    original_file_name: string
    image_path: string | null
    created_at: string
  }
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState<boolean>(false)
  const [artworksError, setArtworksError] = useState<string | null>(null)

  // Edit existing artwork state
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null)
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null)
  const swapFileInputRef = useRef<HTMLInputElement | null>(null)

  const { profile, mutate } = useCachedProfileSummary()

  useEffect(() => {
    // Apply profile to header as soon as hook has it
    setName(profile?.name ?? null)
    setLocation(profile?.location ?? null)
    if (profile && profile.onboarding_step2_done === false) {
      navigate('/onboarding/2', { replace: true })
    }
  }, [profile, navigate])

  useEffect(() => {
    void loadArtworks()
  }, [])

  async function loadArtworks() {
    setLoadingArtworks(true)
    setArtworksError(null)
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const userId = userRes.user?.id
      if (!userId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, description, original_file_name, image_path, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setArtworks((data as any) || [])
    } catch (e: any) {
      setArtworksError(e.message ?? 'Failed to load artworks')
    } finally {
      setLoadingArtworks(false)
    }
  }

  async function handleEditProfile() {
    setError(null)
    // Open instantly with cached header values; hydrate rest in background
    setEditName(name ?? '')
    setEditLocation(location ?? '')
    setEditPhone('')
    setEditPronoun('')
    setEditBio('')
    setAddressLine1('')
    setAddressLine2('')
    setAddressPincode('')
    setShowEdit(true)
    setEditLoading(true)

    const { data: userRes } = await supabase.auth.getUser()
    const userId = userRes.user?.id
    if (!userId) {
      setEditLoading(false)
      return
    }
    const { data: prof } = await supabase
      .from('profiles')
      .select('name, phone, location, pronoun, bio, address_line1, address_line2, address_pincode')
      .eq('id', userId)
      .maybeSingle()
    const p = (prof as any) || {}
    setEditName(p.name ?? (name ?? ''))
    setEditPhone(p.phone ?? '')
    setEditLocation(p.location ?? (location ?? ''))
    setEditPronoun(p.pronoun ?? '')
    setEditBio(p.bio ?? '')
    setAddressLine1(p.address_line1 ?? '')
    setAddressLine2(p.address_line2 ?? '')
    setAddressPincode(p.address_pincode ?? '')
    setEditLoading(false)
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

      // Reflect updated values on the dashboard and cache
      setName(editName || null)
      setLocation(editLocation || null)
      mutate({ name: editName || null, location: editLocation || null })
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
    fileInputRef.current?.click()
  }

  function handleCloseUploadModal() {
    if (uploadSaving) return
    setShowUploadModal(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (f) {
      void prepareUploadForFile(f)
    }
    e.target.value = ''
  }

  async function prepareUploadForFile(file: File) {
    setUploadMsg(null)
    // entering create mode
    setEditingArtworkId(null)
    setCurrentImagePath(null)
    setSelectedFile(file)
    setSelectedFileName(file.name)
    const defaultTitle = file.name.replace(/\.[^.]+$/, '')
    setUploadTitle(defaultTitle)
    setUploadDescription('')
    try { if (previewUrl) URL.revokeObjectURL(previewUrl) } catch {}
    setPreviewUrl(URL.createObjectURL(file))
    // Fetch products (cached)
    setShowUploadModal(true)
    setUploadProductsLoading(true)
    try {
      const products = await fetchProductsCached()
      const mapped = products.map((p) => ({
        id: p.id,
        name: p.name,
        base_price: p.base_price,
        enabled: true,
        margin: '',
      }))
      setUploadProducts(mapped)
    } catch {
      setUploadMsg('Failed to load products')
      setUploadProducts([])
    } finally {
      setUploadProductsLoading(false)
    }
  }

  function handleSwapArtwork() {
    if (!editingArtworkId) return
    swapFileInputRef.current?.click()
  }

  function handleSwapFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (f) {
      try { if (previewUrl) URL.revokeObjectURL(previewUrl) } catch {}
      setSelectedFile(f)
      setSelectedFileName(f.name)
      setPreviewUrl(URL.createObjectURL(f))
    }
    e.target.value = ''
  }

  function toggleProductEnabled(productId: string) {
    setUploadProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, enabled: !p.enabled } : p)))
  }

  function updateProductMargin(productId: string, value: string) {
    setUploadProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, margin: value } : p)))
  }

  async function handleSaveArtwork() {
    setUploadSaving(true)
    setUploadMsg(null)
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const userId = userRes.user?.id
      if (!userId) throw new Error('Not authenticated')

      if (editingArtworkId) {
        // UPDATE existing
        const oldPath = currentImagePath
        let newPath = oldPath
        if (selectedFile) {
          const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${userId}/${Date.now()}_${safeName}`
          const { error: uploadErr } = await supabase.storage.from('artworks').upload(path, selectedFile, {
            upsert: false,
            contentType: selectedFile.type || 'application/octet-stream',
          })
          if (uploadErr) throw uploadErr
          newPath = path
        }

        const { error: updErr } = await supabase
          .from('artworks')
          .update({
            title: uploadTitle.trim() || (selectedFileName || 'Untitled'),
            description: uploadDescription.trim() || null,
            original_file_name: selectedFileName || 'file',
            image_path: newPath,
          })
          .eq('id', editingArtworkId)
        if (updErr) throw updErr

        // Replace artwork_products for this artwork
        await supabase.from('artwork_products').delete().eq('artwork_id', editingArtworkId)
        const rows = uploadProducts.map((p) => ({
          artwork_id: editingArtworkId,
          product_id: p.id,
          enabled: p.enabled,
          margin: isNaN(parseFloat(p.margin || '0')) ? 0 : parseFloat(p.margin || '0'),
        }))
        if (rows.length > 0) {
          const { error: apErr } = await supabase.from('artwork_products').insert(rows)
          if (apErr) throw apErr
        }

        // If new image uploaded, remove old one
        if (selectedFile && oldPath && oldPath !== newPath) {
          await supabase.storage.from('artworks').remove([oldPath])
        }
      } else {
        // CREATE new
        // Upload to storage
        let storagePath: string | null = null
        if (selectedFile) {
          const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${userId}/${Date.now()}_${safeName}`
          const { error: uploadErr } = await supabase.storage.from('artworks').upload(path, selectedFile, {
            upsert: false,
            contentType: selectedFile.type || 'application/octet-stream',
          })
          if (uploadErr) throw uploadErr
          storagePath = path
        }

        // Create artwork row
        const { data: artworkInsert, error: artworkErr } = await supabase
          .from('artworks')
          .insert({
            user_id: userId,
            title: uploadTitle.trim() || (selectedFileName || 'Untitled'),
            description: uploadDescription.trim() || null,
            original_file_name: selectedFileName || 'file',
            image_path: storagePath,
          })
          .select('id')
          .single()
        if (artworkErr) throw artworkErr
        const artworkId = (artworkInsert as any).id as string

        // Insert per-product rows
        const rows = uploadProducts.map((p) => ({
          artwork_id: artworkId,
          product_id: p.id,
          enabled: p.enabled,
          margin: isNaN(parseFloat(p.margin || '0')) ? 0 : parseFloat(p.margin || '0'),
        }))
        if (rows.length > 0) {
          const { error: apErr } = await supabase.from('artwork_products').insert(rows)
          if (apErr) throw apErr
        }
      }

      // Close and reset
      setShowUploadModal(false)
      setUploadProducts([])
      setUploadTitle('')
      setUploadDescription('')
      setSelectedFile(null)
      try { if (previewUrl) URL.revokeObjectURL(previewUrl) } catch {}
      setPreviewUrl(null)
      setEditingArtworkId(null)
      setCurrentImagePath(null)

      // Refresh grid
      await loadArtworks()
    } catch (e: any) {
      setUploadMsg(e.message ?? 'Failed to save')
    } finally {
      setUploadSaving(false)
    }
  }

  async function handleDeleteArtwork() {
    if (!editingArtworkId) return
    setUploadSaving(true)
    setUploadMsg(null)
    try {
      const oldPath = currentImagePath
      const { error: delErr } = await supabase.from('artworks').delete().eq('id', editingArtworkId)
      if (delErr) throw delErr
      if (oldPath) {
        await supabase.storage.from('artworks').remove([oldPath])
      }
      setShowUploadModal(false)
      setEditingArtworkId(null)
      setCurrentImagePath(null)
      await loadArtworks()
    } catch (e: any) {
      setUploadMsg(e.message ?? 'Failed to delete')
    } finally {
      setUploadSaving(false)
    }
  }

  async function openEditArtwork(art: Artwork) {
    // Prefill fields and products, show modal in edit mode
    setUploadMsg(null)
    setEditingArtworkId(art.id)
    setCurrentImagePath(art.image_path ?? null)
    setSelectedFile(null)
    setSelectedFileName(art.original_file_name)
    setPreviewUrl(null) // use signed URL path instead
    setUploadTitle(art.title || '')
    setUploadDescription(art.description || '')

    setShowUploadModal(true)
    setUploadProductsLoading(true)
    try {
      const products = await fetchProductsCached()
      const { data: rows } = await supabase
        .from('artwork_products')
        .select('product_id, enabled, margin')
        .eq('artwork_id', art.id)

      const byId = new Map<string, { enabled: boolean; margin: string }>()
      ;(rows as any[] | null)?.forEach((r) => byId.set(r.product_id, { enabled: !!r.enabled, margin: String(r.margin ?? '') }))

      const mapped = products.map((p) => {
        const existing = byId.get(p.id)
        return {
          id: p.id,
          name: p.name,
          base_price: p.base_price,
          enabled: existing ? existing.enabled : false,
          margin: existing ? existing.margin : '',
        }
      })
      setUploadProducts(mapped)
    } catch {
      setUploadMsg('Failed to load products')
      setUploadProducts([])
    } finally {
      setUploadProductsLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const editImageUrl = useSignedStorageUrl('artworks', currentImagePath ?? null)

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: 12 }}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={swapFileInputRef}
        type="file"
        onChange={handleSwapFileChange}
        className="hidden"
      />
      <div className="-mx-3">
        <div className="flex items-center gap-3 px-3">
        <ProfileAvatarPicker size={120} aria-label="Profile picture" initialPath={profile?.avatar_url ?? null} />
        <div>
          <h1 className="text-xl font-semibold"> {name ?? ''}</h1>
          {location && <p className="text-sm text-muted-foreground">{location}</p>}
        </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3">

        <Button className="ml-1" variant="default" onClick={handleUpload} aria-label="Upload">
          Upload Artwork
        </Button>
        <Button variant="secondary" onClick={handleEditProfile} aria-label="Edit profile">
          Edit profile
        </Button>
        <Button className="ml-auto" variant="secondary" onClick={signOut} aria-label="Sign out">
          Sign out
        </Button>
      </div>

      <div className="mt-6 border-b sticky top-0 z-20 bg-white">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          <button
            className={activeTab === 'artworks' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('artworks')}
            type="button"
          >
            Artworks
          </button>
          <button
            className={activeTab === 'sales' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('sales')}
            type="button"
          >
            Sales
          </button>
          <button
            className={activeTab === 'payments' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('payments')}
            type="button"
          >
            Payments
          </button>
        </nav>
      </div>

      {activeTab === 'sales' && (
        <Card className="mt-6">
          <CardContent className="p-4 shadow-none border-none rounded-none">
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'artworks' && (
        <Card className="mt-6">
          <CardContent className="p-0">
            {loadingArtworks ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : artworksError ? (
              <div className="p-4 text-sm text-destructive">{artworksError}</div>
            ) : artworks.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No artworks yet. Upload to get started.</div>
            ) : (
              <div className="grid grid-cols-2 gap-[1px] bg-zinc-200">
                {artworks.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="relative group aspect-square overflow-hidden bg-zinc-100"
                    onClick={() => openEditArtwork(a)}
                    aria-label={`Edit ${a.title}`}
                  >
                    <ArtworkThumb path={a.image_path} title={a.title} />
                    <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card className="mt-6">
          <CardContent className="p-4 shadow-none border-none rounded-none">
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      )}

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
                  {editLoading ? (
                    <div className="grid gap-4">
                      {[1,2,3,4,5,6,7].map((i) => (
                        <div key={i} className="grid gap-2">
                          <div className="h-4 w-32 rounded bg-zinc-100 animate-pulse" />
                          <div className={i === 5 ? 'h-28 w-full rounded bg-zinc-100 animate-pulse' : 'h-9 w-full rounded bg-zinc-100 animate-pulse'} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
              {/* Dialog footer */}
              <CardFooter className="justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseDialog} disabled={saving} aria-label="Cancel">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving || editLoading} aria-label="Save profile">
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseUploadModal} />
          <div className="relative z-10 w-full flex justify-center px-2">
            <Card className="w-[98%] max-w-[560px] max-h-[82vh] flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>{editingArtworkId ? 'Edit artwork' : 'Setup artwork'}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="grid gap-4">
                  {/* Preview on top (no label) */}
                  <div>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-48 w-auto rounded-md border" />
                    ) : editingArtworkId && editImageUrl ? (
                      <img src={editImageUrl} alt="Preview" className="max-h-48 w-auto rounded-md border" />
                    ) : (
                      <div className="h-40 w-full rounded-md border bg-zinc-100 animate-pulse" />
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="upload_title">Artwork title</Label>
                    <Input id="upload_title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="upload_desc">Description / Notes</Label>
                    <textarea
                      id="upload_desc"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>

                  <div className="text-sm mt-4">Use this artwork for:</div>

                  <div className="grid gap-4">
                    {uploadProductsLoading ? (
                      <div className="grid gap-4">
                        {[1,2,3].map((i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-40 rounded bg-zinc-100 animate-pulse" />
                              <div className="h-6 w-10 rounded-full bg-zinc-200 animate-pulse" />
                            </div>
                            <div className="mt-2 h-7 w-full max-w-[320px] rounded bg-zinc-100 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : uploadProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products available yet.</p>
                    ) : (
                      <div>
                        {uploadProducts.map((p) => {
                          const marginNum = isNaN(parseFloat(p.margin)) ? 0 : parseFloat(p.margin)
                          const finalPrice = Math.max(0, p.base_price + marginNum)
                          return (
                            <div key={p.id}>
                              {/* Row 1: name + toggle */}
                              <div className="flex items-center justify-between">
                                <div className="font-semibold tracking-[-0.4px]">{p.name}</div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={p.enabled}
                                  aria-label={`Enable ${p.name}`}
                                  onClick={() => toggleProductEnabled(p.id)}
                                  className={p.enabled ? 'inline-flex h-6 w-10 items-center rounded-full bg-black transition-colors' : 'inline-flex h-6 w-10 items-center rounded-full bg-zinc-300 transition-colors'}
                                >
                                  <span className={p.enabled ? 'h-[20px] w-[20px] translate-x-[18px] transform rounded-full bg-white shadow transition-transform' : 'h-[20px] w-[20px] translate-x-[2px] transform rounded-full bg-white shadow transition-transform'} />
                                </button>
                              </div>
                              {/* Row 2 (only when enabled): base price + margin input + final price */}
                              {p.enabled && (
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-[3px]">
                                    <div className="text-sm opacity-70">Base Price ₹{p.base_price.toFixed(0)}</div>
                                    <div className="text-sm font-semibold">+</div>
                                    <Input
                                      id={`margin_${p.id}`}
                                      placeholder="Your Margin"
                                      type="text"
                                      inputMode="numeric"
                                      pattern="\\d{0,3}"
                                      maxLength={3}
                                      value={p.margin}
                                      onChange={(e) => {
                                        const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                                        updateProductMargin(p.id, next)
                                      }}
                                      className="h-[34px] w-[125px] rounded-[8px] placeholder:text-zinc-400"
                                    />
                                  </div>
                                  <div className="text-sm opacity-70">₹{finalPrice.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {uploadMsg && <p className="text-sm text-destructive">{uploadMsg}</p>}
                </div>
              </CardContent>
              <CardFooter className={editingArtworkId ? 'justify-between gap-2' : 'justify-end gap-2'}>
                {editingArtworkId && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleSwapArtwork} disabled={uploadSaving} aria-label="Swap artwork">
                      Swap artwork
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteArtwork} disabled={uploadSaving} aria-label="Delete artwork">
                      Delete artwork
                    </Button>
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <Button variant="secondary" onClick={handleCloseUploadModal} disabled={uploadSaving} aria-label="Cancel">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveArtwork} disabled={uploadSaving || uploadTitle.trim().length === 0} aria-label={editingArtworkId ? 'Update artwork' : 'Save artwork'}>
                    {uploadSaving ? 'Saving…' : editingArtworkId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function ArtworkThumb({ path, title }: { path: string | null; title: string }) {
  const url = useSignedStorageUrl('artworks', path ?? null)
  return url ? (
    <img src={url} alt={title} className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full bg-zinc-100" />
  )
}


