'use client';

import { useEffect, useState } from 'react';
import { useUser } from "@account-kit/react";
import { getNFTsForOwner } from '@/services/nftService';
import Image from 'next/image';
import type { OwnedNft } from 'alchemy-sdk';

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

export function NFTGallery() {
  const user = useUser();
  const [nfts, setNfts] = useState<OwnedNft[]>([]);
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
      } catch (err) {
        setError('Failed to fetch NFTs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [user?.address]);

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
    <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto p-2">
      {nfts.map((nft) => {
        const imageUrl = getImageUrl(nft);
        
        return (
          <div 
            key={`${nft.contract.address}-${nft.tokenId}`}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 cursor-pointer border border-gray-200 dark:border-gray-700"
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
            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                    {nft.title || nft.name || `NFT #${nft.tokenId}`}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {nft.contract.name || 'Unknown Collection'}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    #{nft.tokenId}
                  </span>
                </div>
              </div>
              {nft.description && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {nft.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 