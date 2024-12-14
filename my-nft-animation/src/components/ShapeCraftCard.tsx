'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Alchemy, Network } from 'alchemy-sdk';
import { useAnimationStore } from '../store/animationStore';

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
  onSelect1?: (id: string) => void;
  onSelect2?: (id: string) => void;
}

const NFTDropdown = ({ label, tokenIds, selectedId, onSelect }: NFTDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      >
        <div className="flex items-center justify-between">
          <span>{selectedId ? `Token #${selectedId}` : label}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </div>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                  >
                    {label}
                  </Dialog.Title>
                  <div className="mt-2 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {tokenIds.map((id) => (
                        <button
                          key={id}
                          className={`p-3 text-sm rounded-lg transition-colors
                            ${selectedId === id 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                          onClick={() => {
                            onSelect(id);
                            setIsOpen(false);
                          }}
                        >
                          #{id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 dark:bg-indigo-900 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none"
                      onClick={() => setIsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export const ShapeCraftCard = ({ 
  userAddress1, 
  userAddress2,
  onSelect1,
  onSelect2
}: ShapeCraftCardProps) => {
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

  const handleSelect1 = (id: string) => {
    setSelectedId1(id);
    onSelect1?.(id);
  };

  const handleSelect2 = (id: string) => {
    setSelectedId2(id);
    onSelect2?.(id);

    // First, clear the existing text
    useAnimationStore.getState().setBubbleText('');

    // Fetch metadata and update bubble text
    const fetchBaseNameTrait = async () => {
      try {
        const alchemy = new Alchemy({
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
          network: Network.SHAPE_MAINNET,
        });

        const nftMetadata = await alchemy.nft.getNftMetadata(
          SHAPE_CONTRACT_2,
          id,
          {
            refreshCache: true,
            tokenType: 'erc721' as const,
            tokenUriTimeoutInMs: 10000
          }
        );

        const attributes = (nftMetadata.raw?.metadata?.attributes || []) as NFTAttribute[];
        const baseTrait = attributes.find((attr: NFTAttribute) => attr.trait_type === 'Base');
        
        if (baseTrait?.value) {
          // Set the new text after a brief delay to ensure the clear happened
          setTimeout(() => {
            useAnimationStore.getState().setBubbleText(String(baseTrait.value).trim());
            console.log('Updated bubble text to:', baseTrait.value);
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching base trait:', error);
      }
    };

    fetchBaseNameTrait();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <NFTDropdown
          label="Select Token ID (Contract 1)"
          tokenIds={tokenIds1}
          selectedId={selectedId1}
          onSelect={handleSelect1}
        />
        <NFTDropdown
          label="Select Token ID (Contract 2)"
          tokenIds={tokenIds2}
          selectedId={selectedId2}
          onSelect={handleSelect2}
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