'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthModal, useSignerStatus, useUser, useLogout } from "@account-kit/react";

export function AccountKitButton() {
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { isAuthenticating } = useSignerStatus();
  const { logout } = useLogout();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button 
        onClick={openAuthModal}
        disabled={isAuthenticating}
        className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-all"
      >
        {isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
      >
        <span>{user.email ?? 'Connected'}</span>
        <span className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 