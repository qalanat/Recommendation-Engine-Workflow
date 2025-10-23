import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-rose-50 to-stone-100 dark:from-stone-800 dark:via-stone-900 dark:to-black">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center items-center mb-4">
            <Sparkles className="h-16 w-16 text-[#E07A5F]" />
        </div>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E07A5F] to-[#81B29A]">
            Welcome
        </h1>
        <p className="mt-3 text-lg text-stone-500 dark:text-stone-400">Your Personal Companion</p>
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should I call you?"
            className="w-full rounded-full border-2 border-stone-300 dark:border-stone-600 bg-white/50 dark:bg-stone-800/50 px-6 py-4 text-center text-lg text-stone-700 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 transition-colors focus:border-[#E07A5F] focus:outline-none focus:ring-4 focus:ring-[#E07A5F]/20"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-full bg-[#E07A5F] px-6 py-4 text-lg font-bold text-white shadow-lg shadow-[#E07A5F]/30 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-opacity-90 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-stone-400 dark:disabled:bg-stone-600 disabled:shadow-none"
          >
            Begin
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;