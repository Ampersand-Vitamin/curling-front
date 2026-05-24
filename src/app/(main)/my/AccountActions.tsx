"use client";

import { signOut } from "next-auth/react";

export function AccountActions() {
  function handleLogout() {
    signOut({ callbackUrl: "/" });
  }

  function handleDeleteAccount() {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    // TODO: call delete account API
  }

  return (
    <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
      <p className="typo-caption text-surface-400">Account</p>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleLogout}
          className="bg-white rounded-lg py-3 px-3 flex items-center gap-2 overflow-hidden w-full text-left"
        >
          <span className="typo-button text-surface-950">Logout</span>
        </button>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="bg-white rounded-lg py-3 px-3 flex items-center gap-2 overflow-hidden w-full text-left"
        >
          <span className="typo-button text-secondary-400">Delete Account</span>
        </button>
      </div>
    </div>
  );
}
