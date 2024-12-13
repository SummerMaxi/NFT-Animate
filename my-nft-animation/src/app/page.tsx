'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';

const ImageStack = dynamic(
  () => import('../components/ImageStack').then(mod => mod.ImageStack),
  { 
    ssr: false,
    loading: () => null 
  }
);

const RecordButton = dynamic(
  () => import('../components/RecordButton').then(mod => mod.RecordButton),
  { 
    ssr: false,
    loading: () => null 
  }
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div ref={containerRef} className="relative">
        <ImageStack />
      </div>
      <RecordButton containerRef={containerRef} />
    </main>
  );
}