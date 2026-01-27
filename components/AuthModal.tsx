import React, { useState } from 'react';
import { TuiBox } from './TuiBox';

interface AuthModalProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  onClose: () => void;
  error: string | null;
  isLoading: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onLogin,
  onRegister,
  onClose,
  error,
  isLoading,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = mode === 'login' 
      ? await onLogin(email, password)
      : await onRegister(email, password);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <TuiBox title={mode === 'login' ? 'LOGIN' : 'REGISTER'} className="w-full max-w-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-red-800 bg-red-900/20 p-2 text-red-500 text-sm">
              ERROR: {error}
            </div>
          )}

          <div>
            <label className="block text-green-700 text-xs mb-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border-2 border-green-800 text-green-400 p-2 focus:border-green-400 focus:outline-none font-mono"
              placeholder="user@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-green-700 text-xs mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border-2 border-green-800 text-green-400 p-2 focus:border-green-400 focus:outline-none font-mono"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 border-2 border-green-600 bg-green-900/30 text-green-400 py-2 hover:bg-green-800/50 hover:border-green-400 transition-colors disabled:opacity-50 font-bold tracking-wider"
            >
              {isLoading ? 'PROCESSING...' : mode === 'login' ? '[ LOGIN ]' : '[ REGISTER ]'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 border-2 border-green-800 text-green-700 hover:border-green-600 hover:text-green-500 transition-colors"
            >
              ESC
            </button>
          </div>

          <div className="text-center text-sm">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-green-700 hover:text-green-400 underline"
              >
                New user? Register here
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-green-700 hover:text-green-400 underline"
              >
                Already have account? Login
              </button>
            )}
          </div>
        </form>
      </TuiBox>
    </div>
  );
};