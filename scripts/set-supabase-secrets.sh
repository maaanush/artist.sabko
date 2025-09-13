#!/usr/bin/env bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs -I{} echo {})
fi

: "${PROJECT_URL?Must set PROJECT_URL in .env}"
: "${ANON_KEY?Must set ANON_KEY in .env}"
: "${SERVICE_ROLE_KEY?Must set SERVICE_ROLE_KEY in .env}"

echo "Linking Supabase project (if not already linked) ..."
if ! supabase status >/dev/null 2>&1; then
  if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    SUPABASE_PROJECT_REF=$(echo "$PROJECT_URL" | awk -F[/:.] '{print $4}')
  fi
  supabase link --project-ref "$SUPABASE_PROJECT_REF"
fi

echo "Setting Edge Function secrets ..."
if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  SUPABASE_PROJECT_REF=$(echo "$PROJECT_URL" | awk -F[/:.] '{print $4}')
fi

# Use project-level secrets (available to all Edge Functions)
supabase secrets set --project-ref "$SUPABASE_PROJECT_REF" \
  PROJECT_URL="$PROJECT_URL" \
  ANON_KEY="$ANON_KEY" \
  SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  ${APP_ORIGIN:+APP_ORIGIN="$APP_ORIGIN"} \
  ${EMAILJS_SERVICE_ID:+EMAILJS_SERVICE_ID="$EMAILJS_SERVICE_ID"} \
  ${EMAILJS_TEMPLATE_ID:+EMAILJS_TEMPLATE_ID="$EMAILJS_TEMPLATE_ID"} \
  ${EMAILJS_PUBLIC_KEY:+EMAILJS_PUBLIC_KEY="$EMAILJS_PUBLIC_KEY"} \
  ${EMAILJS_SECRET:+EMAILJS_SECRET="$EMAILJS_SECRET"}

echo "Done. Redeploy functions as needed, e.g.:"
echo "  supabase functions deploy pre-signup"
echo "  supabase functions deploy consume-invite"
echo "  supabase functions deploy send-invite"


