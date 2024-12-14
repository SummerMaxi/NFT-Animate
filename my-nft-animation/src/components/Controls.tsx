'use client';

import { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAnimationStore } from '../store/animationStore';
import { useThemeStore } from '../store/themeStore';

const Label = styled.div<{ isDark: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isDark ? '#E5E7EB' : '#4b5563'};
  margin-bottom: 6px;
`;

const Input = styled.input<{ isDark: boolean }>`
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

export const Controls = () => {
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
  const { isDarkMode } = useThemeStore();

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
    <div className="space-y-4">
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