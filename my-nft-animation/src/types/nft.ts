export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadata {
  contract: {
    address: string;
  };
  tokenId: string;
  tokenType: string;
  name: string;
  description?: string;
  raw: {
    metadata: {
      attributes: NFTAttribute[];
    };
  };
} 