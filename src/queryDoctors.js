import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pioyexwgwzhbzvrafddy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpb3lleHdnd3poYnp2cmFmZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjc5MDUsImV4cCI6MjA4OTk0MzkwNX0.e1IyGpVfYG547BcRWgxMMAZlZKaK68Z4TFMkkhqKLos';

const db = createClient(supabaseUrl, supabaseKey);

async function queryDoctors() {
  try {
    const { data, error } = await db
      .from('doctors')
      .select('*');
    
    if (error) {
      console.error('Error fetching doctors:', error);
      return;
    }
    
    console.log('Total doctors found:', data.length);
    console.log('\n--- Full Doctors Data ---\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.length > 0) {
      console.log('\n--- Table Schema (First Record Keys) ---\n');
      console.log(Object.keys(data[0]));
    }
  } catch (err) {
    console.error('Failed to query doctors:', err);
  }
}

queryDoctors();
