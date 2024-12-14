'use client';

import { useEffect } from 'react';

export function SignerContainer() {
  useEffect(() => {
    // Check if container already exists
    if (!document.getElementById('alchemy-signer-iframe-container')) {
      const container = document.createElement('div');
      container.id = 'alchemy-signer-iframe-container';
      container.style.position = 'fixed';
      container.style.zIndex = '9999';
      container.style.top = '0';
      container.style.left = '0';
      document.body.appendChild(container);
    }

    // Cleanup on unmount
    return () => {
      const container = document.getElementById('alchemy-signer-iframe-container');
      if (container) {
        container.remove();
      }
    };
  }, []);

  return null;
} 