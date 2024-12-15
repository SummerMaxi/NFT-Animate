'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';

interface MetadataCardProps {
  contractAddress: string;
  tokenId: string;
  label: string;
  onMetadataLoad?: (metadata: NFTMetadata) => void;
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

interface NFTMetadata {
  contract: {
    address: string;
  };
  tokenId: string;
  tokenType: string;
  name: string;
  description: string;
  raw: {
    metadata: {
      attributes: NFTAttribute[];
    };
  };
}

export const MetadataCard = ({ contractAddress, tokenId, label, onMetadataLoad }: MetadataCardProps) => {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!tokenId) return;

    setLoading(true);
    setError(null);

    try {
      const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.SHAPE_MAINNET,
      });

      const response = await alchemy.nft.getNftMetadata(
        contractAddress,
        tokenId,
        {
          refreshCache: false,
          tokenType: 'ERC721',
          tokenUriTimeoutInMs: 10000
        }
      );

      console.log('Raw NFT Metadata:', response);
      const attributes = response.raw?.metadata?.attributes || [];
      console.log('NFT Attributes:', attributes);

      setMetadata(response as any);
      onMetadataLoad?.(response as any);
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError('Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenId, onMetadataLoad]);

  useEffect(() => {
    if (contractAddress && tokenId) {
      fetchMetadata();
    }
  }, [fetchMetadata]);

  if (!tokenId) {
    return <div>No token ID provided</div>;
  }

  if (loading) {
    return <div>Loading metadata...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!metadata) return null;

  const attributes = metadata.raw?.metadata?.attributes || [];

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* NFT Title Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {metadata?.name || metadata?.title || `Token #${tokenId}`}
          </h3>
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            {label}
          </span>
        </div>

        {/* NFT Image */}
        {metadata?.image?.cachedUrl && (
          <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <img 
              src={metadata.image.cachedUrl}
              alt={metadata.name || metadata.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Description */}
        {metadata?.description && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {metadata.description}
            </p>
          </div>
        )}

        {/* Traits */}
        {attributes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Traits
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {attributes.map((attr, index) => (
                <div 
                  key={index}
                  className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {attr.trait_type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {attr.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!tokenId && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a token to view metadata
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 