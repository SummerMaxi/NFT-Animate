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
  'HAIR-HAT': ['Hair', 'Hat'],
  // Comment out other mappings for now
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

// Update the layerOrder object to include bottom
const layerOrder = {
  'arm-left': 1,
  'body': 2,
  'bottom': 3,     // Add bottom layer before arm-right
  'arm-right': 4,
  'sleeve-left': 5,
  'torso': 5,
  'sleeve-right': 5,
  'accessory-4': 6,
  'ear-left': 7,
  'hair-hat-back': 8,
  'head': 9,
  'face': 10,
  'hair-hat-front': 11,
  'ear-right': 12
};

// Add this helper function to get accessory values
const getAccessoryValue = (metadata: NFTMetadata, accessoryType: string) => {
  return metadata?.raw?.metadata?.attributes?.find(
    attr => attr.trait_type.toLowerCase() === accessoryType.toLowerCase()
  )?.value;
};

// Update getHairHatValue function
const getHairHatValue = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const hairHatTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'hair/hat'
  );

  if (!hairHatTrait) {
    console.log('No hair/hat trait found');
    return null;
  }

  console.log('Found hair/hat trait:', hairHatTrait);
  return hairHatTrait.value.toString();
};

// Add getTopValue function
const getTopValue = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const topTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'top'
  );

  if (!topTrait) {
    console.log('No top trait found');
    return null;
  }

  console.log('Found top trait:', topTrait);
  return topTrait.value.toString();
};

