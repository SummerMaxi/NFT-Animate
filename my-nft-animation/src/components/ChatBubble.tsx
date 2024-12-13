'use client';

import { useState, useEffect, useRef } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

interface ChatBubbleProps {
  text?: string;
  minWidth?: number;
  maxWidth?: number;
  fontSize?: number;
  initialPosition?: { x: number; y: number };
  containerWidth?: number;
  containerHeight?: number;
  onTextLoop?: boolean;
  typingSpeed?: number;
  scale?: number;
}

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0 }
  to { opacity: 1 }
`;

const BubbleContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  z-index: 100;
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s;
  max-width: 100%;
  max-height: 100%;

  &:hover {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  &:active {
    cursor: grabbing;
  }
`;

const ChatBubbleSVG = styled.svg<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const TextContainer = styled.div<{ fontSize: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Roboto', sans-serif;
  font-size: ${props => props.fontSize}px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-align: center;
  padding: 0 10px;
  line-height: 1.2;
  width: calc(100% - 20px);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #000;
  margin-left: 2px;
  animation: ${blink} 0.7s infinite;
  vertical-align: middle;
`;

export const ChatBubble = ({
  text = "GM",
  minWidth = 80,
  maxWidth = 300,
  fontSize = 18,
  initialPosition = { x: 150, y: 300 },
  containerWidth = 400,
  containerHeight = 400,
  onTextLoop = true,
  typingSpeed = 150,
  scale = 1
}: ChatBubbleProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState("");
  const [dimensions, setDimensions] = useState({ width: minWidth, height: 60 });
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const words = text.trim().split(/\s+/);
  const fullText = words.join(' ');

  const typeText = () => {
    if (textRef.current < fullText.length) {
      setDisplayText(prev => fullText.substring(0, textRef.current + 1));
      textRef.current++;
      timeoutRef.current = setTimeout(typeText, typingSpeed);
    } else {
      setIsTypingComplete(true);
      if (onTextLoop) {
        timeoutRef.current = setTimeout(() => {
          textRef.current = 0;
          setDisplayText("");
          setIsTypingComplete(false);
          timeoutRef.current = setTimeout(typeText, typingSpeed);
        }, 1000);
      }
    }
  };

  const updateBubbleDimensions = () => {
    if (textContainerRef.current) {
      const textWidth = textContainerRef.current.scrollWidth;
      const textHeight = textContainerRef.current.scrollHeight;
      
      // Calculate bubble size based on text size and scale, but limit to container
      const maxAllowedWidth = containerWidth - 40; // Leave some padding
      const maxAllowedHeight = containerHeight - 40;
      
      const bubbleWidth = Math.min(
        Math.max(textWidth + (60 * scale), minWidth),
        Math.min(maxWidth, maxAllowedWidth)
      );
      const bubbleHeight = Math.max(
        Math.min(textHeight * 2 * scale, Math.min(100 * scale, maxAllowedHeight)),
        50 * scale
      );
      
      setDimensions({ 
        width: bubbleWidth + (fontSize * scale),
        height: bubbleHeight 
      });

      // Adjust position if bubble is outside bounds
      const newPosition = constrainPosition(position.x, position.y);
      if (newPosition.x !== position.x || newPosition.y !== position.y) {
        setPosition(newPosition);
      }
    }
  };

  const constrainPosition = (x: number, y: number) => {
    // Add padding to keep pointer inside canvas
    const padding = 20;
    x = Math.max(padding, Math.min(x, containerWidth - dimensions.width - padding));
    y = Math.max(padding, Math.min(y, containerHeight - dimensions.height - padding));
    return { x, y };
  };

  useEffect(() => {
    textRef.current = 0;
    setDisplayText("");
    setIsTypingComplete(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(typeText, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, typingSpeed]);

  useEffect(() => {
    updateBubbleDimensions();
  }, [displayText, scale, fontSize, containerWidth, containerHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const containerRect = bubbleRef.current?.parentElement?.getBoundingClientRect();
        if (containerRect) {
          const relativeX = newX - containerRect.left;
          const relativeY = newY - containerRect.top;
          const constrained = constrainPosition(relativeX, relativeY);
          setPosition(constrained);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, containerWidth, containerHeight, dimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  return (
    <BubbleContainer
      ref={bubbleRef}
      x={position.x}
      y={position.y}
      onMouseDown={handleMouseDown}
    >
      <ChatBubbleSVG 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <path
          d={`
            M10,0 
            h${dimensions.width - 20} 
            a10,10 0 0 1 10,10 
            v${dimensions.height - (25 * scale)} 
            a10,10 0 0 1 -10,10 
            h-${dimensions.width - 40} 
            l-${10 * scale},${15 * scale} 
            l-${10 * scale},-${15 * scale} 
            h-10 
            a10,10 0 0 1 -10,-10 
            v-${dimensions.height - (25 * scale)} 
            a10,10 0 0 1 10,-10 
            z
          `}
          fill="white"
          stroke="#ccc"
          strokeWidth="1"
        />
      </ChatBubbleSVG>
      <TextContainer ref={textContainerRef} fontSize={fontSize}>
        {displayText}{!isTypingComplete && <Cursor />}
      </TextContainer>
    </BubbleContainer>
  );
};
