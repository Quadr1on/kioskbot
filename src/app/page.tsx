'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import VoiceMode from '@/components/VoiceMode';

type Mode = 'select' | 'chat' | 'voice';

export default function Home() {
  const [mode, setMode] = useState<Mode>('select');

  if (mode === 'chat') {
    return <ChatInterface onSwitchToVoice={() => setMode('voice')} />;
  }

  if (mode === 'voice') {
    return <VoiceMode onSwitchToChat={() => setMode('chat')} />;
  }

  // Mode Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center px-6 py-12">
      {/* Hospital Logo & Title */}
      <div className="text-center mb-12">
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Welcome to SIMS Hospital
        </h1>
        <p className="text-xl text-gray-400">
          How would you like to interact with me?
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Chat Mode Card */}
        <button
          onClick={() => setMode('chat')}
          className="group relative p-8 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-3xl transition-all duration-300 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
          <div className="relative">
            <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Chat Mode
            </h2>
            <p className="text-gray-400 text-lg">
              Type your questions using the on-screen keyboard
            </p>
          </div>
        </button>

        {/* Voice Mode Card */}
        <button
          onClick={() => setMode('voice')}
          className="group relative p-8 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-3xl transition-all duration-300 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
          <div className="relative">
            <div className="w-20 h-20 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Voice Mode
            </h2>
            <p className="text-gray-400 text-lg">
              Speak naturally in English or Tamil
            </p>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 mb-4">Quick Actions</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Find Patient', 'Book Appointment', 'Visiting Hours', 'Emergency'].map((action) => (
            <button
              key={action}
              onClick={() => setMode('chat')}
              className="px-5 py-3 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors text-lg"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-center">
        <p className="text-gray-600 text-sm">
          Need help? Speak to our reception or call 1066
        </p>
      </footer>
    </div>
  );
}
