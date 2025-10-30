import React from 'react';
import { Folder, ArrowLeft, MessageSquarePlus } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  onNewChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ userName, onNewChat }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-transparent animate-fade-in">
      <div className="max-w-lg">
        <div className="flex justify-center items-center mb-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border">
                <Folder size={48} className="text-primary" />
            </div>
        </div>
        <h1 className="text-4xl font-bold font-display text-foreground">
            Welcome, {userName}!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Select a conversation from the sidebar, or create a new one to get started.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
             <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <ArrowLeft size={20} />
                <p className="font-semibold">Choose from the left</p>
            </div>
            <span className="text-muted-foreground hidden sm:inline">or</span>
            <button
                onClick={onNewChat}
                className="flex items-center gap-2 px-4 py-2 font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full hover:bg-primary/20 transition-colors"
            >
                <MessageSquarePlus size={16} />
                Start a new chat
            </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;