import {createClient} from '@supabase/supabase-js';
import { config } from 'dotenv';

config()
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL not set');
    if (!supabaseKey) console.error('   - SUPABASE_KEY not set');
    console.error('Please check your .env file');
}

export const db = createClient(supabaseUrl, supabaseKey);

// Test connection on startup
db.auth.getSession()
    .then(() => console.log('✅ Supabase connection successful'))
    .catch(err => console.error('⚠️  Supabase connection warning:', err.message));