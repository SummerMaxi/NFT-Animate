'use client';

import { useLogout, useAuthModal } from "@account-kit/react";
import { useCallback } from 'react';
import Cookies from 'js-cookie';

export const useAuthPersist = () => {
  const { logout } = useLogout();
  const { closeAuthModal } = useAuthModal();

  const clearAuthState = () => {
    // Clear all cookies
    const cookies = Cookies.get();
    Object.keys(cookies).forEach(cookieName => {
      Cookies.remove(cookieName);
    });

    // Clear all localStorage
    localStorage.clear();

    // Clear all sessionStorage
    sessionStorage.clear();
  };

  const handleLogout = useCallback(async () => {
    try {
      // First perform Account Kit logout
      await logout();
      
      // Then clear all auth state
      clearAuthState();
      
      // Close any open modals
      closeAuthModal();
      
      // Force a clean reload to reset all states
      window.location.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear state and reload
      clearAuthState();
      window.location.replace('/');
    }
  }, [logout, closeAuthModal]);

  return { handleLogout };
}; 