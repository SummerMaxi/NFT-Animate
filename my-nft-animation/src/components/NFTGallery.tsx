'use client';

import { useEffect, useState, Fragment } from 'react';
import { useUser } from "@account-kit/react";
import { getNFTsForOwner } from '@/services/nftService';
import Image from 'next/image';
import type { OwnedNft } from 'alchemy-sdk';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

function getImageUrl(nft: OwnedNft): string | null {
  // IPFS Gateway URLs in order of preference
  const IPFS_GATEWAYS = [
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfscdn.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/',
    'https://ipfs.io/ipfs/', // Move ipfs.io to last as fallback
  ];

  // Helper function to convert IPFS URL to HTTP URL
  function convertIpfsUrl(ipfsUrl: string): string {
    const ipfsHash = ipfsUrl.replace('ipfs://', '');
    // Use the first gateway as default
    return `${IPFS_GATEWAYS[0]}${ipfsHash}`;
  }

  // Check for direct image URLs
  if (nft.image?.cachedUrl) {
    return nft.image.cachedUrl;
  }
  
  if (nft.image?.thumbnailUrl) {
    return nft.image.thumbnailUrl;
  }

  if (nft.image?.originalUrl) {
    // Handle data URLs
    if (nft.image.originalUrl.startsWith('data:')) {
      return nft.image.originalUrl;
    }
    // Handle IPFS URLs
    if (nft.image.originalUrl.startsWith('ipfs://')) {
      return convertIpfsUrl(nft.image.originalUrl);
    }
    return nft.image.originalUrl;
  }

  // Check raw metadata
  if (nft.raw?.metadata?.image) {
    if (typeof nft.raw.metadata.image === 'string') {
      if (nft.raw.metadata.image.startsWith('ipfs://')) {
        return convertIpfsUrl(nft.raw.metadata.image);
      }
      return nft.raw.metadata.image;
    }
  }

  return null;
}

// Add error handling to the Image component
function NFTImage({ src, alt }: { src: string; alt: string }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);

  const handleError = () => {
    // If the URL is an IPFS URL, try the next gateway
    if (currentSrc.includes('/ipfs/')) {
      const ipfsHash = currentSrc.split('/ipfs/')[1];
      const nextGatewayIndex = errorCount + 1;
      
      if (nextGatewayIndex < IPFS_GATEWAYS.length) {
        setCurrentSrc(`${IPFS_GATEWAYS[nextGatewayIndex]}${ipfsHash}`);
        setErrorCount(nextGatewayIndex);
      }
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      unoptimized
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={handleError}
    />
  );
}

type NFTCollection = {
  name: string;
  contractAddress: string;
  nfts: OwnedNft[];
};

// Change from async function to regular function
function getContractName(contractAddress: string): string {
  // Contract name mapping
  const contractNames: Record<string, string> = {
    '0x05aA491820662b131d285757E5DA4b74BD0F0e5F': 'Shapebinder',
    '0x2f9810789aebBB6cdC6c0332948fF3B6D11121E3': 'Otom',
    '0x76d6aC90A62Ca547d51D7AcAeD014167F81B9931': 'Shape Stack'
  };

  try {
    return contractNames[contractAddress] || 'Unknown Collection';
  } catch (error) {
    console.error('Error getting contract name:', error);
    return 'Unknown Collection';
  }
}

export function NFTGallery() {
  const user = useUser();
  const [nfts, setNfts] = useState<OwnedNft[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      if (!user?.address) return;
      
      try {
        setLoading(true);
        setError(null);
        const { nfts: fetchedNfts } = await getNFTsForOwner(user.address);
        setNfts(fetchedNfts);

        // Group NFTs by collection with contract names
        const groupedNfts = fetchedNfts.reduce((acc: NFTCollection[], nft) => {
          const existingCollection = acc.find(
            c => c.contractAddress === nft.contract.address
          );

          const collectionName = getContractName(nft.contract.address);

          if (existingCollection) {
            existingCollection.nfts.push(nft);
          } else {
            acc.push({
              name: collectionName,
              contractAddress: nft.contract.address,
              nfts: [nft]
            });
          }

          return acc;
        }, []);

        setCollections(groupedNfts);
      } catch (err) {
        setError('Failed to fetch NFTs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [user?.address]);

  const displayedNfts = selectedCollection === 'all' 
    ? nfts 
    : collections.find(c => c.contractAddress === selectedCollection)?.nfts || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        <div className="p-8 rounded-xl border-2 border-dashed">
          No NFTs found on Shape Network
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Bento Style Dropdown - Fixed at top */}
      <div className="px-2 py-4 relative z-50">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-between items-center rounded-xl bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700">
              {selectedCollection === 'all' 
                ? `All Collections (${nfts.length})`
                : `${collections.find(c => c.contractAddress === selectedCollection)?.name} (${collections.find(c => c.contractAddress === selectedCollection)?.nfts.length})`
              }
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setSelectedCollection('all')}
                      className={`${
                        active ? 'bg-gray-50 dark:bg-gray-700' : ''
                      } ${
                        selectedCollection === 'all' ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                      } group flex w-full items-center px-4 py-2 text-sm text-gray-900 dark:text-white`}
                    >
                      <span className="flex-1">All Collections</span>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        {nfts.length}
                      </span>
                    </button>
                  )}
                </Menu.Item>
              </div>

              <div className="py-1">
                {collections.map((collection) => (
                  <Menu.Item key={collection.contractAddress}>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedCollection(collection.contractAddress)}
                        className={`${
                          active ? 'bg-gray-50 dark:bg-gray-700' : ''
                        } ${
                          selectedCollection === collection.contractAddress ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-gray-900 dark:text-white`}
                      >
                        <span className="flex-1">{collection.name}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          {collection.nfts.length}
                        </span>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Scrollable NFT Grid Container */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="grid grid-cols-2 gap-4">
          {displayedNfts.map((nft) => {
            const imageUrl = getImageUrl(nft);
            
            return (
              <div 
                key={`${nft.contract.address}-${nft.tokenId}`}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform hover:translate-y-[-4px]"
              >
                <div className="relative aspect-square w-full">
                  {imageUrl ? (
                    <NFTImage
                      src={imageUrl}
                      alt={nft.title || `NFT #${nft.tokenId}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}
                </div>
                
                {/* NFT Info */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {nft.title || nft.name || `NFT #${nft.tokenId}`}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {nft.contract.name || 'Unknown Collection'}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      #{nft.tokenId}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 