'use client';

import { useEffect, useState, RefObject, useRef } from 'react';
import styled from '@emotion/styled';
import { ChatBubble } from './ChatBubble';
import { useAnimationStore } from '../store/animationStore';
import { LAYER_STRUCTURE } from '../constants/layerStructure';
import type { NFTMetadata } from '../types/nft';
import { keyframes, css } from '@emotion/react';

const Container = styled.div`
  position: relative;
  width: 828px;
  height: 828px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: visible;
  transform: translateZ(0);
  backfaceVisibility: hidden;
  perspective: 1000;
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
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

// Define a type for the valid layer keys
type LayerKey = 
  | 'arm-left' 
  | 'body' 
  | 'bottom' 
  | 'shoes' 
  | 'arm-right' 
  | 'sleeve-left' 
  | 'torso' 
  | 'sleeve-right' 
  | 'accessory-4' 
  | 'ear-left' 
  | 'hair-hat-back' 
  | 'head' 
  | 'beard' 
  | 'face' 
  | 'accessory-2'
  | 'accessory-1'
  | 'hair-hat-front' 
  | 'ear-right'
  | 'accessory-3-back'    // Behind torso (-1 file)
  | 'accessory-3-middle'  // Between torso and arm (-2 file)
  | 'accessory-3-front';  // In front of arm (-3 file)

// Update the layerOrder object to put accessory-2 above accessory-1
const layerOrder: Record<LayerKey, number> = {
  'arm-left': 1,      // Left arm at the back
  'sleeve-left': 2,   // Left sleeve just in front of left arm
  'accessory-3-middle': 3,  // Second file (-2) between left arm and body
  'accessory-3-back': 4,    // First file (-1) behind body
  'body': 5,          // Body comes next
  'bottom': 5,        // Same level as body
  'shoes': 5,         // Same level as body
  'torso': 6,         // Torso above body
  'accessory-3-front': 7,   // Third file (-3) in front of torso
  'arm-right': 8,     // Right arm
  'sleeve-right': 9,  // Right sleeve
  'accessory-4': 10,  // Accessory-4 above sleeve
  'ear-left': 11,
  'hair-hat-back': 12,
  'head': 13,
  'beard': 13,
  'face': 14,
  'accessory-1': 15,
  'hair-hat-front': 16,
  'ear-right': 17,
  'accessory-2': 18
};

// Update the getAccessoryValue function with better logging
const getAccessoryValue = (metadata: NFTMetadata, accessoryNumber: number): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log(`No attributes found in metadata for accessory-${accessoryNumber}`);
    return null;
  }

  // Log all attributes to see what we're working with
  console.log(`All attributes for accessory-${accessoryNumber}:`, metadata.raw.metadata.attributes);

  // Try different possible formats of the trait type
  const accessoryTrait = metadata.raw.metadata.attributes.find(attr => {
    const traitType = attr.trait_type?.toLowerCase();
    return traitType === `accessory ${accessoryNumber}` || 
           traitType === `accessory-${accessoryNumber}` ||
           traitType === `accessory${accessoryNumber}`;
  });

  if (!accessoryTrait) {
    console.log(`No accessory-${accessoryNumber} trait found. Looking for:`, [
      `accessory ${accessoryNumber}`,
      `accessory-${accessoryNumber}`,
      `accessory${accessoryNumber}`
    ]);
    return null;
  }

  console.log(`Found accessory-${accessoryNumber} trait:`, accessoryTrait);
  return accessoryTrait.value.toString();
};

// Update getHairHatValue function to handle both "Hair/Hat" and "hair-hat" trait types
const getHairHatValue = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const hairHatTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'hair/hat' || 
    attr.trait_type?.toLowerCase() === 'hair-hat'
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

// Update getAccessory2Value to handle multiple Accessory 2 traits
const getAccessory2Value = (metadata: NFTMetadata): string[] | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  // Find all Accessory 2 traits
  const accessory2Traits = metadata.raw.metadata.attributes.filter(attr => 
    attr.trait_type?.toLowerCase() === 'accessory 2'
  );

  if (!accessory2Traits.length) {
    console.log('No accessory 2 traits found');
    return null;
  }

  console.log('Found accessory 2 traits:', accessory2Traits);
  return accessory2Traits.map(trait => trait.value.toString());
};

// Add getShoesValue function
const getShoesValue = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const shoesTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'shoes'
  );

  if (!shoesTrait) {
    console.log('No shoes trait found');
    return null;
  }

  console.log('Found shoes trait:', shoesTrait);
  return shoesTrait.value.toString();
};

// Update keyframes for sharp wave motion with shake
const waveKeyframes = keyframes`
  0% { 
    transform: rotate(0deg); 
  }
  15% { 
    transform: rotate(-20deg);
  }
  20% { 
    transform: rotate(-18deg);
  }
  25% { 
    transform: rotate(-22deg);
  }
  30% { 
    transform: rotate(-18deg);
  }
  35% { 
    transform: rotate(-22deg);
  }
  40% { 
    transform: rotate(-20deg);
  }
  65%, 100% { 
    transform: rotate(0deg);
  }
