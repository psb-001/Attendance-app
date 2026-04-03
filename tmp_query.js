const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bccfzucwiyxtwohtqjsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY2Z6dWN3aXl4dHdvaHRxanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDc0OTYsImV4cCI6MjA5MDA4MzQ5Nn0.eJQjPYGxSii8_kJfebjKnOrSgkMpDm2d2LDVh9fCxo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('roll_no', '4');

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
