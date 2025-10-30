import React, { useState } from 'react';
import { Category, Theme } from '../types';
import { X, Save, Sun, Moon, Sunrise, MessageCircle, LayoutGrid, BrainCircuit, Droplets, Leaf, Check } from 'lucide-react';

interface SettingsModalProps {
  category: Category;
  onClose: () => void;
  onSave: (category: Category) => void;
  userName: string;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
}

const getPersonalities = (userName: string) => ({
  friendly: `You are an expert recommendation assistant, embodying a friendly, warm, and insightful personality. The user's name is ${userName}. Your primary goal is to provide highly personalized and helpful recommendations.\n- Engage Naturally: Start with a warm, varied greeting. Converse like a knowledgeable friend, not a robot.\n- Understand Intent: Before recommending, ask clarifying questions to grasp the user's current needs, mood, and context. Frame these questions as interactive suggestions using the format [QUICK_REPLY: "Question 1?", "Question 2?"].\n- Leverage Tools: Use Google Search for up-to-the-minute information and Google Maps to find locations.\n- Be Conversational: Frame recommendations as suggestions ("You might enjoy...", "How does this sound?"). Encourage feedback and iterate.\n- Structure Data: When comparing items, use Markdown tables. For places, try to include user reviews using the format [REVIEW: "User Name", "Rating", "Review text..."].`,
  concise: `You are a direct and efficient assistant. The user's name is ${userName}. Provide information and recommendations clearly and concisely. Get straight to the point but remain polite.\n- Prioritize clarity and accuracy.\n- Use lists and bullet points for easy readability.\n- Avoid unnecessary conversational fluff.`,
  witty: `You are a witty and humorous assistant with a charming personality. The user's name is ${userName}. Your goal is to make recommendations and conversation enjoyable and entertaining.\n- Use clever wordplay and light humor.\n- Maintain a positive and engaging tone.\n- Be creative in your responses while ensuring they remain helpful and on-topic.`
});


const SettingsModal: React.FC<SettingsModalProps> = ({ category, onClose, onSave, userName, currentTheme, onSetTheme }) => {
  const [systemPrompt, setSystemPrompt] = useState(category.systemPrompt);
  const [interactionMode, setInteractionMode] = useState(category.interactionMode || 'conversational');
  const personalities = getPersonalities(userName);

  const handleSave = () => {
    const updatedCategory = { ...category, systemPrompt, interactionMode };
    if (interactionMode === 'whiteboard' && !updatedCategory.whiteboardData) {
        updatedCategory.whiteboardData = [];
    }
    onSave(updatedCategory);
    onClose();
  };

  const handlePersonalityChange = (personality: keyof typeof personalities) => {
    setSystemPrompt(personalities[personality]);
  };
  
  const themeOptions: { name: Theme, icon: React.ReactNode, colors: string[] }[] = [
    { name: 'light', icon: <Sun size={18} />, colors: ['#d95e62', '#5a948d', '#ecbc76'] },
    { name: 'dark', icon: <Moon size={18} />, colors: ['#d95e62', '#5a948d', '#ecbc76'] },
    { name: 'sunset', icon: <Sunrise size={18} />, colors: ['#f77792', '#b578ff', '#ffba82'] },
    { name: 'ocean', icon: <Droplets size={18} />, colors: ['#3498db', '#16a085', '#f39c12'] },
    { name: 'meadow', icon: <Leaf size={18} />, colors: ['#528f45', '#93b179', '#f4d06f'] },
  ]
  
  const interactionOptions: { name: Category['interactionMode'], icon: React.ReactNode, label: string }[] = [
    { name: 'conversational', icon: <MessageCircle size={18} />, label: 'Conversational' },
    { name: 'card', icon: <LayoutGrid size={18} />, label: 'Card-based' },
    { name: 'whiteboard', icon: <BrainCircuit size={18} />, label: 'Whiteboard' },
  ]


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-scale-up">
        <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold font-display text-popover-foreground">Settings for "{category.name}"</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto">
           <div>
              <label className="text-sm font-semibold text-foreground">Theme</label>
              <p className="text-sm text-muted-foreground mb-3">Change the application's appearance.</p>
              <div className="flex flex-wrap gap-4">
                {themeOptions.map(theme => (
                  <div key={theme.name} className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => onSetTheme(theme.name)}
                      className={`h-14 w-14 rounded-full border-2 p-1 transition-all ${currentTheme === theme.name ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}
                    >
                      <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(45deg, ${theme.colors[0]}, ${theme.colors[1]})`}}>
                         {currentTheme === theme.name && <Check size={24} className="text-white z-10"/>}
                         <div className="absolute inset-0 bg-black/10"></div>
                      </div>
                    </button>
                    <span className={`text-sm font-medium capitalize ${currentTheme === theme.name ? 'text-primary' : 'text-muted-foreground'}`}>{theme.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Interaction Mode</label>
              <p className="text-sm text-muted-foreground mb-3">Choose between text or a visual card UI.</p>
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                {interactionOptions.map(mode => (
                  <button 
                    key={mode.name} 
                    onClick={() => setInteractionMode(mode.name)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md capitalize transition-colors ${interactionMode === mode.name ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
           <div>
            <label className="text-sm font-semibold text-foreground">Assistant Personality</label>
            <p className="text-sm text-muted-foreground mb-3">Select a personality to set a base prompt, or write your own below.</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(personalities) as (keyof typeof personalities)[]).map(p => (
                <button 
                  key={p} 
                  onClick={() => handlePersonalityChange(p)}
                  className="px-4 py-1.5 text-sm font-medium rounded-full capitalize transition-colors bg-muted hover:bg-border text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="system-prompt" className="text-sm font-semibold text-foreground">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full mt-2 p-3 border border-border bg-card/50 rounded-lg h-48 resize-y focus:ring-2 focus:ring-ring focus:outline-none text-sm"
              placeholder="Define the assistant's role, personality, and instructions..."
            />
          </div>
        </div>

        <footer className="flex justify-end p-4 border-t border-border bg-muted/30 rounded-b-2xl shrink-0">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-primary-foreground bg-primary hover:brightness-110 font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;