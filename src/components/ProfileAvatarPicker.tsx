import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AvatarMask } from '@/components/AvatarMask'
import { useSignedStorageUrl } from '@/lib/useSignedStorageUrl'

type ProfileAvatarPickerProps = {
  size?: number
  className?: string
  'aria-label'?: string
  onChange?: (storagePath: string) => void
  initialPath?: string | null
}

export function ProfileAvatarPicker({ size = 140, className, onChange, initialPath, ...rest }: ProfileAvatarPickerProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const signedAvatarUrl = useSignedStorageUrl('profile_picture', avatarPath, 3600)

  // Local cache for avatar path to enable instant render from signed URL cache
  const AVATAR_LS_PREFIX = 'profiles:avatar:'
  function avatarLsKey(uid: string) { return `${AVATAR_LS_PREFIX}${uid}` }
  function readStoredAvatar(uid: string): string | null {
    if (typeof localStorage === 'undefined') return null
    try {
      return localStorage.getItem(avatarLsKey(uid)) || null
    } catch { return null }
  }
  function writeStoredAvatar(uid: string, path: string) {
    if (typeof localStorage === 'undefined') return
    try { localStorage.setItem(avatarLsKey(uid), path) } catch {}
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) return
      const uid = data.user.id
      setUserId(uid)
      // Use provided initial path immediately, else use cached path
      const cached = readStoredAvatar(uid)
      const initial = initialPath ?? cached
      if (initial) setAvatarPath(initial)
      // If initial not provided, fetch from DB once
      if (!initial) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', uid)
          .maybeSingle()
        const dbPath = (prof as any)?.avatar_url ?? null
        if (dbPath) {
          setAvatarPath(dbPath)
          if (dbPath !== cached) writeStoredAvatar(uid, dbPath)
        }
      }
    })
  }, [initialPath])

  function onAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleImagePick(file: File) {
    try {
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

      // Show local preview immediately
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      if (!userId) return

      setUploading(true)
      const path = `${userId}/avatar_300.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('profile_picture')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadErr) throw uploadErr

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', userId)
      if (updateErr) throw updateErr

      setAvatarPath(path)
      // Persist for subsequent reloads
      writeStoredAvatar(userId, path)
      if (onChange) onChange(path)
    } catch (e) {
      // Swallow errors locally; callers can still show existing avatar
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <AvatarMask
        imageSrc={previewUrl ?? signedAvatarUrl}
        loading={!previewUrl && !signedAvatarUrl}
        size={size}
        className={className}
        onClick={uploading ? undefined : onAvatarClick}
        aria-label={rest['aria-label'] ?? 'Profile picture'}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImagePick(file)
        }}
      />
    </>
  )
}

export default ProfileAvatarPicker


