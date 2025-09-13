// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-provision-token, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  const anonKey = Deno.env.get('ANON_KEY')
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY')
  const projectUrl = Deno.env.get('PROJECT_URL')
  if (!projectUrl) return new Response('Missing env', { status: 500, headers: corsHeaders })

  const { email } = (await req.json().catch(() => ({}))) as { email?: string }
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } })

  const client = createClient(projectUrl, serviceRole ?? anonKey)
  const { error } = await client
    .from('invites')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('email', normalized)
    .eq('status', 'pending')

  if (error) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } })
})


