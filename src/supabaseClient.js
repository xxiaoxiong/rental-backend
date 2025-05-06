import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// const supabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = 'https://qlyolerdqkfwehbbezfz.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseW9sZXJkcWtmd2VoYmJlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjU3MzMsImV4cCI6MjA2MTM0MTczM30.fkyg2UDgGmQDlzaAL4SgNZ6nhjolEcBVTQ0gWNrQhMg'

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key is missing. Please check your .env file.');
  // In a real application, you might want to throw an error or exit
  // For now, we'll proceed but Supabase client will be null
}

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

console.log(supabase ? 'Supabase client initialized.' : 'Supabase client could not be initialized. Check environment variables.');

