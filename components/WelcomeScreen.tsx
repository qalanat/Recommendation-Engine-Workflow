import React from 'react';
import { Folder, ArrowLeft } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ userName }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-transparent">
      <div className="max-w-lg">
        <div className="flex justify-center items-center mb-6">
            <div className="p-5 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/50 dark:to-rose-900/50">
                <Folder size={48} className="text-[#E07A5F]" />
            </div>
        </div>
        <h1 className="text-4xl font-bold text-stone-800 dark:text-stone-100">
            Welcome, {userName}!
        </h1>
        <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">
          Select a conversation from the sidebar, or create a new one to get started.
        </p>
        <div className="mt-8 flex justify-center items-center gap-2 text-stone-500 dark:text-stone-400">
            <ArrowLeft size={20} />
            <p className="font-semibold">Choose from the left panel</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;