'use client';

import { useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Alchemy, Network } from 'alchemy-sdk';

const SHAPE_CONTRACT_1 = '0xF2E4b2a15872a20D0fFB336a89B94BA782cE9Ba5';
const SHAPE_CONTRACT_2 = '0x0602b0fad4d305b2C670808Dd9f77B0A68E36c5B';

interface NFTDropdownProps {
  label: string;
  tokenIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface ShapeCraftCardProps {
  userAddress1: string;
  userAddress2: string;
}

const NFTDropdown = ({ label, tokenIds, selectedId, onSelect }: NFTDropdownProps) => (
  <Menu as="div" className="relative inline-block text-left w-full">
    <Menu.Button className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
      <div className="flex items-center justify-between">
        <span>{selectedId || label}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </div>
    </Menu.Button>
    <Menu.Items className="absolute z-10 w-full mt-2 origin-top-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
      <div className="py-1 max-h-48 overflow-auto">
        {tokenIds.map((id) => (
          <Menu.Item key={id}>
            {({ active }) => (
              <button
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                onClick={() => onSelect(id)}
              >
                Token #{id}
              </button>
            )}
          </Menu.Item>
        ))}
      </div>
    </Menu.Items>
  </Menu>
);

export const ShapeCraftCard = ({ userAddress1, userAddress2 }: ShapeCraftCardProps) => {
  const [tokenIds1, setTokenIds1] = useState<string[]>([]);
  const [tokenIds2, setTokenIds2] = useState<string[]>([]);
  const [selectedId1, setSelectedId1] = useState('');
  const [selectedId2, setSelectedId2] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTokenIds = async (address: string, contractAddress: string) => {
    if (!address) return [];
    
    const alchemy = new Alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
      network: Network.SHAPE_MAINNET,
    });

    try {
      const nfts = await alchemy.nft.getNftsForOwner(address, {
        contractAddresses: [contractAddress],
      });

      return nfts.ownedNfts.map(nft => nft.tokenId);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadTokenIds = async () => {
      setLoading(true);
      const [ids1, ids2] = await Promise.all([
        fetchTokenIds(userAddress1, SHAPE_CONTRACT_1),
        fetchTokenIds(userAddress2, SHAPE_CONTRACT_2),
      ]);
      setTokenIds1(ids1);
      setTokenIds2(ids2);
      setLoading(false);
    };

    if (userAddress1 || userAddress2) {
      loadTokenIds();
    }
  }, [userAddress1, userAddress2]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <NFTDropdown
          label="Select Token ID (Contract 1)"
          tokenIds={tokenIds1}
          selectedId={selectedId1}
          onSelect={setSelectedId1}
        />
        <NFTDropdown
          label="Select Token ID (Contract 2)"
          tokenIds={tokenIds2}
          selectedId={selectedId2}
          onSelect={setSelectedId2}
        />
      </div>
      {loading && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
        </div>
      )}
    </div>
  );
}; 