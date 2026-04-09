import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bccfzucwiyxtwohtqjsn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY2Z6dWN3aXl4dHdvaHRxanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDc0OTYsImV4cCI6MjA5MDA4MzQ5Nn0.eJQjPYGxSii8_kJfebjKnOrSgkMpDm2d2LDVh9fCxo4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: async (name, acquireTimeout, fn) => {
      // Bypass Navigator Lock API — it causes race condition crashes in React Native
      return await fn();
    },
  },
});
