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

async function debugChat() {
    // 1. Get first project
    const { data: projects } = await supabase.from('projects').select('id, name').limit(1);
    if (!projects || projects.length === 0) {
        console.log('No projects found');
        return;
    }
    const projectId = projects[0].id;
    console.log('Checking project:', projectId, projects[0].name);

    // 2. Get members
    const { data: members } = await supabase.from('project_members').select('*').eq('project_id', projectId);
    console.log('Members:', members.map(m => m.user_id));

    // 3. Get messages
    const { data: messages } = await supabase.from('chat_messages').select('*').eq('project_id', projectId);
    console.log('Total Messages:', messages.length);
    
    // 4. Analyze message distribution
    if (messages.length > 0) {
        console.log('Sample Messages (last 10):');
        messages.slice(-10).forEach(m => {
             console.log(`ID: ${m.id}\n  ChatID: ${m.chat_id}\n  Sender: ${m.sender_name} (${m.sender_id})\n  Type: ${m.type}\n`);
        });
    }
}

debugChat().catch(console.error);
