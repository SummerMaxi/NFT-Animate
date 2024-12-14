'use client';

import { useChain } from "@account-kit/react";
import { mainnet, polygon, arbitrum, optimism, sepolia } from "@account-kit/infra";
import { shapeMainnet, shapeSepolia } from "@/config/chains";
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ChainSelector() {
  const { chain, setChain } = useChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useThemeStore();

  const chains = [
    { ...shapeMainnet, label: 'Shape', icon: '🔺' },
    { ...mainnet, label: 'Ethereum', icon: '🔷' },
    { ...polygon, label: 'Polygon', icon: '💜' },
    { ...arbitrum, label: 'Arbitrum', icon: '🔵' },
    { ...optimism, label: 'Optimism', icon: '❤️' },
    { ...sepolia, label: 'Sepolia', icon: '🟣' },
    { ...shapeSepolia, label: 'Shape Testnet', icon: '🔻' }
  ];

  useEffect(() => {
    if (chain.id !== shapeMainnet.id) {
      setChain(shapeMainnet);
    }
  }, []);

  const currentChain = chains.find(c => c.id === chain.id) || chains[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          ${isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
          }
          transition-all duration-200 ease-in-out
        `}
      >
        <span className="text-lg">{currentChain.icon}</span>
        <span className="font-medium">{currentChain.label}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`
          absolute z-50 mt-2 w-48 rounded-xl shadow-lg
          ${isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
          }
          overflow-hidden
          transform origin-top scale-100 transition-all duration-200 ease-in-out
        `}>
          <div className="py-1">
            {chains.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setChain({ chain: c });
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-4 py-2
                  ${isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-200' 
                    : 'hover:bg-gray-50 text-gray-900'
                  }
                  ${c.id === chain.id 
                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-50') 
                    : ''
                  }
                  transition-colors duration-150
                `}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 