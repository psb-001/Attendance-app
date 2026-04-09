import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if(!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Missing env vars");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runIdentityDiagnostics() {
    console.log("\n🕵️ RUNNING IDENTITY DIAGNOSTICS...\n");
    
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').eq('role', 'not_enrolled');
    if (pErr) return console.error("❌ RLS Blocked query:", pErr.message);
    if (!profiles || profiles.length === 0) return console.log("✅ ZERO trapped accounts.");

    console.log(`🚨 FOUND ${profiles.length} TRAPPED ACCOUNTS:\n`);
    
    const { data: registry } = await supabase.from('students_registry').select('email, full_name');
    
    for (let p of profiles) {
        let authEmail = p.email;
        console.log(`User Logging In As: "${authEmail}"`);
        
        let foundMatch = false;
        for (let target of (registry || [])) {
            if (!target.email) continue;
            if (target.email.toLowerCase() === authEmail.toLowerCase()) {
                console.log(`   [- MATCHED -] Found exactly in registry!`);
                foundMatch = true; break;
            }
            if (target.email.includes(authEmail.split('@')[0]) || authEmail.includes(target.email.split('@')[0])) {
                console.log(`   [? TYPO ?] Expected: "${target.email}"`);
                foundMatch = true;
            }
        }
        if (!foundMatch) console.log(`   [X MISSING] Admin has not added "${authEmail}" to registry or spelling is wildly off.`);
    }
}
runIdentityDiagnostics();
