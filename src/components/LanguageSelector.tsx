'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface LanguageSelectorProps {
  onSelect: (lang: 'en-IN' | 'ta-IN') => void;
}

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto px-6">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-12 text-center"
      >
        Select your preferred language
        <span className="block text-lg text-gray-400 font-normal mt-2">
            விரும்பிய மொழியைத் தேர்ந்தெடுக்கவும்
        </span>
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => onSelect('en-IN')}
            className="group cursor-pointer bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-blue-500 transition-all p-8 flex flex-col items-center justify-center h-64 shadow-xl"
          >
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
              <span className="text-4xl">🇬🇧</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">English</h3>
            <p className="text-gray-400 mt-2">Tap to speak</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => onSelect('ta-IN')}
            className="group cursor-pointer bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-purple-500 transition-all p-8 flex flex-col items-center justify-center h-64 shadow-xl"
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
              <span className="text-4xl text-white font-bold">அ</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">தமிழ் (Tamil)</h3>
            <p className="text-gray-400 mt-2">பேச தட்டவும்</p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
