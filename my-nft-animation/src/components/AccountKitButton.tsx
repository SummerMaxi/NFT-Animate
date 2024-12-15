'use client';

import { useAuthModal, useSignerStatus, useUser } from "@account-kit/react";
import { ChainSelector } from "./ChainSelector";
import { useAuthPersist } from "@/hooks/useAuthPersist";

export function AccountKitButton() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { handleLogout } = useAuthPersist();

  const handleLogin = () => {
    localStorage.removeItem('wagmi.wallet');
    localStorage.removeItem('wagmi.connected');
    localStorage.removeItem('wagmi.account');
    openAuthModal();
  };

  if (signerStatus.isInitializing) {
    return (
      <button className="py-3 px-6 rounded-xl bg-[#4F46E5] text-white font-medium opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="py-3 px-6 rounded-xl bg-[#4F46E5] text-white font-medium hover:bg-[#4338CA] transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <ChainSelector />
        <div className="py-3 px-6 rounded-xl bg-[#4F46E5] text-white font-medium">
          {user.email ?? user.address?.slice(0, 6) + '...' + user.address?.slice(-4)}
        </div>
        <button
          onClick={handleLogout}
          className="py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border border-red-200 dark:border-red-800 transition-colors font-medium"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
} 