import React, { useState } from 'react';
import { Category, Theme } from '../types';
import { X, Save, Sun, Moon, Sunrise, MessageCircle, LayoutGrid } from 'lucide-react';

interface SettingsModalProps {
  category: Category;
  onClose: () => void;
  onSave: (category: Category) => void;
  userName: string;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
}

const getPersonalities = (userName: string) => ({
  friendly: `You are an expert recommendation assistant named Kai, embodying a friendly, warm, and insightful personality. The user's name is ${userName}. Your primary goal is to provide highly personalized and helpful recommendations.\n- Engage Naturally: Start with a warm, varied greeting. Converse like a knowledgeable friend, not a robot.\n- Understand Intent: Before recommending, ask clarifying questions to grasp the user's current needs, mood, and context. Frame these questions as interactive suggestions using the format [QUICK_REPLY: "Question 1?", "Question 2?"].\n- Leverage Tools: Use Google Search for up-to-the-minute information and Google Maps to find locations.\n- Be Conversational: Frame recommendations as suggestions ("You might enjoy...", "How does this sound?"). Encourage feedback and iterate.\n- Structure Data: When comparing items, use Markdown tables. For places, try to include user reviews using the format [REVIEW: "User Name", "Rating", "Review text..."].`,
  concise: `You are a direct and efficient assistant. The user's name is ${userName}. Provide information and recommendations clearly and concisely. Get straight to the point but remain polite.\n- Prioritize clarity and accuracy.\n- Use lists and bullet points for easy readability.\n- Avoid unnecessary conversational fluff.`,
  witty: `You are a witty and humorous assistant with a charming personality. The user's name is ${userName}. Your goal is to make recommendations and conversation enjoyable and entertaining.\n- Use clever wordplay and light humor.\n- Maintain a positive and engaging tone.\n- Be creative in your responses while ensuring they remain helpful and on-topic.`
});


const SettingsModal: React.FC<SettingsModalProps> = ({ category, onClose, onSave, userName, currentTheme, onSetTheme }) => {
  const [systemPrompt, setSystemPrompt] = useState(category.systemPrompt);
  const [interactionMode, setInteractionMode] = useState(category.interactionMode || 'conversational');
  const personalities = getPersonalities(userName);

  const handleSave = () => {
    onSave({ ...category, systemPrompt, interactionMode });
    onClose();
  };

  const handlePersonalityChange = (personality: keyof typeof personalities) => {
    setSystemPrompt(personalities[personality]);
  };
  
  const themeOptions: { name: Theme, icon: React.ReactNode }[] = [
    { name: 'light', icon: <Sun size={18} /> },
    { name: 'dark', icon: <Moon size={18} /> },
    { name: 'sunset', icon: <Sunrise size={18} /> },
  ]
  
  const interactionOptions: { name: Category['interactionMode'], icon: React.ReactNode, label: string }[] = [
    { name: 'conversational', icon: <MessageCircle size={18} />, label: 'Conversational' },
    { name: 'card', icon: <LayoutGrid size={18} />, label: 'Card-based' },
  ]


  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-slide-up" style={{animationDuration: '0.3s'}}>
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Settings for "{category.name}"</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 icon-snap">
            <X size={20} className="text-stone-500 dark:text-stone-400" />
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Theme</label>
                 <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Change the application's appearance.</p>
                <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg">
                  {themeOptions.map(theme => (
                    <button 
                      key={theme.name} 
                      onClick={() => onSetTheme(theme.name)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${currentTheme === theme.name ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-700/50'}`}
                    >
                      {theme.icon}
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
               <div>
                <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Interaction Mode</label>
                 <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Choose between text or a visual card UI.</p>
                <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg">
                  {interactionOptions.map(mode => (
                    <button 
                      key={mode.name} 
                      onClick={() => setInteractionMode(mode.name)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${interactionMode === mode.name ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-700/50'}`}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
          </div>
           <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Assistant Personality</label>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Select a personality to set a base prompt, or write your own below.</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(personalities) as (keyof typeof personalities)[]).map(p => (
                <button 
                  key={p} 
                  onClick={() => handlePersonalityChange(p)}
                  className="px-3 py-1.5 text-sm rounded-lg capitalize transition-colors bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="system-prompt" className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full mt-1 p-3 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700/50 rounded-lg h-48 resize-y focus:ring-2 focus:ring-[#E07A5F] focus:outline-none"
              placeholder="Define the assistant's role, personality, and instructions..."
            />
          </div>
        </div>

        <footer className="flex justify-end p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-b-2xl">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white bg-[#E07A5F] hover:bg-opacity-90 font-semibold transition-colors icon-snap"
          >
            <Save size={18} />
            <span>Save</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
