import { NextRequest, NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as Blob;
        const language = (formData.get('language') as string) || 'en-IN';

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        if (!SARVAM_API_KEY) {
            return NextResponse.json({ error: 'Sarvam API key not configured' }, { status: 500 });
        }

        // Prepare the request to Sarvam AI
        const sarvamFormData = new FormData();
        sarvamFormData.append('file', audioFile, 'audio.webm');
        sarvamFormData.append('language_code', language);
        sarvamFormData.append('model', 'saarika:v2.5');
        sarvamFormData.append('with_timestamps', 'false');

        const response = await fetch(SARVAM_STT_URL, {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
            },
            body: sarvamFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sarvam STT error:', errorText);
            return NextResponse.json(
                { error: 'Speech-to-text conversion failed' },
                { status: response.status }
            );
        }

        const result = await response.json();

        return NextResponse.json({
            transcript: result.transcript || result.text || '',
            language: result.language_code || language,
        });
    } catch (error) {
        console.error('STT API error:', error);
        return NextResponse.json(
            { error: 'Internal server error during speech-to-text conversion' },
            { status: 500 }
        );
    }
}
