const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azmajqztvcuwajaaldqm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWFqcXp0dmN1d2FqYWFsZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTU3OTcsImV4cCI6MjEwNTY3MTc5N30.XL2hMj0Lj1csX6nrhUlZ8SG8_Lo424vDikgPI-JK_X0';

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  console.log('Testing Supabase connection...\n');

  // Try to query jobs
  console.log('1. Querying jobs table...');
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .limit(1);

  if (jobsError) {
    console.log('Error:', jobsError);
  } else {
    console.log('Success! Found', jobs ? jobs.length : 0, 'job(s)');
    if (jobs && jobs.length > 0) {
      console.log('Job keys:', Object.keys(jobs[0]));
    }
  }

  // Try to query job_events
  console.log('\n2. Querying job_events table...');
  const { data: events, error: eventsError } = await supabase
    .from('job_events')
    .select('*')
    .limit(1);

  if (eventsError) {
    console.log('Error:', eventsError);
  } else {
    console.log('Success! Found', events ? events.length : 0, 'event(s)');
  }

  // Try to query notification_logs
  console.log('\n3. Querying notification_logs table...');
  const { data: notif, error: notifError } = await supabase
    .from('notification_logs')
    .select('*')
    .limit(1);

  if (notifError) {
    console.log('Error:', notifError);
  } else {
    console.log('Success! Found', notif ? notif.length : 0, 'notification(s)');
  }

  // Check if RPC exists
  console.log('\n4. Testing RPC function (transition_job_state)...');
  const { data: rpcResult, error: rpcError } = await supabase.rpc('transition_job_state', {
    p_job_id: 'a0000001-0000-0000-0000-000000000001',
    p_new_state: 'accepted',
    p_actor_user_id: 'a0000001-0000-0000-0000-000000000000',
  });

  if (rpcError) {
    console.log('Error:', rpcError.message || rpcError);
  } else {
    console.log('Success! Result:', rpcResult);
  }
}

test().catch(console.error);
