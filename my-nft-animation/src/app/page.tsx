'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { ClientOnly } from '@/components/ClientOnly';

const ImageStack = dynamic(
  () => import('../components/ImageStack').then(mod => mod.ImageStack),
  { ssr: false }
);

const RecordButton = dynamic(
  () => import('../components/RecordButton').then(mod => mod.RecordButton),
  { ssr: false }
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <ClientOnly>
        <div ref={containerRef} className="relative">
          <ImageStack />
        </div>
        <RecordButton containerRef={containerRef} />
      </ClientOnly>
    </main>
  );
}