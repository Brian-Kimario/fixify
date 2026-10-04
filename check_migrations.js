const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azmajqztvcuwajaaldqm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWFqcXp0dmN1d2FqYWFsZHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA5NTc5NywiZXhwIjoyMTA1NjcxNzk3fQ.m2Cpzmwvn1Bfzcp9-gmpxsrn6PWkt3jgC5DoMuHKlPs';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  console.log('Checking applied migrations...\n');

  // Check for key tables
  const tablesToCheck = [
    'profiles',
    'properties',
    'jobs',
    'job_events',
    'notification_logs',
    'professional_profiles',
  ];

  console.log('Table Status:');
  console.log('-'.repeat(70));

  for (const table of tablesToCheck) {
    try {
      const { data, error, count, status } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        const errorStr = error.message || JSON.stringify(error);
        if (errorStr.includes('Could not find') || errorStr.includes('PGRST116')) {
          console.log(`✗ ${table.padEnd(35)} NOT FOUND`);
        } else {
          console.log(`? ${table.padEnd(35)} ${errorStr.slice(0, 30)}`);
        }
      } else {
        console.log(`✓ ${table.padEnd(35)} ${count} rows`);
      }
    } catch (e) {
      console.log(`✗ ${table.padEnd(35)} Exception: ${e.message.slice(0, 25)}`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

check().catch(console.error);
