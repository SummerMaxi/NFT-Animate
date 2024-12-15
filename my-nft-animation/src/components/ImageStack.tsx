'use client';

import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { ChatBubble } from './ChatBubble';

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  50% { transform: rotate(1deg); }
  100% { transform: rotate(0deg); }
`;

const Container = styled.div`
  position: relative;
  width: 828px;
  height: 828px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: visible;
`;

const Image = styled.img<{ zIndex: number; isRotating?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${props => props.zIndex};
  animation: ${props => props.isRotating 
    ? css`${rotateAnimation} 0.4s infinite linear` 
    : 'none'};
  transform-origin: center center;
  will-change: transform;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
`;

const Label = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const InputContainer = styled.div`
  margin-top: 10px;
`;

const InputLabel = styled.div`
  font-size: 14px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const DurationInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  text-align: right;
`;

const ControlsContainer = styled.div`
  position: absolute;
  right: 100%;
  top: 0;
  margin-right: 20px;
  width: 200px;
`;

const images = [
  { id: 6, zIndex: 1, rotating: true },
  { id: 7, zIndex: 2 },
  { id: 8, zIndex: 3 },
  { id: 9, zIndex: 4 },
  { id: 10, zIndex: 5 },
  { id: 11, zIndex: 6 },
  { id: 12, zIndex: 7 },
];

export const ImageStack = () => {
  const [mounted, setMounted] = useState(false);
  const [bubbleText, setBubbleText] = useState("GM");
  const [isTyping, setIsTyping] = useState(false);
  const [typingDuration, setTypingDuration] = useState(2);
  const [isLooping, setIsLooping] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBubbleText(e.target.value);
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const timeoutDuration = typingDuration * 1000;
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, timeoutDuration);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, Math.min(10, Number(e.target.value)));
    setTypingDuration(value);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  // Separate component for controls
  const Controls = () => (
    <div className="space-y-4">
      <div>
        <Label>Chat Bubble Text:</Label>
        <Input
          value={bubbleText}
          onChange={handleTextChange}
          placeholder="Enter text..."
        />
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

  // Separate component for canvas content
  const CanvasContent = () => (
    <Container>
      {images.map(({ id, zIndex, rotating }) => (
        <Image
          key={id}
          src={`/Assets/Accessories/1%20(${id}).webp`}
          alt={`Image ${id}`}
          zIndex={zIndex}
          isRotating={rotating}
        />
      ))}
      <ChatBubble
        text={bubbleText}
        initialPosition={{ x: 20, y: 300 }}
        containerWidth={828}
        containerHeight={828}
        isTyping={isTyping}
        typingSpeed={typingDuration * 1000}
        loop={isLooping}
      />
    </Container>
  );

  // Return either Controls or CanvasContent based on where it's rendered
  return window.location.hash === '#controls' ? <Controls /> : <CanvasContent />;
}; 