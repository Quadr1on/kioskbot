import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google AI API key not configured' },
            { status: 500 }
        );
    }

    return NextResponse.json({ apiKey });
}
