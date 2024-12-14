import { create } from 'zustand';

interface AnimationState {
  bubbleText: string;
  isTyping: boolean;
  typingDuration: number;
  isLooping: boolean;
  setBubbleText: (text: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setTypingDuration: (duration: number) => void;
  setIsLooping: (isLooping: boolean) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  bubbleText: "GM",
  isTyping: false,
  typingDuration: 2,
  isLooping: true,
  setBubbleText: (text) => set({ bubbleText: text }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setTypingDuration: (duration) => set({ typingDuration: duration }),
  setIsLooping: (isLooping) => set({ isLooping }),
})); 