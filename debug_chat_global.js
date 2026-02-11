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

async function debugChatGlobal() {
    // 1. List all projects
    const { data: projects } = await supabase.from('projects').select('id, name');
    console.log('--- Projects ---');
    projects.forEach(p => console.log(`${p.name} (${p.id})`));

    // 2. List all messages grouped by project
    const { data: messages } = await supabase.from('chat_messages').select('project_id, chat_id, count(*)', {count: 'exact'});
    // Note: count(*) isn't valid in select like this usually, let's just get all messages and aggregate in JS for debug
    
    const { data: allMessages } = await supabase.from('chat_messages').select('*');
    console.log('\n--- All Messages in DB ---');
    console.log(`Total: ${allMessages.length}`);
    
    allMessages.forEach(m => {
        console.log(`Proj: ${m.project_id} | Chat: ${m.chat_id} | Sender: ${m.sender_name} (${m.sender_id})`);
    });

}

debugChatGlobal().catch(console.error);
