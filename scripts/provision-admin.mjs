import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRole = process.env.SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!url || !serviceRole || !adminEmail || !adminPassword) {
  console.error('Missing env: SUPABASE_URL, SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createClient(url, serviceRole)

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: 'Admin', role: 'admin' },
  })

  if (error && !String(error.message).toLowerCase().includes('already')) {
    console.error('Create user error:', error)
    process.exit(1)
  }

  const userId = data?.user?.id

  const targetId = userId ?? (await (async () => {
    // Try to find existing user by email and update
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) {
      console.error('List users error:', listErr)
      process.exit(1)
    }
    const existing = users.users.find((u) => u.email === adminEmail)
    return existing?.id
  })())

  if (targetId) {
    const { error: updErr } = await supabase.auth.admin.updateUserById(targetId, {
      app_metadata: { role: 'admin' },
    })
    if (updErr) {
      console.warn('Update metadata warning:', updErr)
    }
  }

  console.log('ok', { userId: targetId })
  process.exit(0)
} catch (e) {
  console.error('Unexpected error:', e)
  process.exit(1)
}


