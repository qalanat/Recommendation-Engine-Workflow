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
    <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-background animate-fade-in">
       <div 
        className="absolute inset-0 -z-10 h-full w-full"
        style={{
          backgroundColor: 'rgb(var(--card))',
          backgroundImage: 'radial-gradient(at 27% 37%, rgb(var(--primary) / 0.1) 0px, transparent 50%), radial-gradient(at 97% 21%, rgb(var(--secondary) / 0.1) 0px, transparent 50%), radial-gradient(at 75% 88%, rgb(var(--accent) / 0.1) 0px, transparent 50%)'
        }}
      />
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center items-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                 <Sparkles className="h-12 w-12 text-primary" />
            </div>
        </div>
        <h1 className="text-5xl font-bold font-display text-foreground">
            Welcome
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">Your Personal Companion</p>
        <form onSubmit={handleSubmit} className="mt-10 space-y-6 animate-fade-in-slide-up" style={{animationDelay: '0.2s'}}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should I call you?"
            className="w-full rounded-full border-2 border-border bg-input px-6 py-4 text-center text-lg text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-full bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-105 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          >
            Begin
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;