import React from 'react';

interface SyncStatusProps {
  isAuthenticated: boolean;
  isSyncing: boolean;
  userEmail?: string;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isAuthenticated,
  isSyncing,
  userEmail,
  onLoginClick,
  onLogout,
}) => {
  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="text-yellow-600 hover:text-yellow-400 text-xs border border-yellow-800 px-2 py-1 hover:border-yellow-600 transition-colors"
      >
        [ SYNC: OFFLINE ] Click to login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`${isSyncing ? 'text-yellow-500 animate-pulse' : 'text-green-500'}`}>
        {isSyncing ? '◉ SYNCING...' : '◉ SYNCED'}
      </span>
      <span className="text-green-700">{userEmail}</span>
      <button
        onClick={onLogout}
        className="text-red-700 hover:text-red-500 border border-red-900 px-2 py-0.5 hover:border-red-700 transition-colors"
      >
        LOGOUT
      </button>
    </div>
  );
};