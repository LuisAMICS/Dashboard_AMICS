import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_ANON_KEY || 'your-key'
);

async function run() {
  const { data, error } = await supabase.from('projects').insert([{
    name: 'Test Project',
    client_id: null,
    description: 'Test',
    status: 'planning',
    progress: 0,
    tasks_completed: 0,
    tasks_total: 0,
    budget: 0,
    team: []
  }]);
  console.log({data, error});
}
run();
