'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from "@account-kit/react";
import { useThemeStore } from '@/store/themeStore';
import { useAnimationStore } from '@/store/animationStore';
import { Alchemy, Network } from 'alchemy-sdk';
import styled from '@emotion/styled';

interface ControlsProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

// Add interfaces for styled components props
interface StyledProps {
  isDark: boolean;
}

const NoAccessMessage = styled.div<StyledProps>`
  padding: 20px;
  border-radius: 12px;
  background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  color: ${props => props.isDark ? '#E5E7EB' : '#4b5563'};
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
`;

const CONTRACT_ADDRESS = '0x05aA491820662b131d285757E5DA4b74BD0F0e5F';

const Label = styled.div<StyledProps>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isDark ? '#E5E7EB' : '#4b5563'};
  margin-bottom: 6px;
`;

const Input = styled.input<StyledProps>`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  color: ${props => props.isDark ? '#E5E7EB' : 'inherit'};
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};

  &:focus {
    outline: none;
    background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    border-color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  }
`;

const InputContainer = styled.div`
  margin-top: 16px;
`;

const InputLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const DurationInput = styled.input`
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  text-align: right;
  background: #f9fafb;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    background: white;
  }
`;

export const Controls = ({ containerRef }: ControlsProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUser();
  const { isDarkMode } = useThemeStore();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { 
    bubbleText, 
    setBubbleText, 
    isTyping, 
    setIsTyping, 
    typingDuration, 
    setTypingDuration,
    isLooping,
    setIsLooping,
    backgroundColor,
    setBackgroundColor
  } = useAnimationStore();

  useEffect(() => {
    const checkNFTOwnership = async () => {
      if (!user?.address) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const settings = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
          network: Network.SHAPE_MAINNET,
        };
        const alchemy = new Alchemy(settings);
        
        const nfts = await alchemy.nft.getNftsForOwner(user.address, {
          contractAddresses: [CONTRACT_ADDRESS],
        });

        setHasAccess(nfts.totalCount > 0);
      } catch (error) {
        console.error('Error checking NFT ownership:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkNFTOwnership();
  }, [user?.address]);

  if (isLoading) {
    return (
      <NoAccessMessage isDark={isDarkMode}>
        Checking access...
      </NoAccessMessage>
    );
  }

  if (!user?.address) {
    return (
      <NoAccessMessage isDark={isDarkMode}>
        Please connect your wallet to access controls
      </NoAccessMessage>
    );
  }

  if (!hasAccess) {
    return (
      <NoAccessMessage isDark={isDarkMode}>
        You need to own at least one NFT from the collection to access these controls.
        <br />
        <a 
          href="https://highlight.xyz/mint/shape:0x05aA491820662b131d285757E5DA4b74BD0F0e5F:31b18ae4b8b0b0be466ec33560d51935"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#6366f1', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}
        >
          Mint NFT to Get Access
        </a>
      </NoAccessMessage>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setBubbleText(newText);
    setIsTyping(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!isLooping) {
      timeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, typingDuration * 1000);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, Math.min(10, Number(e.target.value)));
    setTypingDuration(value);
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div>
        <Label isDark={isDarkMode}>Chat Bubble Text:</Label>
        <Input
          isDark={isDarkMode}
          value={bubbleText}
          onChange={handleTextChange}
          placeholder="Enter text..."
        />
      </div>

      <div>
        <Label isDark={isDarkMode}>Background Color:</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <Input
            isDark={isDarkMode}
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            placeholder="#ffffff"
          />
        </div>
      </div>

      <InputContainer>
        <InputLabel>
          <span>Animation Duration (seconds)</span>
        </InputLabel>
        <DurationInput
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={typingDuration}
          onChange={handleDurationChange}
        />
      </InputContainer>
      <InputContainer>
        <InputLabel>
          <span>Loop Animation</span>
          <input
            type="checkbox"
            checked={isLooping}
            onChange={() => setIsLooping(!isLooping)}
            style={{ cursor: 'pointer' }}
          />
        </InputLabel>
      </InputContainer>
    </div>
  );
}; 