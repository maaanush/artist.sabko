// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-provision-token, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  const { email, name, phone } = (await req.json().catch(() => ({}))) as {
    email?: string; name?: string; phone?: string
  }
  const anonKey = Deno.env.get('ANON_KEY')
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY')
  const projectUrl = Deno.env.get('PROJECT_URL')
  if (!projectUrl) return new Response('Missing env', { status: 500, headers: corsHeaders })

  const client = createClient(projectUrl, serviceRole ?? anonKey)
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return new Response(JSON.stringify({ allowed: false, reason: 'missing_email' }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } })

  const { data: invite, error } = await client
    .from('invites')
    .select('*')
    .eq('status', 'pending')
    .eq('email', normalized)
    .maybeSingle()

  if (error) {
    return new Response(JSON.stringify({ allowed: false, reason: 'query_failed' }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } })
  }

  if (invite) {
    return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } })
  }

  // Record attempted signup
  await client.from('attempted_signups').insert({ email: normalized, name, phone })
  return new Response(JSON.stringify({ allowed: false, reason: 'no_invite' }), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } })
})


