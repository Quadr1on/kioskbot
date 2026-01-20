import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

// Switch between models here to test
// const modelName = 'openai/gpt-oss-20b'; // Current user choice
// const modelName = 'mixtral-8x7b-32768';
const modelName = 'llama-3.3-70b-versatile';

const llmModel = groq(modelName);

async function runTest() {
    console.log(`Testing model: ${modelName}`);

    try {
        const result = await generateText({
            model: llmModel,
            maxSteps: 5,
            messages: [
                { role: 'system', content: 'You are a helpful assistant. If you find a patient, you MUST describe their location verbally.' },
                { role: 'user', content: 'Find patient Rajesh.' },
            ],
            tools: {
                findPatient: tool({
                    description: 'Search for a patient by name',
                    parameters: z.object({
                        patientName: z.string(),
                    }),
                    execute: async ({ patientName }) => {
                        console.log(`[Tool] findPatient called for: ${patientName}`);
                        // Simulate Supabase response
                        return {
                            patients: [
                                { name: 'Rajesh Kumar', room: '201-A', department: 'Cardiology' }
                            ]
                        };
                    },
                }),
            },
        });

        console.log('\n--- Final Response ---');
        console.log(result.text);
        console.log('----------------------\n');
        console.log('Tool calls:', result.toolCalls.length);
        console.log('Steps:', result.steps.length);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
