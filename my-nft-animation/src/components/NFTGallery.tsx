'use client';

import { useEffect, useState } from 'react';
import { useUser } from "@account-kit/react";
import { getNFTsForOwner } from '@/services/nftService';
import Image from 'next/image';
import type { OwnedNft } from 'alchemy-sdk';

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
      <div className="text-center p-4">
        No NFTs found for this address
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
      {nfts.map((nft) => (
        <div 
          key={`${nft.contract.address}-${nft.tokenId}`}
          className="border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        >
          {nft.media?.[0]?.thumbnail && (
            <div className="relative h-32 w-full">
              <Image
                src={nft.media[0].thumbnail}
                alt={nft.title || 'NFT'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-3">
            <h3 className="font-semibold text-sm truncate">
              {nft.title || `NFT #${nft.tokenId}`}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
} 