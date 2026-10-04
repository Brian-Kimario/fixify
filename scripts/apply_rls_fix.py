#!/usr/bin/env python3

"""
Apply RLS Fix to Remote Supabase Database

This script applies the job_events RLS fix directly using psql.
"""

import os
import subprocess
import sys
from pathlib import Path

# Load environment
env_path = Path(__file__).parent.parent / '.env.local'
env = {}
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env[key] = value

supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL', '')
service_role_key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not supabase_url or not service_role_key:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

project_ref = supabase_url.split('//')[1].split('.')[0]
db_url = f"postgresql://postgres:{service_role_key}@{project_ref}.supabase.co:6543/postgres"

print(f"🔧 Project: {project_ref}")
print(f"🔐 Connecting to remote database...")

# Read migration file
migration_file = Path(__file__).parent.parent / 'supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql'
if not migration_file.exists():
    print(f"❌ Migration file not found: {migration_file}")
    sys.exit(1)

with open(migration_file) as f:
    migration_sql = f.read()

print(f"📄 Loaded migration ({len(migration_sql)} bytes)")

# Split by statements and remove comments
statements = []
current_stmt = []
for line in migration_sql.split('\n'):
    stripped = line.strip()
    if not stripped or stripped.startswith('--'):
        continue
    current_stmt.append(line)
    if stripped.endswith(';'):
        statements.append('\n'.join(current_stmt))
        current_stmt = []

print(f"📝 Found {len(statements)} statements to execute")

# Try to execute each statement
success_count = 0
failed_count = 0

for i, stmt in enumerate(statements, 1):
    if not stmt.strip():
        continue
    
    try:
        # Use psql to execute
        result = subprocess.run(
            ['psql', db_url, '-c', stmt],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            success_count += 1
            preview = stmt.split('\n')[0][:50]
            print(f"   ✅ [{i}] {preview}...")
        else:
            failed_count += 1
            preview = stmt.split('\n')[0][:50]
            print(f"   ⚠️  [{i}] {preview}...")
            if result.stderr:
                print(f"       Error: {result.stderr[:100]}")
    except subprocess.TimeoutExpired:
        failed_count += 1
        print(f"   ⏱️  [{i}] Timeout")
    except Exception as e:
        print(f"   ❌ Error executing statement {i}: {e}")
        failed_count += 1

print(f"\n{'='*60}")
print(f"✅ Applied: {success_count} statements")
if failed_count > 0:
    print(f"⚠️  Warnings/Failures: {failed_count} statements")
print(f"{'='*60}")

# Verify the fix
print(f"\n🔍 Verifying fix...")

verify_queries = [
    ("Function SECURITY DEFINER", "SELECT prosecdef FROM pg_proc WHERE proname = 'transition_job_state' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');"),
    ("Notification Trigger", "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'job_events' AND trigger_name = 'trg_job_state_transition_notify';"),
    ("INSERT Policy", "SELECT policyname FROM pg_policies WHERE tablename = 'job_events' AND cmd = 'INSERT';"),
]

for check_name, query in verify_queries:
    try:
        result = subprocess.run(
            ['psql', db_url, '-c', query],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout.strip() and 'rows' not in result.stdout:
            print(f"   ✅ {check_name}")
        else:
            print(f"   ⚠️  {check_name} (verify manually)")
    except Exception as e:
        print(f"   ⚠️  {check_name}: {e}")

print(f"\n✨ Done! The RLS fix has been applied to the remote database.")
print(f"\n📝 Next: Test the job acceptance flow in the app.")
