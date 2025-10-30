import React, { useState, useEffect, useCallback } from 'react';
import UnifiedChat from './components/UnifiedChat';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import SettingsModal from './components/SettingsModal';
import PersonalContextModal from './components/PersonalContextModal';
import Whiteboard from './components/Whiteboard';
import { UserProfile, Category, Theme, PersonalContextItem, WhiteboardNode } from './types';
import { Loader2, Settings, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPersonalContextOpen, setIsPersonalContextOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [theme, setTheme] = useState<Theme>('light');
  const [personalContext, setPersonalContext] = useState<PersonalContextItem[]>([]);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobileView(mobile);
        if (!mobile) {
            setIsSidebarOpen(true); // Always open sidebar on desktop
        } else {
            setIsSidebarOpen(false); // Default to closed on mobile
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('gemini-theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('dark'); // Default to dark theme
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gemini-theme', theme);
  }, [theme]);

  useEffect(() => {
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
    { id: 'rec-1', name: 'Recommendations', systemPrompt: `You are an expert recommendation assistant. The user's name is ${name}. Your primary goal is to provide highly personalized and helpful recommendations based on their taste profile and conversation history.\n\n**Interaction Flow:**\n1.  **Initiate with Intent:** Start by asking the user for their current mood or intent. Frame these questions as interactive suggestions using the format [QUICK_REPLY: "Shopping for a gift?", "Just browsing", "Looking for inspiration?"].\n2.  **Understand and Clarify:** Before recommending, ask clarifying questions if needed to grasp the user's needs.\n3.  **Leverage Tools:** Use Google Search for up-to-the-minute information and Google Maps to find locations.\n\n**Response Format:**\nYou are in a Card-based UI mode. Your response **MUST** be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks or any other text. The JSON object must have a 'text' property with your conversational response, and can optionally have 'recommendationGroups', 'chips', and 'map' properties.\n\n**JSON Structure:**\n{\n  "text": "Your textual response to the user.",\n  "recommendationGroups": [\n    {\n      "title": "A thematic title for this group (e.g., 'Inspired by your love for Sci-Fi', 'Trending in your area')",\n      "cards": [\n        {\n          "id": "a_unique_string_id",\n          "title": "Item Title",\n          "description": "A brief, engaging description.",\n          "imageUrl": "https://example.com/image.jpg",\n          "explanation": "A short sentence explaining why this is recommended (e.g., 'Because you enjoyed [Previous Item]').",\n          "rating": 4.5, \n          "socialProof": "e.g., 'Popular this week' or 'Frequently bought with [Item X]'"\n        }\n      ]\n    }\n  ],\n  "chips": [\n    {"id": "c1", "label": "Follow-up question or filter"}\n  ],\n  "map": {\n    "query": "e.g., 'coffee shops near me'"\n  }\n}\n\n**Content Guidelines:**\n- **Explain a little:** Always include a brief \`explanation\` for each card.\n- **Group Logically:** Group recommendations into thematic carousels using \`recommendationGroups\`. Create 1-3 groups per response.\n- **Add Social Proof:** Where possible, add \`rating\` or \`socialProof\` to make recommendations more compelling.`, messages: [], isPinned: true, interactionMode: 'card' },
    { id: 'std-1', name: 'Standard Chat', systemPrompt: `You are a helpful and friendly conversational assistant. The user's name is ${name}. Be curious and engaging.`, messages: [], interactionMode: 'conversational' },
  ];

  const getDefaultPersonalContext = (): PersonalContextItem[] => [
      { id: 'ctx-1', question: 'What are some of your favorite hobbies, interests, or genres (e.g., sci-fi movies, historical fiction books)?', answer: '' },
      { id: 'ctx-2', question: 'Are there any specific brands, artists, or creators you love?', answer: '' },
      { id: 'ctx-3', question: 'What are some things you generally dislike or want to avoid?', answer: '' },
      { id: 'ctx-4', question: 'Do you have any dietary preferences, allergies, or other restrictions I should know about?', answer: '' },
  ];
  
  const defaultWhiteboardNodes: WhiteboardNode[] = [
    { id: 'wb-root-1', content: 'My Awesome Project', parentId: null },
    { id: 'wb-1-1', content: 'Brainstorming', parentId: 'wb-root-1' },
    { id: 'wb-1-2', content: 'Execution', parentId: 'wb-root-1' },
    { id: 'wb-2-1', content: 'Initial Ideas', parentId: 'wb-1-1' },
    { id: 'wb-2-2', content: 'Key Features', parentId: 'wb-1-1' },
    { id: 'wb-3-1', content: 'Core MVP', parentId: 'wb-2-2' },
    { id: 'wb-3-2', content: '"Nice to Have" Features', parentId: 'wb-2-2' },
    { id: 'wb-2-3', content: 'Roadmap', parentId: 'wb-1-2' },
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
    localStorage.removeItem('gemini-user-profile');
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

  const handleNewCategory = (name: string, options?: { parentId?: string; isFolder?: boolean, interactionMode?: Category['interactionMode'] }) => {
    if(user){
      let systemPrompt = `You are a helpful assistant. The user's name is ${user.name}.`;
      if (options?.interactionMode === 'whiteboard') {
        systemPrompt = `You are an imaginative brainstorming partner. Your purpose is to help the user explore, expand, and connect ideas in a visual mind-map format.
- When asked to brainstorm or expand on a topic, provide a short, numbered list of creative and thought-provoking keywords or brief phrases that can serve as new branches in the mind map.
- Aim for variety and originality. Avoid full sentences.
- Your output will directly populate the mind map, so clarity and brevity are key.
- Example: If the user asks for ideas about "Marketing Strategy", your response should be like:
1. Guerilla Marketing
2. Viral Loop Mechanics
3. Community Building
4. Podcast Sponsorships
5. Interactive Web Experience`;
      }

      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name,
        systemPrompt,
        messages: [],
        parentId: options?.parentId,
        isFolder: options?.isFolder,
        interactionMode: options?.interactionMode || 'conversational',
        whiteboardData: options?.interactionMode === 'whiteboard' ? defaultWhiteboardNodes : undefined,
      };
      const newCategories = [...categories, newCategory];
      saveCategories(newCategories);
      if (!options?.isFolder) {
        setActiveCategoryId(newCategory.id);
        if(isMobileView) setIsSidebarOpen(false);
      }
    }
  };

  const handleDiscussNode = (nodeContent: string) => {
      const chatName = `Discuss: ${nodeContent.substring(0, 40)}${nodeContent.length > 40 ? '...' : ''}`;
      handleNewCategory(chatName, {
          interactionMode: 'conversational',
      });
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

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId) || null;

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden">
      <Sidebar 
        user={user}
        isOpen={isSidebarOpen}
        isMobileView={isMobileView}
        onSetOpen={setIsSidebarOpen}
        categories={categories} 
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
        onNewCategory={handleNewCategory}
        onDeleteCategory={handleDeleteCategory}
        onTogglePin={handleTogglePin}
        onOpenPersonalContext={() => setIsPersonalContextOpen(true)}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between p-2 sm:p-4 absolute top-0 right-0 z-20">
              {isMobileView && !isSidebarOpen && (
                 <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 mr-2 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Open sidebar"
                    >
                    <Menu size={22}/>
                </button>
              )}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Open settings"
                disabled={!activeCategory}
                >
                <Settings size={22}/>
              </button>
          </div>
          
          {activeCategory ? (
            activeCategory.interactionMode === 'whiteboard' ? (
              <Whiteboard 
                key={activeCategory.id}
                category={activeCategory}
                user={user}
                onUpdateCategory={handleUpdateCategory}
                personalContext={personalContext}
                onDiscussNode={handleDiscussNode}
              />
            ) : (
              <UnifiedChat 
                key={activeCategory.id} 
                category={activeCategory} 
                user={user} 
                onUpdateCategory={handleUpdateCategory} 
                personalContext={personalContext}
              />
            )
          ) : (
            <WelcomeScreen userName={user.name} onNewChat={() => handleNewCategory('New Chat')} />
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