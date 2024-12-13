'use client';

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
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
`;

const Image = styled.img<{ zIndex: number; isRotating?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${props => props.zIndex};
  animation: ${props => props.isRotating ? css`${rotateAnimation} 0.4s infinite ease-in-out` : 'none'};
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
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
    </Container>
  );
}; 