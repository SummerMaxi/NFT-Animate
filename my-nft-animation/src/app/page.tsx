'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { ClientOnly } from '@/components/ClientOnly';
import { useThemeStore } from '@/store/themeStore';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

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
    <main className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      <ClientOnly>
        <div className="max-w-[1800px] mx-auto h-screen flex flex-col">
          {/* Header */}
          <div className={`flex justify-between items-center mb-4 px-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button className="py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
              Connect Wallet
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-4 flex-1">
            {/* Left Column - Controls */}
            <div className="col-span-3">
              <div className="grid gap-4 h-full">
                {/* Control Panel */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
                  <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Controls</h2>
                  <Controls containerRef={containerRef} />
                </div>
                
                {/* Recording Panel */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
                  <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recording</h2>
                  <ScreenRecorder containerRef={containerRef} />
                </div>
              </div>
            </div>

            {/* Middle Column - Canvas */}
            <div className="col-span-6">
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border h-full`}>
                <div 
                  ref={containerRef} 
                  className="relative bg-white rounded-xl overflow-hidden"
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
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border h-full`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Your NFTs</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-xl ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:border-purple-500' 
                          : 'bg-gray-50 border-gray-100 hover:border-purple-200'
                      } border flex items-center justify-center text-gray-400 transition-colors cursor-pointer`}
                    >
                      NFT {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  );
}