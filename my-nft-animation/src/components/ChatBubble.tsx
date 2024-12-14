'use client';

import { useState, useRef, useEffect } from 'react';
import { keyframes, css } from '@emotion/react';
import styled from '@emotion/styled';

interface ChatBubbleProps {
  text: string;
  initialPosition?: { x: number; y: number };
  containerWidth?: number;
  containerHeight?: number;
  isTyping?: boolean;
  typingSpeed?: number;
  loop?: boolean;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95) }
  to { opacity: 1; transform: scale(1) }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const slideIn = keyframes`
  from { 
    width: 0;
    opacity: 0.8;
  }
  to { 
    width: 100%;
    opacity: 1;
  }
`;

const BubbleContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  z-index: 100;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s ease;
  touch-action: none;

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
`;

const ChatBubbleWrapper = styled.div`
  background-color: white;
  border: 2px solid #000000;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-width: 60px;
  width: 235px;
  animation: ${css`${fadeIn} 0.2s ease-out forwards`};

  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 24px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-right: 2px solid #000000;
    border-bottom: 2px solid #000000;
    transform: rotate(45deg);
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }

  &.chat-bubble-wrapper {
    will-change: transform, opacity;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
`;

const TextWrapper = styled.div`
  overflow: hidden;
  white-space: pre-wrap;
  max-width: 100%;
  font-weight: 600;
`;

const Text = styled.p`
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.4;
  color: #000000;
  word-wrap: break-word;
  letter-spacing: -0.01em;
  font-weight: 600;
`;

export const ChatBubble = ({
  text,
  initialPosition = { x: (828 - 235) / 2, y: 200 },
  containerWidth = 828,
  containerHeight = 828,
  isTyping = false,
  typingSpeed = 3000,
  loop = true
}: ChatBubbleProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [visibleText, setVisibleText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!text) return;
    
    setIsAnimating(true);

    if (loop) {
      const startAnimation = () => {
        setVisibleText('');
        let currentIndex = 0;
        
        const typeNextChar = () => {
          if (currentIndex < text.length) {
            setVisibleText(prev => text.slice(0, currentIndex + 1));
            currentIndex++;
            animationTimeoutRef.current = setTimeout(typeNextChar, typingSpeed / text.length);
          } else {
            setTimeout(() => {
              setVisibleText('');
              startAnimation();
            }, 1000);
          }
        };

        typeNextChar();
      };

      startAnimation();
      return () => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    } else {
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setVisibleText(text.slice(0, currentIndex + 1));
          currentIndex++;
          animationTimeoutRef.current = setTimeout(typeNextChar, typingSpeed / text.length);
        }
      };
      typeNextChar();
    }
  }, [text, typingSpeed, loop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const bubbleWidth = bubbleRef.current?.offsetWidth || 0;
    const bubbleHeight = bubbleRef.current?.offsetHeight || 0;

    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    const padding = 10;
    newX = Math.max(
      -padding,
      Math.min(newX, containerWidth - bubbleWidth + padding)
    );
    newY = Math.max(
      -padding,
      Math.min(newY, containerHeight - bubbleHeight + padding)
    );

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <BubbleContainer
      ref={bubbleRef}
      x={position.x}
      y={position.y}
      onMouseDown={handleMouseDown}
    >
      <ChatBubbleWrapper className="chat-bubble-wrapper">
        <TextWrapper>
          <Text>
            {visibleText}
          </Text>
        </TextWrapper>
      </ChatBubbleWrapper>
    </BubbleContainer>
  );
};
