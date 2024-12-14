'use client';

import { useAuthModal, useLogout, useSignerStatus, useUser } from "@account-kit/react";
import { ChainSelector } from "./ChainSelector";

export function AccountKitButton() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { logout } = useLogout();

  if (signerStatus.isInitializing) {
    return (
      <button className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (!user) {
    return (
      <button
        onClick={openAuthModal}
        className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-all"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <ChainSelector />
        <div className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium">
          {user.email ?? user.address?.slice(0, 6) + '...' + user.address?.slice(-4)}
        </div>
        <button
          onClick={() => logout()}
          className="py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border border-red-200 dark:border-red-800 transition-colors font-medium"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
} 