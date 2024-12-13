'use client';

import { useState, useEffect } from 'react';
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
  width: 400px;
  height: 400px;
  border: 1px solid #ccc;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: visible;
`;

const ControlsContainer = styled.div`
  position: absolute;
  left: calc(100% + 20px);
  top: 0;
  width: 200px;
  padding: 15px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  margin-bottom: 10px;

  &:focus {
    outline: none;
    border-color: #6200ea;
    box-shadow: 0 0 0 2px rgba(98,0,234,0.1);
  }
`;

const Slider = styled.input`
  width: 100%;
  margin: 10px 0;
`;

const SpeedLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  color: #666;
  font-size: 14px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
`;

const Image = styled.img<{ zIndex: number; isRotating?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${props => props.zIndex};
  animation: ${props => props.isRotating ? css`${rotateAnimation} 0.4s infinite linear` : 'none'};
  transform-origin: center center;
  will-change: transform;
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
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [bubbleSize, setBubbleSize] = useState(20);
  const [bubbleScale, setBubbleScale] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
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
          minWidth={80 * bubbleScale}
          maxWidth={300 * bubbleScale}
          fontSize={bubbleSize}
          initialPosition={{ x: 20, y: 300 }}
          containerWidth={400}
          containerHeight={400}
          onTextLoop={true}
          typingSpeed={typingSpeed}
          scale={bubbleScale}
        />
      </Container>
      <ControlsContainer>
        <Label htmlFor="bubbleText">Chat Bubble Text:</Label>
        <Input
          id="bubbleText"
          type="text"
          value={bubbleText}
          onChange={(e) => setBubbleText(e.target.value)}
          placeholder="Enter text..."
        />
        <SpeedLabel>
          <span>Typing Speed:</span>
          <span>{typingSpeed}ms</span>
        </SpeedLabel>
        <Slider
          type="range"
          min="50"
          max="300"
          value={typingSpeed}
          onChange={(e) => setTypingSpeed(Number(e.target.value))}
        />
        <SpeedLabel>
          <span>Text Size:</span>
          <span>{bubbleSize}px</span>
        </SpeedLabel>
        <Slider
          type="range"
          min="12"
          max="32"
          value={bubbleSize}
          onChange={(e) => setBubbleSize(Number(e.target.value))}
        />
        <SpeedLabel>
          <span>Bubble Size:</span>
          <span>{Math.round(bubbleScale * 100)}%</span>
        </SpeedLabel>
        <Slider
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={bubbleScale}
          onChange={(e) => setBubbleScale(Number(e.target.value))}
        />
      </ControlsContainer>
    </div>
  );
}; 