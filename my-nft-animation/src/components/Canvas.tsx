'use client';

import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { ChatBubble } from './ChatBubble';
import { useAnimationStore } from '../store/animationStore';

const Container = styled.div`
  position: relative;
  width: 828px;
  height: 828px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: visible;
`;

const Image = styled.img<{ zIndex: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${props => props.zIndex};
  transform-origin: center center;
`;

const images = [
  { id: 6, zIndex: 1 },
  { id: 7, zIndex: 2 },
  { id: 8, zIndex: 3 },
  { id: 9, zIndex: 4 },
  { id: 10, zIndex: 5 },
  { id: 11, zIndex: 6 },
  { id: 12, zIndex: 7 },
];

export const Canvas = () => {
  const { bubbleText, isTyping, typingDuration, isLooping } = useAnimationStore();

  return (
    <Container>
      {images.map(({ id, zIndex }) => (
        <Image
          key={id}
          src={`/Assets/Accessories/1%20(${id}).webp`}
          alt={`Image ${id}`}
          zIndex={zIndex}
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
}; 