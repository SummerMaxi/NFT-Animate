'use client';

import { useRef, useState, useCallback } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { ClientOnly } from '@/components/ClientOnly';
import { AccountKitButton } from '@/components/AccountKitButton';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { NFTGallery } from '@/components/NFTGallery';
import { MetadataCard } from '@/components/MetadataCard';
import type { NFTMetadata } from '@/types/nft';
import dynamic from 'next/dynamic';
import { AnimationCard } from '../components/AnimationCard';
import { ShapeCraftCard } from '@/components/ShapeCraftCard';

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
  const [userAddress1, setUserAddress1] = useState('');
  const [userAddress2, setUserAddress2] = useState('');
  const [selectedId1, setSelectedId1] = useState('');
  const [selectedId2, setSelectedId2] = useState('');
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
  const [isWaving, setIsWaving] = useState(false);

  const handleMetadataUpdate = useCallback((metadata: NFTMetadata) => {
    console.log('Received metadata:', metadata);
    setNftMetadata(metadata);
  }, []);

  const handleAnimationChange = (value: string) => {
    setIsWaving(value === 'wave');
  };

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
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="User Address 1"
                  value={userAddress1}
                  onChange={(e) => setUserAddress1(e.target.value)}
                  className="px-3 py-2 rounded-lg glass-effect text-sm w-[300px]"
                />
                <input
                  type="text"
                  placeholder="User Address 2"
                  value={userAddress2}
                  onChange={(e) => setUserAddress2(e.target.value)}
                  className="px-3 py-2 rounded-lg glass-effect text-sm w-[300px]"
                />
              </div>
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
              
              {/* ShapeCraft Card */}
              <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">ShapeCraft</h2>
                <ShapeCraftCard
                  userAddress1={userAddress1} 
                  userAddress2={userAddress2}
                  onSelect1={setSelectedId1}
                  onSelect2={setSelectedId2}
                  onMetadataUpdate={handleMetadataUpdate}
                />
              </div>

              {/* Animation Card */}
              {nftMetadata && (
                <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  <h2 className="text-lg font-semibold mb-6">Animation</h2>
                  <AnimationCard onAnimationChange={handleAnimationChange} />
                </div>
              )}
              
              {/* Download Card */}
              <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">Download</h2>
                <ScreenRecorder containerRef={containerRef} />
              </div>

              {/* Metadata Cards */}
              <div className={`bento-card glass-effect ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <h2 className="text-lg font-semibold mb-6">Contract 1 Metadata</h2>
                <MetadataCard
                  contractAddress="0xF2E4b2a15872a20D0fFB336a89B94BA782cE9Ba5"
                  tokenId={selectedId1}
                  label="Contract 1 NFT"
                  onMetadataLoad={handleMetadataUpdate}
                />
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
                  <Canvas metadata={nftMetadata} isWaving={isWaving} />
                </div>
              </div>
            </div>

            {/* Right Column - NFT Display */}
            <div className="col-span-3">
              <div className={`bento-card glass-effect h-full ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <NFTGallery />
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  );
}