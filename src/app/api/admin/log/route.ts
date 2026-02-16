import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { session_id, mode, language, role, content, metadata } = await req.json();

        const { error } = await supabase.from('conversation_logs').insert({
            session_id,
            mode,
            language: language || 'en-IN',
            role,
            content,
            metadata: metadata || {},
        });

        if (error) {
            console.error('Log insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Log API error:', err);
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
