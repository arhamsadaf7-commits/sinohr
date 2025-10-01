import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mpgafrxbxknxyaqajlxe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZ2FmcnhieGtueHlhcWFqbHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjY2NzQsImV4cCI6MjA0ODIwMjY3NH0.VYqkzoKJGvQhJvmJGJvQhJvmJGJvQhJvmJGJvQhJvmJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);