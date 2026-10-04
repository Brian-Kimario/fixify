#!/bin/bash

# Apply RLS Fix via curl to Supabase REST API
# This attempts to use the Supabase SQL interface if available

set -e

PROJECT_URL="https://azmajqztvcuwajaaldqm.supabase.co"
PROJECT_REF="azmajqztvcuwajaaldqm"

# Extract keys from .env.local
export SERVICE_ROLE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)
export ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "🔧 Supabase Project: $PROJECT_REF"
echo "📍 URL: $PROJECT_URL"

# Read migration file
MIGRATION_FILE="supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

MIGRATION_SQL=$(cat "$MIGRATION_FILE")
echo "📄 Loaded migration file"

# Try Method 1: Direct SQL endpoint (if available in newer Supabase)
echo ""
echo "🔄 Attempting to apply migration via REST API..."

# Try /rest/v1/rpc/exec_sql or similar
curl -X POST \
  "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$MIGRATION_SQL" | jq -Rs .)}" \
  2>/dev/null && echo "✅ Applied via REST API" || echo "ℹ️  REST API method not available"

echo ""
echo "✨ If the REST API method didn't work:"
echo "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo "   2. Create a new query"
echo "   3. Paste the SQL from: $MIGRATION_FILE"
echo "   4. Click 'Run'"
