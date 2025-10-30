import React, { useState } from 'react';
import { PersonalContextItem } from '../types';
import { X, Save } from 'lucide-react';

interface PersonalContextModalProps {
  context: PersonalContextItem[];
  onClose: () => void;
  onSave: (context: PersonalContextItem[]) => void;
}

const PersonalContextModal: React.FC<PersonalContextModalProps> = ({ context, onClose, onSave }) => {
  const [localContext, setLocalContext] = useState<PersonalContextItem[]>(context);

  const handleAnswerChange = (id: string, answer: string) => {
    setLocalContext(prev => prev.map(item => item.id === id ? { ...item, answer } : item));
  };
  
  const handleSave = () => {
    onSave(localContext);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-scale-up">
        <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold font-display text-popover-foreground">Edit Your Taste Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Your answers help the assistant understand your preferences, leading to better recommendations. This information is saved only on your device.
          </p>
          {localContext.map(item => (
            <div key={item.id}>
              <label htmlFor={`context-${item.id}`} className="text-sm font-semibold text-foreground">
                {item.question}
              </label>
              <textarea
                id={`context-${item.id}`}
                value={item.answer}
                onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                className="w-full mt-2 p-3 border border-border bg-input rounded-lg min-h-[60px] resize-y focus:ring-2 focus:ring-ring focus:outline-none text-sm"
                placeholder="Your answer here..."
                rows={2}
              />
            </div>
          ))}
        </div>

        <footer className="flex justify-end p-4 border-t border-border bg-muted/30 rounded-b-2xl shrink-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-primary-foreground bg-primary hover:brightness-110 font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            <Save size={18} />
            <span>Save Profile</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PersonalContextModal;