`;

// Update AnimatedImage with adjusted animation timing
const AnimatedImage = styled('img')<{ $isWaving: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation: ${props => props.$isWaving 
    ? css`${waveKeyframes} 2s cubic-bezier(0.4, 0, 0.2, 1) infinite` 
    : 'none'};
  transform-origin: 50% 50%;
`;

interface CanvasProps {
  metadata: NFTMetadata | null;
  isWaving: boolean;
  containerRef: RefObject<HTMLDivElement>;
}

// Add type for files array
type TraitFile = string;

// First, add a helper function to check if an accessory is a mask
const isMask = (accessoryName: string): boolean => {
  return accessoryName.toLowerCase().includes('mask');
};

// Update helper function to check only for Hat Helmet 1 and 2
const isFullHeadwear = (hairHatValue: string): boolean => {
  const value = hairHatValue.toLowerCase();
  return value.includes('hat helmet 1') || value.includes('hat helmet 2');
};

// Add helper to check if an accessory is a backpack
const isBackpack = (accessoryName: string): boolean => {
  return accessoryName.toLowerCase().includes('bag backpack');
};

// Update helper to check if an accessory is any type of bag
const isBag = (accessoryName: string): boolean => {
  const name = accessoryName.toLowerCase();
  return name.includes('bag backpack') || 
         name.includes('bag purse') || 
         name.includes('bag fanny');
};

// Helper to determine bag type
const getBagType = (accessoryName: string): 'backpack' | 'purse' | 'fanny' => {
  const name = accessoryName.toLowerCase();
  if (name.includes('backpack')) return 'backpack';
  if (name.includes('purse')) return 'purse';
  if (name.includes('fanny')) return 'fanny';
  return 'purse'; // default case
};

// Helper function to check if something is a pen
const isPen = (input: string | LayerImage): boolean => {
  if (typeof input === 'string') {
    // Handle string input (accessoryName)
    return input.toLowerCase().includes('pen 1');
  } else {
    // Handle LayerImage input
    const isPenLayer = input.alt?.toLowerCase().includes('accessory-4') && 
                      input.alt?.toLowerCase().includes('pen 1');
    console.log('Layer check:', {
      alt: input.alt,
      isPen: isPenLayer
    });
    return isPenLayer;
  }
};

