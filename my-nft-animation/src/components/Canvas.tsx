'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { ChatBubble } from './ChatBubble';
import { useAnimationStore } from '../store/animationStore';
import { LAYER_STRUCTURE } from '../constants/layerStructure';
import type { NFTMetadata } from '../types/nft';
import Image from 'next/image';

const Container = styled.div`
  position: relative;
  width: 828px;
  height: 828px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: visible;
`;

const StyledImage = styled.img<{ zIndex: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${props => props.zIndex};
  transform-origin: center center;
`;

interface LayerImage {
  src: string;
  zIndex: number;
  alt: string;
}

// Add this debug function
const debugMetadata = (metadata: any) => {
  console.log('Full metadata:', metadata);
  console.log('Raw metadata:', metadata.raw);
  console.log('Attributes:', metadata.raw?.metadata?.attributes);
  const sampleAttr = metadata.raw?.metadata?.attributes?.[0];
  console.log('Sample attribute:', sampleAttr);
};

const TRAIT_TYPE_MAPPING: Record<string, string[]> = {
  'SKIN': ['Skin'],
  // Comment out other mappings for now
  // 'HAIR-HAT': ['Hair', 'Hat'],
  // 'SUITS': ['Suit'],
  // 'ACCESSORIES': ['Accessory 1', 'Accessory 2', 'Accessory 3', 'Accessory 4', 'Watch'],
  // 'BOTTOM': ['Bottom', 'Pants'],
  // 'SHOES': ['Shoes', 'High Top'],
  // 'FACE': ['Face']
};

const getTraitValue = (metadata: NFTMetadata, traitType: string): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  // For skin, we want to extract "Light" from "Light Skin - Light"
  if (traitType.toLowerCase() === 'skin') {
    const skinTrait = metadata.raw.metadata.attributes.find(attr => 
      attr.trait_type?.toLowerCase() === 'skin'
    );
    
    if (!skinTrait) {
      console.log('No skin trait found');
      return null;
    }

    console.log('Found skin trait:', skinTrait);
    
    // Parse "Light Skin - Light" to get just "Light"
    const valueStr = skinTrait.value.toString();
    const parts = valueStr.split(' - ');
    if (parts.length > 1) {
      return parts[1]; // Returns "Light" from "Light Skin - Light"
    }
    
    // If no dash, try to get the first word
    const firstWord = valueStr.split(' ')[0];
    return firstWord.toLowerCase();
  }

  return null;
};

// Add an error handler for images
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, src: string) => {
  console.error(`Failed to load image: ${src}`);
  console.error(e);
};

export const Canvas = ({ metadata }: { metadata: NFTMetadata }) => {
  const [layers, setLayers] = useState<LayerImage[]>([]);
  const { bubbleText, isTyping, typingDuration, isLooping, backgroundColor } = useAnimationStore();

  useEffect(() => {
    const loadLayers = async () => {
      if (!metadata) {
        console.log('No metadata available yet');
        return;
      }

      try {
        console.log('Loading skin layers...');
        const skinTone = getTraitValue(metadata, 'skin');
        console.log('Extracted skin tone:', skinTone);

        if (!skinTone) {
          console.error('Could not determine skin tone');
          return;
        }

        const skinMapping = await fetch('/Assets/traits/metadata/base_skin_mapping.json')
          .then(res => res.json());
        
        console.log('Loaded skin mapping:', skinMapping);
        console.log('Looking for skin tone:', skinTone);
        
        const basePaths = skinMapping[skinTone];
        if (!basePaths) {
          console.error(`No base paths found for skin tone: ${skinTone}`);
          return;
        }

        console.log('Found base paths:', basePaths);

        // Load just the skin layers for now
        const newLayers: LayerImage[] = [];
        let currentZIndex = 1;

        // Add base skin layers using the files array from the mapping
        const layerOrder = {
          'arm-left': 1,
          'body': 2,
          'arm-right': 3,  // arm-right above body
          'ear-left': 4,
          'head': 5,
          'face': 6,
          'ear-right': 7   // ear-right should be above head and face
        };

        Object.entries(basePaths).forEach(([part, filename]) => {
          const filePath = `/Assets/traits/base/${part}/${filename}`;
          console.log('Loading file:', filePath);
          
          newLayers.push({
            src: filePath,
            zIndex: layerOrder[part] || 1, // Use the defined order or default to 1
            alt: `base-${part}`
          });
        });

        // Sort layers by zIndex to ensure correct rendering order
        newLayers.sort((a, b) => a.zIndex - b.zIndex);

        console.log('Created layers:', newLayers);
        setLayers(newLayers);

      } catch (error) {
        console.error('Error loading layers:', error);
      }
    };

    loadLayers();
  }, [metadata]);

  return (
    <Container style={{ backgroundColor }}>
      {layers.map((layer, index) => (
        <Image
          key={`${layer.alt}-${index}`}
          src={layer.src}
          alt={layer.alt}
          width={828}
          height={828}
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: layer.zIndex,
            transformOrigin: 'center center'
          }}
          onError={(e) => {
            console.error(`Failed to load image: ${layer.src}`);
            console.error(e);
          }}
        />
      ))}
      <ChatBubble
        text={bubbleText}
        initialPosition={{ x: 300, y: 200 }}
        containerWidth={828}
        containerHeight={828}
        isTyping={isTyping}
        typingSpeed={typingDuration * 1000}
        loop={isLooping}
      />
    </Container>
  );
}; 