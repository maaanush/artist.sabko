// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const token = req.headers.get('x-provision-token')
  const expected = Deno.env.get('PROVISION_TOKEN')
  if (!expected || token !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('PROJECT_URL')
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY')
  const adminEmail = Deno.env.get('ADMIN_EMAIL')
  const adminPassword = Deno.env.get('ADMIN_PASSWORD')

  if (!supabaseUrl || !serviceRole || !adminEmail || !adminPassword) {
    return new Response('Missing env', { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceRole)

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: 'Admin', role: 'admin' },
    })

    let userId = data?.user?.id ?? null

    if (error) {
      // If user already exists, ignore
      if (!error.message.toLowerCase().includes('already')) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }
    }

    if (userId) {
      // Try to set app_metadata.role = 'admin'
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { role: 'admin' } as any,
      })
      if (updErr) {
        // Non-fatal; proceed
      }
    }

    return new Response(JSON.stringify({ ok: true, userId }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
})


