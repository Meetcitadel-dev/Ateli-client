
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env parser since we can't rely on dotenv being installed/configured for this standalone script
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};

        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env file:', e);
        return {};
    }
}

async function testPersistence() {
    const env = loadEnv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env');
        process.exit(1);
    }

    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get a test user (we need to be authenticated for RLS usually, but let's see if we can use a service role or if anon works with current policies)
    // The current policies are:
    // CREATE POLICY "chat_messages_all" ON public.chat_messages FOR ALL USING (true);
    // This implies anyone can read/write chat messages? Let's verify.
    // Wait, "FOR ALL USING (true)" usually means open access.

    // 2. Create a dummy project message
    const projectId = 'test-project-persistence-' + Date.now();
    const chatId = 'chat-' + projectId;
    const messageId = 'msg-' + Date.now();

    // We need a project first due to foreign key constraint?
    // CREATE TABLE public.chat_messages ( ... project_id text REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL ... );
    // Yes, we need a project.

    console.log(`Creating test project: ${projectId}`);
    // "projects_all" ON public.projects FOR ALL USING (true);
    const { error: projectError } = await supabase
        .from('projects')
        .insert({
            id: projectId,
            name: 'Persistence Test Project',
            status: 'active'
        });

    if (projectError) {
        console.error('Failed to create test project:', projectError);
        // Maybe try to find an existing project?
        const { data: existingProjects } = await supabase.from('projects').select('id').limit(1);
        if (existingProjects && existingProjects.length > 0) {
            console.log(`Using existing project: ${existingProjects[0].id}`);
            // modifying projectId local var is tricky here without let, let's just proceed with existing if create failed assuming constraint error
            // but if it's permission error, we are stuck.
            // Let's restart logic with fetching first.
        } else {
            process.exit(1);
        }
    }

    // Let's use a known project ID if the insert failed (likely due to RLS if auth is stricter than we thought, or maybe it succeeded).
    // Actually, let's try to get ANY project first to be safe.
    const { data: projects } = await supabase.from('projects').select('id').limit(1);
    if (!projects || projects.length === 0) {
        // If we promised "projects_all" verified earlier, we should be able to create one if none exist, 
        // but let's assume the previous insert might have worked or we use the new ID.
        // If insert failed, we might not have a project. 
    }

    const targetProjectId = (projects && projects.length > 0) ? projects[0].id : projectId;
    console.log(`Target Project ID: ${targetProjectId}`);

    const testMessage = {
        id: messageId,
        project_id: targetProjectId,
        chat_id: `chat-${targetProjectId}`,
        sender_id: 'test-user-system', // uuid required? "sender_id uuid" in schema.
        // Wait, schema says: sender_id uuid. We need a valid UUID.
        // Let's generate a random UUID.
        content: 'Persistence Test Message ' + new Date().toISOString(),
        type: 'text',
        is_from_ateli: false,
        is_read: true,
        timestamp: new Date().toISOString()
    };

    // UUID generation for sender_id
    testMessage.sender_id = '00000000-0000-0000-0000-000000000000'; // Null uuid or random?
    // Postgres UUID must be valid format.

    console.log('Saving message...');
    const { error: saveError } = await supabase
        .from('chat_messages')
        .insert(testMessage);

    if (saveError) {
        console.error('Failed to save message:', saveError);
        process.exit(1);
    }
    console.log('Message saved successfully.');

    // 3. Fetch it back
    console.log('Fetching message back...');
    const { data: fetchedMessages, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId);

    if (fetchError) {
        console.error('Failed to fetch message:', fetchError);
        process.exit(1);
    }

    if (fetchedMessages && fetchedMessages.length > 0) {
        console.log('✅ Message retrieved successfully!');
        console.log('Content:', fetchedMessages[0].content);

        // Clean up message
        await supabase.from('chat_messages').delete().eq('id', messageId);
        // Clean up project if we created it specifically (optional, maybe skip to avoid deleting real data if logic mixed up)
        if (targetProjectId === projectId && !projects?.some(p => p.id === projectId)) {
            await supabase.from('projects').delete().eq('id', projectId);
        }
    } else {
        console.error('❌ Message saved but not found on fetch!');
    }
}

testPersistence().catch(console.error);
