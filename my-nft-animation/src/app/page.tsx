'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { ClientOnly } from '@/components/ClientOnly';
import { AccountKitButton } from '@/components/AccountKitButton';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { NFTGallery } from '@/components/NFTGallery';

const Controls = dynamic(
  () => import('../components/Controls').then(mod => mod.Controls),
  { ssr: false }
);

const Canvas = dynamic(
  () => import('../components/Canvas').then(mod => mod.Canvas),
  { ssr: false }
);

const ScreenRecorder = dynamic(
  () => import('../components/ScreenRecorder').then(mod => mod.ScreenRecorder),
  { ssr: false }
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <main className={`min-h-screen ${isDarkMode ? 'bg-[#0A0A0A] dark' : 'bg-[#FAFAFA]'}`}>
      <ClientOnly>
        <div className="max-w-[1800px] mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className={`p-3 rounded-xl glass-effect ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                } transition-all`}
              >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
            <AccountKitButton />
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-3 space-y-6">
              {/* Controls Card */}
              <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">Controls</h2>
                <Controls containerRef={containerRef} />
              </div>
              
              {/* Recording Card */}
              <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">Recording</h2>
                <ScreenRecorder containerRef={containerRef} />
              </div>
            </div>

            {/* Middle Column - Canvas */}
            <div className="col-span-6">
              <div className={`bento-card glass-effect h-full ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <div 
                  ref={containerRef} 
                  className="relative bg-white rounded-2xl overflow-hidden"
                  style={{ 
                    width: '100%',
                    height: 'calc(100% - 24px)',
                    aspectRatio: '1',
                  }}
                >
                  <Canvas />
                </div>
              </div>
            </div>

            {/* Right Column - NFT Display */}
            <div className="col-span-3">
              <div className={`bento-card glass-effect h-full ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">Your NFTs</h2>
                <NFTGallery />
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  );
}