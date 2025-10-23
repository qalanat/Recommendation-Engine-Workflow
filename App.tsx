import React, { useState, useEffect, useCallback } from 'react';
import UnifiedChat from './components/UnifiedChat';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import SettingsModal from './components/SettingsModal';
import PersonalContextModal from './components/PersonalContextModal';
import { UserProfile, Category, Theme, PersonalContextItem } from './types';
import { Loader2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPersonalContextOpen, setIsPersonalContextOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [personalContext, setPersonalContext] = useState<PersonalContextItem[]>([]);

  useEffect(() => {
    // Theme initialization
    const storedTheme = localStorage.getItem('gemini-theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gemini-theme', theme);
  }, [theme]);

  useEffect(() => {
    // User and data initialization
    try {
      const storedUser = localStorage.getItem('gemini-user-profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        const storedCategories = localStorage.getItem(`gemini-categories-${parsedUser.name}`);
        setCategories(storedCategories ? JSON.parse(storedCategories) : getDefaultCategories(parsedUser.name));
        
        const storedContext = localStorage.getItem(`gemini-context-${parsedUser.name}`);
        setPersonalContext(storedContext ? JSON.parse(storedContext) : getDefaultPersonalContext());

      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  const getDefaultCategories = (name: string): Category[] => [
    { id: 'rec-1', name: 'Recommendations', systemPrompt: `You are an expert recommendation assistant named Kai, embodying a friendly, warm, and insightful personality. The user's name is ${name}. Your primary goal is to provide highly personalized and helpful recommendations.\n- Engage Naturally: Start with a warm, varied greeting. Converse like a knowledgeable friend, not a robot.\n- Understand Intent: Before recommending, ask clarifying questions to grasp the user's current needs, mood, and context. Frame these questions as interactive suggestions using the format [QUICK_REPLY: "Question 1?", "Question 2?"].\n- Leverage Tools: Use Google Search for up-to-the-minute information and Google Maps to find locations.\n- Be Conversational: Frame recommendations as suggestions ("You might enjoy...", "How does this sound?"). Encourage feedback and iterate.\n- Structure Data: When comparing items, use Markdown tables. For places, try to include user reviews using the format [REVIEW: "User Name", "Rating", "Review text..."].`, messages: [], isPinned: true, interactionMode: 'conversational' },
    { id: 'std-1', name: 'Standard Chat', systemPrompt: `You are a helpful and friendly conversational assistant. The user's name is ${name}. Be curious and engaging.`, messages: [], interactionMode: 'conversational' },
  ];

  const getDefaultPersonalContext = (): PersonalContextItem[] => [
      { id: 'ctx-1', question: 'What are some of your favorite hobbies or interests?', answer: '' },
      { id: 'ctx-2', question: 'Are there any topics you love to discuss or learn about?', answer: '' },
      { id: 'ctx-3', question: 'What kind of movies, books, or music do you enjoy?', answer: '' },
      { id: 'ctx-4', question: 'Do you have any dietary preferences or restrictions?', answer: '' },
  ];

  const handleLogin = useCallback((name: string) => {
    const newUserProfile: UserProfile = { name };
    localStorage.setItem('gemini-user-profile', JSON.stringify(newUserProfile));
    setUser(newUserProfile);
    
    const defaultCategories = getDefaultCategories(name);
    setCategories(defaultCategories);
    localStorage.setItem(`gemini-categories-${name}`, JSON.stringify(defaultCategories));

    const defaultContext = getDefaultPersonalContext();
    setPersonalContext(defaultContext);
    localStorage.setItem(`gemini-context-${name}`, JSON.stringify(defaultContext));
  }, []);

  const handleLogout = useCallback(() => {
    // Could add a confirmation modal here
    localStorage.removeItem('gemini-user-profile');
    // For privacy, we could also remove the user-specific data
    // localStorage.removeItem(`gemini-categories-${user.name}`);
    // localStorage.removeItem(`gemini-context-${user.name}`);
    setUser(null);
    setCategories([]);
    setPersonalContext([]);
    setActiveCategoryId(null);
  }, []);
  
  const saveCategories = (newCategories: Category[]) => {
    if (user) {
      setCategories(newCategories);
      localStorage.setItem(`gemini-categories-${user.name}`, JSON.stringify(newCategories));
    }
  }

  const handleUpdateCategory = (updatedCategory: Category) => {
    const newCategories = categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
    saveCategories(newCategories);
  };

  const handleNewCategory = (name: string, options?: { parentId?: string, isFolder?: boolean }) => {
    if(user){
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name,
        systemPrompt: `You are a helpful assistant. The user's name is ${user.name}.`,
        messages: [],
        parentId: options?.parentId,
        interactionMode: 'conversational',
      };
      const newCategories = [...categories, newCategory];
      saveCategories(newCategories);
      if (!options?.isFolder) {
        setActiveCategoryId(newCategory.id);
      }
    }
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId && c.parentId !== categoryId);
    saveCategories(newCategories);
    if(activeCategoryId === categoryId){
        setActiveCategoryId(null);
    }
  };

  const handleTogglePin = (categoryId: string) => {
    const newCategories = categories.map(c => 
      c.id === categoryId ? { ...c, isPinned: !c.isPinned } : c
    );
    saveCategories(newCategories);
  };

  const handleSavePersonalContext = (context: PersonalContextItem[]) => {
      if(user) {
        setPersonalContext(context);
        localStorage.setItem(`gemini-context-${user.name}`, JSON.stringify(context));
        setIsPersonalContextOpen(false);
      }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-stone-100 dark:bg-stone-900">
        <Loader2 className="h-12 w-12 animate-spin text-[#E07A5F]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId) || null;

  return (
    <div className="flex h-screen w-screen font-sans">
      <Sidebar 
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        categories={categories} 
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        onNewCategory={handleNewCategory}
        onDeleteCategory={handleDeleteCategory}
        onTogglePin={handleTogglePin}
        onOpenPersonalContext={() => setIsPersonalContextOpen(true)}
        onLogout={handleLogout}
      />
      <main className={`flex-1 flex flex-col relative transition-all duration-300 ease-in-out bg-white/50 dark:bg-stone-800/20`}>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-4 right-4 z-20 rounded-full p-2 text-stone-500 dark:text-stone-400 transition-colors hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-100 icon-snap"
            aria-label="Open settings"
            disabled={!activeCategory}
            >
             <Settings size={22}/>
          </button>
          
          {activeCategory ? (
            <UnifiedChat 
              key={activeCategory.id} 
              category={activeCategory} 
              user={user} 
              onUpdateCategory={handleUpdateCategory} 
              personalContext={personalContext}
            />
          ) : (
            <WelcomeScreen userName={user.name} />
          )}
      </main>
      
      {isSettingsOpen && activeCategory && (
        <SettingsModal 
          category={activeCategory}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateCategory}
          userName={user.name}
          currentTheme={theme}
          onSetTheme={setTheme}
        />
      )}
      {isPersonalContextOpen && (
        <PersonalContextModal
            context={personalContext}
            onClose={() => setIsPersonalContextOpen(false)}
            onSave={handleSavePersonalContext}
        />
      )}
    </div>
  );
};

export default App;
