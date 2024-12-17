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
  | 'accessory-1'    // Add accessory-1
  | 'hair-hat-front' 
  | 'ear-right';

// Update the layerOrder object to put accessory-2 above accessory-1
const layerOrder: Record<LayerKey, number> = {
  'arm-left': 1,      // Left arm at the back
  'sleeve-left': 2,   // Left sleeve just in front of left arm, but behind torso
  'body': 3,          // Body comes next
  'bottom': 4,
  'shoes': 4,         // Same level as bottom
  'torso': 5,         // Torso above everything so far
  'arm-right': 6,     // Right arm between torso and right sleeve
  'sleeve-right': 7,  // Right sleeve above right arm
  'accessory-4': 8,   // Accessory-4 above right sleeve
  'ear-left': 9,
  'hair-hat-back': 10,
  'head': 11,
  'beard': 11,        // Same level as head
  'face': 12,
  'accessory-1': 13,  // Glasses below accessory-2
  'hair-hat-front': 14,
  'ear-right': 15,
  'accessory-2': 16   // Accessory-2 at the very top
};

// Add a function to get accessory values
const getAccessoryValue = (metadata: NFTMetadata, accessoryNumber: number): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log(`No attributes found in metadata for accessory-${accessoryNumber}`);
    return null;
  }

  const accessoryTrait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === `accessory ${accessoryNumber}`
  );

  if (!accessoryTrait) {
    console.log(`No accessory-${accessoryNumber} trait found`);
    return null;
  }

  console.log(`Found accessory-${accessoryNumber} trait:`, accessoryTrait);
  return accessoryTrait.value.toString();
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

// Add getAccessory2Value function
const getAccessory2Value = (metadata: NFTMetadata): string | null => {
  if (!metadata?.raw?.metadata?.attributes) {
    console.log('No attributes found in metadata');
    return null;
  }

  const accessory2Trait = metadata.raw.metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'accessory 2'
  );

  if (!accessory2Trait) {
    console.log('No accessory 2 trait found');
    return null;
  }

  console.log('Found accessory 2 trait:', accessory2Trait);
  return accessory2Trait.value.toString();
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
        const accessory4Value = getAccessoryValue(metadata, 'Accessory 4');
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
              alt: `accessory-4-${id}`
            });
          }
        }

        // Load hair/hat metadata
        const hairHatValue = getHairHatValue(metadata);

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
            
            hairHatEntry = Object.entries(hairHatMetadata).find(([_, data]) => 
              (data as any).name === baseName
            );
          }

          if (hairHatEntry) {
            const [_, data] = hairHatEntry;
            const files = (data as any).files as TraitFile[];
            
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
              }
            } else {
              // Single file case - place in front of head
              const hairHatLayer = {
                src: `/Assets/traits/hair-hat/${files[0]}`,
                zIndex: layerOrder['hair-hat-front'], // Changed from 'hair-hat-back' to 'hair-hat-front'
                alt: `Hair/Hat - ${hairHatValue}`
              };
              newLayers.push(hairHatLayer);
            }
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
        const accessory2Value = getAccessory2Value(metadata);

        if (accessory2Value) {
          const accessory2Metadata = await fetch('/Assets/traits/metadata/accessory-2_metadata.json')
            .then(res => res.json());
          
          // Find the matching accessory-2 entry
          const accessory2Entry = Object.entries(accessory2Metadata).find(([_, data]) => 
            (data as any).name === accessory2Value
          );

          if (accessory2Entry) {
            const [_, data] = accessory2Entry;
            const file = (data as any).files[0];
            
            // Determine if it's a beard (check if name starts with "Beard")
            const isBeard = accessory2Value.toLowerCase().startsWith('beard');
            
            // Add accessory-2 layer with appropriate z-index
            const accessory2Layer = {
              src: `/Assets/traits/accessory-2/${file}`,
              zIndex: isBeard ? layerOrder['beard'] : layerOrder['accessory-2'],
              alt: `Accessory 2 - ${accessory2Value}`
            };
            newLayers.push(accessory2Layer);
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
          
          // Find the matching accessory-1 entry
          const accessory1Entry = Object.entries(accessory1Metadata).find(([_, data]) => 
            (data as any).name === accessory1Value
          );

          if (accessory1Entry) {
            const [_, data] = accessory1Entry;
            const file = (data as any).files[0];
            
            // Add accessory-1 layer using the correct file name
            const accessory1Layer = {
              src: `/Assets/traits/accessory-1/${file}`,
              zIndex: layerOrder['accessory-1'],
              alt: `Accessory 1 - ${accessory1Value}`
            };
            newLayers.push(accessory1Layer);
            console.log('Added accessory-1 layer:', accessory1Layer);
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
      ctx.clearRect(0, 0, 828, 828);
      
      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, 828, 828);
      
      // Draw all layers in sorted order
      loadedImages.forEach((img, index) => {
        const layer = layers[index];
        if (layer) {
          ctx.save();
          
          // Apply wave animation if needed
          if (isWaving && (
            layer.alt?.toLowerCase().includes('sleeve-left') ||
            layer.alt?.toLowerCase().includes('arm-left') ||
            layer.alt?.toLowerCase().includes('top sleeve left')
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