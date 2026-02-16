import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode'); // 'voice' | 'chat' | null
        const limit = parseInt(searchParams.get('limit') || '200');
        const session_id = searchParams.get('session_id');

        let query = supabase
            .from('conversation_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (mode) query = query.eq('mode', mode);
        if (session_id) query = query.eq('session_id', session_id);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by session
        const sessions: Record<string, any> = {};
        for (const log of data || []) {
            if (!sessions[log.session_id]) {
                sessions[log.session_id] = {
                    session_id: log.session_id,
                    mode: log.mode,
                    language: log.language,
                    started_at: log.created_at,
                    messages: [],
                };
            }
            sessions[log.session_id].messages.push(log);
            // Track earliest timestamp
            if (log.created_at < sessions[log.session_id].started_at) {
                sessions[log.session_id].started_at = log.created_at;
            }
        }

        // Sort messages within each session by time ascending
        for (const sess of Object.values(sessions)) {
            sess.messages.sort((a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }

        const sessionList = Object.values(sessions).sort((a: any, b: any) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );

        return NextResponse.json({
            sessions: sessionList,
            total_logs: data?.length || 0,
            total_sessions: sessionList.length,
        });
    } catch (err) {
        console.error('Admin logs error:', err);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
