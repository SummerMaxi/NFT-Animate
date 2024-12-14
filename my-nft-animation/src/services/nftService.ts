import { Network, Alchemy, NftFilters } from "alchemy-sdk";

if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
  throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY is not defined in environment variables');
}

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.SHAPE_MAINNET,
};

const alchemy = new Alchemy(settings);

export async function getNFTsForOwner(ownerAddress: string) {
  try {
    const baseURL = `https://shape-mainnet.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForOwner`;
    const params = new URLSearchParams({
      owner: ownerAddress,
      withMetadata: 'true',
      pageSize: '100',
      excludeFilters: JSON.stringify([NftFilters.SPAM])
    });

    const response = await fetch(`${baseURL}?${params}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch NFTs');
    }

    const data = await response.json();
    
    return {
      nfts: data.ownedNfts,
      totalCount: data.totalCount,
      pageKey: data.pageKey
    };
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
}

export async function getNFTMetadata(contractAddress: string, tokenId: string) {
  try {
    const baseURL = `https://shape-mainnet.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTMetadata`;
    const params = new URLSearchParams({
      contractAddress,
      tokenId,
      refreshCache: 'false'
    });

    const response = await fetch(`${baseURL}?${params}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
} 