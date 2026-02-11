import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envConfig = fs.readFileSync('.env', 'utf-8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function debugAlignment() {
    // Get last 5 messages
    const { data: messages } = await supabase.from('chat_messages').select('*').order('timestamp', { ascending: false }).limit(5);
    
    console.log('--- Recent Messages ---');
    messages.forEach(m => {
        console.log(`Msg: "${m.content}" | Sender: ${m.sender_name} | is_from_ateli: ${m.is_from_ateli}`);
    });
}

debugAlignment().catch(console.error);
