'use client';

// Shared cache for pre-loaded greeting audio
// This allows the greeting to be fetched on the home page and used in VoiceMode

interface GreetingCache {
    en: string | null;
    ta: string | null;
    isLoading: boolean;
    isLoaded: boolean;
}

// Global cache that persists across components
const greetingCache: GreetingCache = {
    en: null,
    ta: null,
    isLoading: false,
    isLoaded: false,
};

export const GREETINGS = {
    en: 'Welcome to SIMS Assistant. How can I help you today?',
    ta: 'SIMS உதவியாளருக்கு வரவேற்கிறோம். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
};

/**
 * Preload greeting audio for both languages.
 * Call this early (e.g., on home page mount) for instant playback in VoiceMode.
 */
export async function preloadGreetings(): Promise<void> {
    if (greetingCache.isLoaded || greetingCache.isLoading) {
        return;
    }

    greetingCache.isLoading = true;
    console.log('DEBUG: Preloading greeting audio on home page...');

    try {
        const [enResponse, taResponse] = await Promise.all([
            fetch('/api/voice/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: GREETINGS.en, language: 'en-IN' }),
            }),
            fetch('/api/voice/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: GREETINGS.ta, language: 'ta-IN' }),
            }),
        ]);

        if (enResponse.ok) {
            const enData = await enResponse.json();
            if (enData.audio) greetingCache.en = enData.audio;
        }
        if (taResponse.ok) {
            const taData = await taResponse.json();
            if (taData.audio) greetingCache.ta = taData.audio;
        }

        greetingCache.isLoaded = true;
        console.log('DEBUG: Greeting audio preloaded successfully!');
    } catch (error) {
        console.error('Failed to preload greetings:', error);
    } finally {
        greetingCache.isLoading = false;
    }
}

/**
 * Get pre-loaded greeting audio for a language.
 * Returns null if not yet loaded.
 */
export function getPreloadedGreeting(language: 'en-IN' | 'ta-IN'): string | null {
    return language === 'en-IN' ? greetingCache.en : greetingCache.ta;
}

/**
 * Check if greetings are already loaded.
 */
export function areGreetingsLoaded(): boolean {
    return greetingCache.isLoaded;
}
