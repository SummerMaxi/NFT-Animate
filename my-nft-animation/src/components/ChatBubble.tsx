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
    opacity: 0.5;
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
  border: 1px solid #E2E2E2;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  min-width: 60px;
  max-width: 280px;
  animation: ${css`${fadeIn} 0.2s ease-out forwards`};

  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 24px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-right: 1px solid #E2E2E2;
    border-bottom: 1px solid #E2E2E2;
    transform: rotate(45deg);
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }

  &.chat-bubble-wrapper {
    will-change: transform, opacity;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  &.recording {
    animation-play-state: running !important;
  }
`;

const TextWrapper = styled.div<{ isTyping: boolean; duration: number }>`
  overflow: hidden;
  white-space: nowrap;
  width: ${props => props.isTyping ? '0' : '100%'};
  animation: ${props => props.isTyping 
    ? css`${slideIn} ${props.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) forwards` 
    : 'none'};
  animation-iteration-count: ${props => props.isTyping ? 'infinite' : '1'};
  max-width: 100%;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #000;
  margin-left: 2px;
  animation: ${css`${blink} 0.7s infinite`};
  vertical-align: middle;
`;

const Text = styled.p`
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  font-size: 15px;
  line-height: 1.4;
  color: #000000;
  word-wrap: break-word;
  letter-spacing: -0.01em;
`;

export const ChatBubble = ({
  text,
  initialPosition = { x: 20, y: 20 },
  containerWidth = 400,
  containerHeight = 400,
  isTyping = false,
  typingSpeed = 3000,
  loop = true
}: ChatBubbleProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    setDisplayText(text);
    setIsAnimating(isTyping);

    if (isTyping && loop) {
      const startAnimation = () => {
        setIsAnimating(true);
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
          setTimeout(startAnimation, 500); // Brief pause between loops
        }, typingSpeed);
      };

      startAnimation();
      return () => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }
  }, [text, isTyping, typingSpeed, loop]);

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
        <TextWrapper 
          isTyping={isAnimating} 
          duration={typingSpeed / 1000}
          data-typing="true"
        >
          <Text>
            {displayText}
            {isTyping && <Cursor />}
          </Text>
        </TextWrapper>
      </ChatBubbleWrapper>
    </BubbleContainer>
  );
};
