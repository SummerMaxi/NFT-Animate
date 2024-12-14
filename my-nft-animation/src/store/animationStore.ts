import { create } from 'zustand';

interface AnimationState {
  bubbleText: string;
  isTyping: boolean;
  typingDuration: number;
  isLooping: boolean;
  backgroundColor: string;
  setBubbleText: (text: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setTypingDuration: (duration: number) => void;
  setIsLooping: (isLooping: boolean) => void;
  setBackgroundColor: (color: string) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  bubbleText: "Welcome to Shapecraft!",
  isTyping: false,
  typingDuration: 2,
  isLooping: true,
  backgroundColor: '#ffffff',
  setBubbleText: (text) => set({ bubbleText: text }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setTypingDuration: (duration) => set({ typingDuration: duration }),
  setIsLooping: (isLooping) => set({ isLooping }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
})); 