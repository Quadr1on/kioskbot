import { createGroq } from '@ai-sdk/groq';

export const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY!,
});

export const llmModel = groq('openai/gpt-oss-20b');