// Add getBottomValue function
const getBottomValue = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const bottomTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'bottom'
  );

  if (!bottomTrait) {
    console.log('No bottom trait found');
    return null;
  }

  console.log('Found bottom trait:', bottomTrait);
  return bottomTrait.value.toString();
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
        Object.entries(basePaths).forEach(([part, filename]) => {
          const filePath = `/Assets/traits/base/${part}/${filename}`;
          console.log('Loading file:', filePath);
          
          newLayers.push({
            src: filePath,
            zIndex: layerOrder[part] || 1, // Use the defined order or default to 1
            alt: `base-${part}`
          });
        });

        // Load accessory-4 metadata
        const accessory4Value = getAccessoryValue(metadata, 'Accessory 4');
        if (accessory4Value) {
          console.log('Loading accessory-4:', accessory4Value);
          
          const accessory4Metadata = await fetch('/Assets/traits/metadata/accessory-4_metadata.json')
            .then(res => res.json());
          
          // Find the matching accessory by name
          const accessoryEntry = Object.entries(accessory4Metadata)
            .find(([_, data]) => (data as any).name === accessory4Value);
          
          if (accessoryEntry) {
            const [id, data] = accessoryEntry;
            const filePath = `/Assets/traits/accessory-4/${(data as any).files[0]}`;
            console.log('Loading accessory-4 file:', filePath);
            
            newLayers.push({
              src: filePath,
              zIndex: layerOrder['accessory-4'],
              alt: `accessory-4-${id}`
            });
          }
        }

        // Load hair/hat metadata
        console.log('Loading hair/hat layers...');
        const hairHatValue = getHairHatValue(metadata);
        console.log('Hair/Hat value:', hairHatValue);

        if (hairHatValue) {
          const hairHatMetadata = await fetch('/Assets/traits/metadata/hair-hat_metadata.json')
            .then(res => res.json());
          
          // Find the matching hair/hat entry by exact name match first
          let hairHatEntry = Object.entries(hairHatMetadata).find(([_, data]) => 
            (data as any).name === hairHatValue
          );

          // If no exact match, then try with base name
          if (!hairHatEntry) {
            const baseName = hairHatValue.split(' - ')[0];
            console.log('No exact match, looking for hair/hat with base name:', baseName);
            
            hairHatEntry = Object.entries(hairHatMetadata).find(([_, data]) => 
              (data as any).name === baseName
            );
          }

          if (hairHatEntry) {
            const [_, data] = hairHatEntry;
            const files = (data as any).files;
            
            // If there are multiple files, load them in different positions
            if (files.length > 1) {
              // Add the back layer (-1 file)
              const backFile = files.find(f => f.includes('-1'));
              if (backFile) {
                const backLayer = {
                  src: `/Assets/traits/hair-hat/${backFile}`,
                  zIndex: layerOrder['hair-hat-back'],
                  alt: `Hair/Hat Back - ${hairHatValue}`
                };
                newLayers.push(backLayer);
                console.log('Added hair/hat back layer:', backLayer);
              }

              // Add the front layer (-2 file)
              const frontFile = files.find(f => f.includes('-2'));
              if (frontFile) {
                const frontLayer = {
                  src: `/Assets/traits/hair-hat/${frontFile}`,
                  zIndex: layerOrder['hair-hat-front'],
                  alt: `Hair/Hat Front - ${hairHatValue}`
                };
                newLayers.push(frontLayer);
                console.log('Added hair/hat front layer:', frontLayer);
              }
            } else {
              // Single file case - place in front of head
              const hairHatLayer = {
                src: `/Assets/traits/hair-hat/${files[0]}`,
                zIndex: layerOrder['hair-hat-front'], // Changed from 'hair-hat-back' to 'hair-hat-front'
                alt: `Hair/Hat - ${hairHatValue}`
              };
              newLayers.push(hairHatLayer);
              console.log('Added hair/hat layer:', hairHatLayer);
            }
          } else {
            console.log('No matching hair/hat found for:', hairHatValue);
          }
        }

        // Load top metadata and layers
        console.log('Loading top layers...');
        const topValue = getTopValue(metadata);
        console.log('Top value:', topValue);

        if (topValue) {
          const topMetadata = await fetch('/Assets/traits/metadata/top_metadata.json')
            .then(res => res.json());
          
          // Find the matching top entry
          const topEntry = Object.entries(topMetadata).find(([_, data]) => 
            (data as any).name === topValue
          );

          if (topEntry) {
            const [_, data] = topEntry;
            const files = (data as any).files;
            
            // Add sleeve-left layer
            const sleeveLeftLayer = {
              src: `/Assets/traits/${files[0]}`,
              zIndex: layerOrder['sleeve-left'],
              alt: `Top Sleeve Left - ${topValue}`
            };
            newLayers.push(sleeveLeftLayer);
            console.log('Added sleeve-left layer:', sleeveLeftLayer);

            // Add torso layer
            const torsoLayer = {
              src: `/Assets/traits/${files[1]}`,
              zIndex: layerOrder['torso'],
              alt: `Top Torso - ${topValue}`
            };
            newLayers.push(torsoLayer);
            console.log('Added torso layer:', torsoLayer);

            // Add sleeve-right layer
            const sleeveRightLayer = {
              src: `/Assets/traits/${files[2]}`,
              zIndex: layerOrder['sleeve-right'],
              alt: `Top Sleeve Right - ${topValue}`
            };
            newLayers.push(sleeveRightLayer);
            console.log('Added sleeve-right layer:', sleeveRightLayer);
          } else {
            console.log('No matching top found for:', topValue);
          }
        }

        // Load bottom metadata and layer
        console.log('Loading bottom layer...');
        const bottomValue = getBottomValue(metadata);
        console.log('Bottom value:', bottomValue);

        if (bottomValue) {
          const bottomMetadata = await fetch('/Assets/traits/metadata/bottom_metadata.json')
            .then(res => res.json());
          
          // Find the matching bottom entry
          const bottomEntry = Object.entries(bottomMetadata).find(([_, data]) => 
            (data as any).name === bottomValue
          );

          if (bottomEntry) {
            const [_, data] = bottomEntry;
            const file = (data as any).files[0];
            
            // Add bottom layer
            const bottomLayer = {
              src: `/Assets/traits/bottom/${file}`,
              zIndex: layerOrder['bottom'],
              alt: `Bottom - ${bottomValue}`
            };
            newLayers.push(bottomLayer);
            console.log('Added bottom layer:', bottomLayer);
          } else {
            console.log('No matching bottom found for:', bottomValue);
          }
        }

        // Sort layers by zIndex to ensure correct rendering order
        newLayers.sort((a, b) => a.zIndex - b.zIndex);
        console.log('Final layers:', newLayers);
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