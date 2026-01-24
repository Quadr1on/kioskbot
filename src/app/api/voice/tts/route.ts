import { NextRequest, NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

export async function POST(req: NextRequest) {
    try {
        const { text, language = 'en-IN', speaker = 'meera' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        if (!SARVAM_API_KEY) {
            return NextResponse.json({ error: 'Sarvam API key not configured' }, { status: 500 });
        }

        // Map language to appropriate voice
        const voiceMap: Record<string, string> = {
            'en-IN': 'anushka',    // English - User requested anushka (Valid: anushka, abhilash, manisha, vidya, arya, karun, hitesh)
            'ta-IN': 'vidya',      // Tamil - Valid
        };

        const selectedVoice = voiceMap[language] || speaker;

        const response = await fetch(SARVAM_TTS_URL, {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: [text.substring(0, 500)], // Truncate to 500 chars as per API limit
                target_language_code: language,
                speaker: selectedVoice,
                model: 'bulbul:v2',


                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 22050,
                enable_preprocessing: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sarvam TTS error:', errorText);
            return NextResponse.json(
                { error: 'Text-to-speech conversion failed' },
                { status: response.status }
            );
        }

        const result = await response.json();

        // Sarvam returns base64 encoded audio
        if (result.audios && result.audios.length > 0) {
            return NextResponse.json({
                audio: result.audios[0],
                format: 'wav',
                encoding: 'base64',
            });
        }

        return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { error: 'Internal server error during text-to-speech conversion' },
            { status: 500 }
        );
    }
}
