'use client';

import { useChain } from "@account-kit/react";
import { mainnet, polygon, arbitrum, optimism, sepolia } from "@account-kit/infra";
import { shapeMainnet } from "@/config/accountKit";
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { alchemy } from "@account-kit/infra";

type ChainConfig = {
  chain: typeof mainnet;
  label: string;
  icon: string;
};

export function ChainSelector() {
  const { chain, setChain } = useChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useThemeStore();

  // Define supported chains with their configurations
  const chainConfigs = [
    { chain: shapeMainnet, label: 'Shape', icon: '🔺' },
    { chain: mainnet, label: 'Ethereum', icon: '🔷' },
    { chain: polygon, label: 'Polygon', icon: '💜' },
    { chain: arbitrum, label: 'Arbitrum', icon: '🔵' },
    { chain: optimism, label: 'Optimism', icon: '❤️' },
    { chain: sepolia, label: 'Sepolia', icon: '🟣' },
  ];

  const handleChainChange = async (newChain: typeof mainnet) => {
    try {
      await setChain({ chain: newChain });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const currentChain = chainConfigs.find(c => c.chain.id === chain?.id) || chainConfigs[0];

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
          transition-colors duration-150
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
            {chainConfigs.map((config) => (
              <button
                key={config.chain.id}
                onClick={() => handleChainChange(config.chain)}
                className={`
                  w-full flex items-center gap-2 px-4 py-2
                  ${isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-200' 
                    : 'hover:bg-gray-50 text-gray-900'
                  }
                  ${config.chain.id === chain?.id 
                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-50') 
                    : ''
                  }
                  transition-colors duration-150
                `}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium">{config.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 