export const Canvas = ({ metadata, isWaving, containerRef }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  if (!metadata) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select an NFT to view</p>
      </div>
    );
  }

  const [layers, setLayers] = useState<LayerImage[]>([]);
  const { bubbleText, isTyping, typingDuration, isLooping, backgroundColor } = useAnimationStore();

  // Add a ref to track if we're currently recording
  const isRecordingRef = useRef(false);

  // Add this to track previous text to prevent unnecessary updates
  const prevTextRef = useRef(bubbleText);

  useEffect(() => {
    // Skip text updates if recording is in progress
    if (isRecordingRef.current && prevTextRef.current !== bubbleText) {
      console.log('Skipping text update during recording');
      return;
    }
    prevTextRef.current = bubbleText;
    
    const loadLayers = async () => {
      if (!metadata) return;

      try {
        // Add this at the start of the function
        console.log('Full metadata:', metadata);
        console.log('Metadata attributes:', metadata.raw?.metadata?.attributes);

        const skinTone = getTraitValue(metadata, 'skin');
        if (!skinTone) return;

        const skinMapping = await fetch('/Assets/traits/metadata/base_skin_mapping.json')
          .then(res => res.json());
        
        const basePaths = skinMapping[skinTone];
        if (!basePaths) return;

        const newLayers: LayerImage[] = [];

        // Add base skin layers using the files array from the mapping
        Object.entries(basePaths).forEach(([part, filename]) => {
          const filePath = `/Assets/traits/base/${part}/${filename}`;
          newLayers.push({
            src: filePath,
            zIndex: layerOrder[part as LayerKey] || 1,
            alt: `base-${part}`
          });
        });

        // Load accessory-4 metadata
        const accessory4Value = getAccessoryValue(metadata, 4);
        if (accessory4Value) {
          const accessory4Metadata = await fetch('/Assets/traits/metadata/accessory-4_metadata.json')
            .then(res => res.json());
          
          // Find the matching accessory by name
          const accessoryEntry = Object.entries(accessory4Metadata)
            .find(([_, data]) => (data as any).name === accessory4Value);
          
          if (accessoryEntry) {
            const [id, data] = accessoryEntry;
            const filePath = `/Assets/traits/accessory-4/${(data as any).files[0]}`;
            
            newLayers.push({
              src: filePath,
              zIndex: layerOrder['accessory-4'],
              alt: `accessory-4-${accessory4Value}`
            });
          }
        }

        // Load hair/hat metadata
        const hairHatValue = getHairHatValue(metadata);
        console.log('Hair/Hat value:', hairHatValue); // Add debug logging

        if (hairHatValue) {
          const hairHatMetadata = await fetch('/Assets/traits/metadata/hair-hat_metadata.json')
            .then(res => res.json());
          
          console.log('Hair/Hat metadata:', hairHatMetadata); // Add debug logging
          
          // Find the matching hair/hat entry by exact name match
          let hairHatEntry = Object.entries(hairHatMetadata).find(([_, data]) => 
            (data as any).name === hairHatValue
          );

          // If no exact match found, try matching without color/variant
          if (!hairHatEntry) {
            const baseName = hairHatValue.split(' - ')[0];
            console.log('Trying base name match:', baseName); // Add debug logging
            
            hairHatEntry = Object.entries(hairHatMetadata).find(([_, data]) => 
              (data as any).name.startsWith(baseName)
            );
          }

          if (hairHatEntry) {
            const [_, data] = hairHatEntry;
            const files = (data as any).files as TraitFile[];
            const isFullCoverage = isFullHeadwear(hairHatValue);
            
            console.log('Found hair/hat entry:', hairHatEntry); // Add debug logging
            console.log('Files:', files); // Add debug logging
            console.log('Is full coverage:', isFullCoverage); // Add debug logging

            // If there are multiple files, load them in different positions
            if (files.length > 1) {
              // Add the back layer (-1 file)
              const backFile = files.find((f: string) => f.includes('-1'));
              if (backFile) {
                const backLayer = {
                  src: `/Assets/traits/hair-hat/${backFile}`,
                  zIndex: layerOrder['hair-hat-back'],
                  alt: `Hair/Hat Back - ${hairHatValue}`
                };
                newLayers.push(backLayer);
                console.log('Added back layer:', backLayer); // Add debug logging
              }

              // Add the front layer (-2 file)
              const frontFile = files.find((f: string) => f.includes('-2'));
              if (frontFile) {
                const frontLayer = {
                  src: `/Assets/traits/hair-hat/${frontFile}`,
                  zIndex: layerOrder['hair-hat-front'],
                  alt: `Hair/Hat Front - ${hairHatValue}`
                };
                newLayers.push(frontLayer);
                console.log('Added front layer:', frontLayer); // Add debug logging
              }
            } else if (files.length === 1) {
              // Single file case
              const hairHatLayer = {
                src: `/Assets/traits/hair-hat/${files[0]}`,
                zIndex: layerOrder['hair-hat-front'],
                alt: `Hair/Hat - ${hairHatValue}`
              };
              newLayers.push(hairHatLayer);
              console.log('Added single layer:', hairHatLayer); // Add debug logging
            }

            // Adjust ear-right z-index if it's a hat or helmet
            if (isFullCoverage) {
              const earRightLayer = newLayers.find(layer => layer.alt === 'base-ear-right');
              if (earRightLayer) {
                earRightLayer.zIndex = layerOrder['hair-hat-back'] - 1;
                console.log('Adjusted ear-right z-index:', earRightLayer); // Add debug logging
              }
            }
          } else {
            console.log('No matching hair/hat entry found for:', hairHatValue); // Add debug logging
          }
        }

        // Load top metadata and layers
        const topValue = getTopValue(metadata);

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
              alt: `sleeve-left-${topValue}`
            };
            newLayers.push(sleeveLeftLayer);

            // Add torso layer
            const torsoLayer = {
              src: `/Assets/traits/${files[1]}`,
              zIndex: layerOrder['torso'],
              alt: `Top Torso - ${topValue}`
            };
            newLayers.push(torsoLayer);

            // Add sleeve-right layer with specific alt text
            const sleeveRightLayer = {
              src: `/Assets/traits/${files[2]}`,
              zIndex: layerOrder['sleeve-right'],
              alt: `sleeve-right-${topValue}`, // Make sure we use consistent naming
            };
            newLayers.push(sleeveRightLayer);
          }
        }

        // Load bottom metadata and layer
        const bottomValue = getBottomValue(metadata);

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
          }
        }

        // Load accessory-2 metadata and layer
        const accessory2Values = getAccessory2Value(metadata);
        if (accessory2Values) {
          const accessory2Metadata = await fetch('/Assets/traits/metadata/accessory-2_metadata.json')
            .then(res => res.json());
          const accessory3Metadata = await fetch('/Assets/traits/metadata/accessory-3_metadata.json')
            .then(res => res.json());

          for (const accessory2Value of accessory2Values) {
            console.log('Processing accessory 2 value:', accessory2Value);
            
            // Check if it's a backpack
            if (isBackpack(accessory2Value)) {
              console.log('Found backpack:', accessory2Value);
              
              const backpackEntry = Object.entries(accessory3Metadata)
                .find(([_, data]) => (data as any).name === accessory2Value);

              if (backpackEntry) {
                const [_, data] = backpackEntry;
                const files = (data as any).files;
                console.log('Backpack files:', files);

                // Add middle layer (-2 file) between left arm and body
                const middleLayer = {
                  src: `/Assets/traits/accessory-3/${files[1]}`,
                  zIndex: layerOrder['accessory-3-middle'],
                  alt: `Accessory 3 Middle - ${accessory2Value}`
                };
                newLayers.push(middleLayer);
                console.log('Added backpack middle layer:', middleLayer);

                // Add back layer (-1 file) behind body
                const backLayer = {
                  src: `/Assets/traits/accessory-3/${files[0]}`,
                  zIndex: layerOrder['accessory-3-back'],
                  alt: `Accessory 3 Back - ${accessory2Value}`
                };
                newLayers.push(backLayer);
                console.log('Added backpack back layer:', backLayer);

                // Add front layer (-3 file) in front of torso
                const frontLayer = {
                  src: `/Assets/traits/accessory-3/${files[2]}`,
                  zIndex: layerOrder['accessory-3-front'],
                  alt: `Accessory 3 Front - ${accessory2Value}`
                };
                newLayers.push(frontLayer);
                console.log('Added backpack front layer:', frontLayer);
              }
            } else {
              // Handle regular accessory-2 items (masks, beards, etc.)
              const accessory2Entry = Object.entries(accessory2Metadata)
                .find(([_, data]) => (data as any).name === accessory2Value);

              if (accessory2Entry) {
                const [_, data] = accessory2Entry;
                const file = (data as any).files[0];
                
                const isMaskItem = isMask(accessory2Value);
                const isBeard = accessory2Value.toLowerCase().startsWith('beard');
                
                const accessory2Layer = {
                  src: `/Assets/traits/accessory-2/${file}`,
                  zIndex: isBeard ? layerOrder['beard'] : 
                         isMaskItem ? layerOrder['accessory-1'] - 1 : 
                         layerOrder['accessory-2'],
                  alt: `Accessory 2 - ${accessory2Value}`
                };
                newLayers.push(accessory2Layer);
              }
            }
          }
        }

        // Load shoes metadata and layer
        const shoesValue = getShoesValue(metadata);

        if (shoesValue) {
          const shoesMetadata = await fetch('/Assets/traits/metadata/shoes_metadata.json')
            .then(res => res.json());
          
          // Find the matching shoes entry
          const shoesEntry = Object.entries(shoesMetadata).find(([_, data]) => 
            (data as any).name === shoesValue
          );

          if (shoesEntry) {
            const [_, data] = shoesEntry;
            const file = (data as any).files[0];
            
            // Add shoes layer
            const shoesLayer = {
              src: `/Assets/traits/shoes/${file}`,
              zIndex: layerOrder['shoes'],
              alt: `Shoes - ${shoesValue}`
            };
            newLayers.push(shoesLayer);
          }
        }

        // Load accessory-1 (glasses)
        const accessory1Value = getAccessoryValue(metadata, 1);
        if (accessory1Value) {
          // Load the accessory-1 metadata file
          const accessory1Metadata = await fetch('/Assets/traits/metadata/accessory-1_metadata.json')
            .then(res => res.json());
          
          const accessory2Value = getAccessoryValue(metadata, 2);
          const isMaskPresent = accessory2Value && isMask(accessory2Value);
          
          const accessory1Entry = Object.entries(accessory1Metadata).find(([_, data]) => 
            (data as any).name === accessory1Value
          );

          if (accessory1Entry) {
            const [_, data] = accessory1Entry;
            const file = (data as any).files[0];
            
            const accessory1Layer = {
              src: `/Assets/traits/accessory-1/${file}`,
              // If accessory-2 is a mask, put accessory-1 above it
              zIndex: isMaskPresent ? layerOrder['accessory-2'] : layerOrder['accessory-1'],
              alt: `Accessory 1 - ${accessory1Value}`
            };
            newLayers.push(accessory1Layer);
            console.log('Added accessory-1 layer:', accessory1Layer);
          }
        }

        // Load accessory-3 metadata and layer
        const accessory3Value = getAccessoryValue(metadata, 3);
        if (accessory3Value) {
          const accessory3Metadata = await fetch('/Assets/traits/metadata/accessory-3_metadata.json')
            .then(res => res.json());
          
          const accessory3Entry = Object.entries(accessory3Metadata).find(([_, data]) => 
            (data as any).name === accessory3Value
          );

          if (accessory3Entry) {
            const [_, data] = accessory3Entry;
            const files = (data as any).files;
            
            // Check if it's a backpack (has multiple files)
            if (files.length === 3 && accessory3Value.toLowerCase().includes('backpack')) {
              // Add back layer (-1 file) behind torso
              const backLayer = {
                src: `/Assets/traits/accessory-3/${files[0]}`, // First file (-1)
                zIndex: layerOrder['accessory-3-back'],
                alt: `Accessory 3 Back - ${accessory3Value}`
              };
              newLayers.push(backLayer);

              // Add front layers (-2 and -3 files) in front of torso
              const frontLayers = files.slice(1).map((file: string, index: number) => ({
                src: `/Assets/traits/accessory-3/${file}`,
                zIndex: layerOrder['accessory-3-front'],
                alt: `Accessory 3 Front ${index + 1} - ${accessory3Value}`
              }));
              newLayers.push(...frontLayers);
            } else {
              // Handle non-backpack accessories (single layer)
              const accessory3Layer = {
                src: `/Assets/traits/accessory-3/${files[0]}`,
                zIndex: layerOrder['accessory-3-front'],
                alt: `Accessory 3 - ${accessory3Value}`
              };
              newLayers.push(accessory3Layer);
            }
          }
        }

        // Sort layers by zIndex
        newLayers.sort((a, b) => a.zIndex - b.zIndex);
        setLayers(newLayers);

      } catch (error) {
        console.error('Error loading layers:', error);
      }
    };

    loadLayers();
  }, [metadata]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const loadedImages: HTMLImageElement[] = [];
    let frameId: number;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        for (const layer of layers) {
          const img = await loadImage(layer.src);
          loadedImages.push(img);
        }
        startAnimation();
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    const renderFrame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, 828, 828);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, 828, 828);

      // Draw all layers in sorted order
      loadedImages.forEach((img, index) => {
        const layer = layers[index];
        if (layer) {
          ctx.save();
          
          // Enhanced debug logging
          console.log('Processing layer:', {
            alt: layer.alt,
            zIndex: layer.zIndex,
            isPen: isPen(layer),
            isWaving
          });
          
          // Apply wave animation if needed
          if (isWaving && (
            layer.alt?.toLowerCase().includes('sleeve-left') ||
            layer.alt?.toLowerCase().includes('arm-left') ||
            layer.alt?.toLowerCase().includes('top sleeve left') ||
            isPen(layer)
          )) {
            const time = Date.now() / 1000;
            
            // Base wave motion
            const baseAngle = Math.sin(time * 2) * 0.15;
            
            // Only apply shake when arm is raised (baseAngle is negative)
            const isRaised = baseAngle < 0;
            
            // Calculate shake and pause only when raised
            const shake = isRaised ? Math.sin(time * 20) * 0.02 : 0;
            const pauseFactor = isRaised ? Math.pow(Math.sin(time * 2), 2) : 0;
            
            // Combine movements - shake only affects upward motion
            const finalAngle = baseAngle + (shake * pauseFactor);
            
            // Log animation values
            console.log('Animation values:', {
              time,
              baseAngle,
              isRaised,
              shake,
              pauseFactor,
              finalAngle,
              layerType: isPen(layer) ? 'pen' : 'arm/sleeve'
            });

            // Apply transformation
            ctx.translate(414, 414);
            ctx.rotate(finalAngle);
            ctx.translate(-414, -414);
          }
          
          ctx.drawImage(img, 0, 0, 828, 828);
          ctx.restore();
        }
      });

      frameId = requestAnimationFrame(renderFrame);
    };

    const startAnimation = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      renderFrame();
    };

    loadAllImages();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [layers, isWaving, backgroundColor]);

  useEffect(() => {
    if (metadata) {
      const accessory1Value = getAccessoryValue(metadata, 1);
      console.log('Accessory 1 value from getter:', accessory1Value);
      console.log('Raw metadata attributes:', metadata.raw?.metadata?.attributes);
    }
  }, [metadata]);

  return (
    <Container style={{ backgroundColor }}>
      <div className="relative w-full h-full">
        <canvas ref={canvasRef} width={828} height={828} />
        <div className="absolute inset-0">
          <ChatBubble
            text={bubbleText}
            initialPosition={{ x: 300, y: 200 }}
            containerWidth={828}
            containerHeight={828}
            isTyping={isTyping}
            typingSpeed={typingDuration * 1000}
            loop={isLooping}
          />
        </div>
      </div>
    </Container>
  );
}; 