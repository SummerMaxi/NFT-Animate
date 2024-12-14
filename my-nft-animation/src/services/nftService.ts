import { Network, Alchemy, NftFilters } from "alchemy-sdk";

if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
  throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY is not defined in environment variables');
}

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: process.env.NEXT_PUBLIC_ALCHEMY_NETWORK as Network || Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

export async function getNFTsForOwner(ownerAddress: string) {
  try {
    const nfts = await alchemy.nft.getNftsForOwner(ownerAddress, {
      pageSize: 100,
      excludeFilters: [NftFilters.SPAM]
    });
    
    return {
      nfts: nfts.ownedNfts,
      totalCount: nfts.totalCount
    };
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
}

export async function getNFTMetadata(contractAddress: string, tokenId: string) {
  try {
    return await alchemy.nft.getNftMetadata(
      contractAddress,
      tokenId
    );
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
} 