'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAnimationStore } from '../store/animationStore';
import { useUser } from "@account-kit/react";
import { parseUnits } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Alchemy, Network } from 'alchemy-sdk';
import { erc20ABI } from '@account-kit/infra';

const ENERGY_TOKEN_ADDRESS = '0x42276dF82BAb34c3CCcA9e5c058b6ff7EA4d07e3';
const RECIPIENT_ADDRESS = '0xc132224D1B8254dd104D8FB6d41F69DC671748A0';
const TOKEN_DECIMALS = 18; // Most ERC20 tokens use 18 decimals
const REQUIRED_AMOUNT = 50;
const ACCESS_STORAGE_KEY = `token-access-${ENERGY_TOKEN_ADDRESS}-${REQUIRED_AMOUNT}`;

const Button = styled.button`
  width: 100%;
  background: ${props => props.disabled 
    ? '#e5e7eb' 
    : 'linear-gradient(to right, #818cf8, #6366f1)'};
  color: ${props => props.disabled ? '#9ca3af' : 'white'};
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ScreenRecorder = ({ containerRef }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);
  const textAnimationRef = useRef<string>('');
  const user = useUser();
  
  // Contract write hook
  const { writeContract, data: hash } = useWriteContract();
  
  // Transaction receipt hook
  const { isLoading: isConfirming, isSuccess: isTransferred } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const [needsApproval, setNeedsApproval] = useState(true);
  
  // Check allowance
  const { data: allowance } = useReadContract({
    address: ENERGY_TOKEN_ADDRESS,
    abi: erc20ABI,
    functionName: 'allowance',
    args: user?.address ? [user.address, RECIPIENT_ADDRESS] : undefined,
    enabled: !!user?.address,
  });

  // Check transfer history when component mounts or user changes
  useEffect(() => {
    const checkTransferHistory = async () => {
      if (!user?.address) {
        setHasAccess(false);
        return;
      }
      
      setIsChecking(true);
      try {
        const alchemy = new Alchemy({
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
          network: Network.SHAPE_MAINNET,
        });

        // Get transaction receipt for the known transfer
        const txReceipt = await alchemy.core.getTransactionReceipt(
          "0x07ed39583db806583c2a8406dbd336ddf20ce5eac583390e29fdaa0367af8053"
        );

        // Verify the transaction
        const hasValidTransfer = txReceipt && 
          txReceipt.from.toLowerCase() === user.address.toLowerCase() &&
          txReceipt.to.toLowerCase() === ENERGY_TOKEN_ADDRESS.toLowerCase();

        setHasAccess(hasValidTransfer);
      } catch (error) {
        console.error('Error checking transfer history:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkTransferHistory();
  }, [user?.address]);

  // Reset pending state when transaction is confirmed
  useEffect(() => {
    if (isTransferred) {
      setHasAccess(true);
      setIsPending(false);
    } else if (!isConfirming) {
      setIsPending(false);
    }
  }, [isTransferred, isConfirming]);

  useEffect(() => {
    if (allowance && !hasAccess) {
      const requiredAmount = parseUnits(REQUIRED_AMOUNT.toString(), TOKEN_DECIMALS);
      setNeedsApproval(allowance < requiredAmount);
    }
  }, [allowance, hasAccess]);

  const handleTransfer = async () => {
    if (!user?.address) return;
    
    try {
      setIsPending(true);
      const amount = parseUnits(REQUIRED_AMOUNT.toString(), TOKEN_DECIMALS);

      if (needsApproval) {
        await writeContract({
          address: ENERGY_TOKEN_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [RECIPIENT_ADDRESS, amount]
        });
      }

      writeContract({
        address: ENERGY_TOKEN_ADDRESS,
        abi: erc20ABI,
        functionName: 'transfer',
        args: [RECIPIENT_ADDRESS, amount]
      });
    } catch (error) {
      console.error('Transfer error:', error);
      setIsPending(false);
    }
  };

  const handleClick = () => {
    if (!hasAccess && !isTransferred) {
      handleTransfer();
    } else if (isRecording) {
      cleanup();
    } else {
      startRecording();
    }
  };

  const renderToCanvas = () => {
    if (!containerRef.current || !canvasRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size and background
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    ctx.fillStyle = useAnimationStore.getState().backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images
    const images = containerRef.current.querySelectorAll('img');
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      ctx.drawImage(img, x, y, rect.width, rect.height);
    });

    // Draw chat bubble
    const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
    if (chatBubble instanceof HTMLElement) {
      const rect = chatBubble.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;

      ctx.save();

      // Create bubble path (including the tail)
      ctx.beginPath();
      
      // Main bubble rectangle with rounded corners
      const radius = 16;
      const width = rect.width;
      const height = rect.height;
      
      // Start from top-left and draw clockwise
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      
      // Draw to the tail start point
      ctx.lineTo(x + 44, y + height);
      
      // Draw the tail
      ctx.lineTo(x + 24, y + height + 20);
      ctx.lineTo(x + 24, y + height);
      
      // Complete the bubble
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      
      // Fill and stroke the entire path
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text with proper centering
      ctx.fillStyle = '#000000';
      ctx.font = '600 16px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textBaseline = 'middle';
      
      // Calculate text metrics for centering
      const fullText = useAnimationStore.getState().bubbleText;
      const currentText = textAnimationRef.current;
      const fullTextMetrics = ctx.measureText(fullText);
      const fullWidth = fullTextMetrics.width;
      
      // Calculate the starting X position as if the full text was centered
      const startX = x + (width - fullWidth) / 2;
      const textY = y + (height / 2);
      
      // Draw the current text starting from the left position
      ctx.fillText(currentText, startX, textY);

      ctx.restore();
    }
  };

  const startRecording = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const containerRect = containerRef.current.getBoundingClientRect();
      const size = containerRect.width;
      canvas.width = size;
      canvas.height = size;
      canvasRef.current = canvas;

      const { typingDuration, isLooping, bubbleText } = useAnimationStore.getState();
      const recordingDuration = isLooping ? typingDuration * 2000 : typingDuration * 1000;

      // Reset animation state
      textAnimationRef.current = '';
      let currentIndex = 0;
      const charInterval = typingDuration * 1000 / bubbleText.length;

      // Text animation function
      const animateText = () => {
        if (currentIndex <= bubbleText.length) {
          textAnimationRef.current = bubbleText.slice(0, currentIndex);
          currentIndex++;
          setTimeout(animateText, charInterval);
        } else if (isLooping) {
          currentIndex = 0;
          textAnimationRef.current = '';
          setTimeout(animateText, 500); // Delay before restarting loop
        }
      };

      // Start the text animation
      animateText();

      // Canvas animation loop
      const animate = () => {
        renderToCanvas();
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animate();

      const stream = canvas.captureStream(60);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        downloadRecording(blob);
        cleanup();
      };

      setIsRecording(true);
      mediaRecorder.start(20);

      setTimeout(() => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        mediaRecorder.stop();
        setIsRecording(false);
      }, recordingDuration);

    } catch (error) {
      console.error('Recording setup error:', error);
      cleanup();
    }
  }, [containerRef]);

  const downloadRecording = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanup = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (canvasRef.current) {
      canvasRef.current = null;
    }
    setIsRecording(false);
  };

  if (isChecking) {
    return (
      <div>
        <Button disabled>
          Checking Access...
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button 
        onClick={handleClick}
        disabled={isRecording || (!hasAccess && (isPending || isConfirming))}
      >
        {!hasAccess ? (
          isPending || isConfirming ? 'Confirming Transaction...' :
          needsApproval ? 'Approve Token Transfer' :
          'Transfer 50 Energy Tokens'
        ) : (
          isRecording ? 'Recording...' : 'Download Animation'
        )}
      </Button>
      {!hasAccess && !isPending && !isConfirming && (
        <p className="text-sm text-gray-500 mt-2">
          {needsApproval 
            ? 'Approval needed before transfer' 
            : 'Transfer 50 Energy tokens to enable downloads'}
        </p>
      )}
    </div>
  );
}; 