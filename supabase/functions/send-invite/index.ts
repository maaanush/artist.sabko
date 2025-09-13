// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-provision-token, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getFunctionsBaseUrl(projectUrl: string): string {
  const u = new URL(projectUrl)
  const [projectRef] = u.host.split('.')
  return `https://${projectRef}.functions.supabase.co`
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

    const anonKey = Deno.env.get('ANON_KEY')
    const projectUrl = Deno.env.get('PROJECT_URL')
    // EmailJS
    const emailjsSecret = Deno.env.get('EMAILJS_SECRET')
    const emailjsServiceId = Deno.env.get('EMAILJS_SERVICE_ID')
    const emailjsTemplateId = Deno.env.get('EMAILJS_TEMPLATE_ID')
    const emailjsPublicKey = Deno.env.get('EMAILJS_PUBLIC_KEY')
    const appOrigin = Deno.env.get('APP_ORIGIN') ?? projectUrl

    if (!anonKey || !projectUrl) {
      return new Response('Missing function secrets', { status: 500, headers: corsHeaders })
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const body = (await req.json().catch(() => ({}))) as { email?: string }
    const email = (body.email || '').trim().toLowerCase()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    const userClient = createClient(projectUrl, anonKey, {
      global: { headers: { Authorization: authHeader, apikey: anonKey } },
    })

    // Insert invite under RLS (only admin can insert)
    const { error: insertErr } = await userClient
      .from('invites')
      .upsert({ email, status: 'pending', used_at: null, created_at: new Date().toISOString() }, {
        onConflict: 'email',
      })

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 403,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    // Compose common params
    const signupUrl = new URL('/signup', appOrigin).toString()

    if (emailjsSecret && emailjsServiceId && emailjsTemplateId) {
      // Send via EmailJS server API using private key
      const ej = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          accessToken: emailjsSecret,
          template_params: {
            to_email: email,
            magic_link: signupUrl,
          },
        }),
      })
      if (!ej.ok) {
        const txt = await ej.text()
        return new Response(JSON.stringify({ error: 'EmailJS failed', detail: txt }), {
          status: 502,
          headers: { ...corsHeaders, 'content-type': 'application/json' },
        })
      }
    } else {
      return new Response(JSON.stringify({ error: 'No email provider configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
})


