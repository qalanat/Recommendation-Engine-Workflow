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
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-slide-up" style={{ animationDuration: '0.3s' }}>
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Personal Context</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 icon-snap">
            <X size={20} className="text-stone-500 dark:text-stone-400" />
          </button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Provide some details about yourself to help your companion give you more personalized recommendations and answers. This information is saved only on your device.
          </p>
          {localContext.map(item => (
            <div key={item.id}>
              <label htmlFor={`context-${item.id}`} className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                {item.question}
              </label>
              <textarea
                id={`context-${item.id}`}
                value={item.answer}
                onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                className="w-full mt-1 p-3 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700/50 rounded-lg min-h-[60px] resize-y focus:ring-2 focus:ring-[#E07A5F] focus:outline-none"
                placeholder="Your answer here..."
                rows={2}
              />
            </div>
          ))}
        </div>

        <footer className="flex justify-end p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-b-2xl">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white bg-[#E07A5F] hover:bg-opacity-90 font-semibold transition-colors icon-snap"
          >
            <Save size={18} />
            <span>Save Context</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PersonalContextModal;
