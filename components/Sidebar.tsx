import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Category, UserProfile } from '../types';
import { Folder, MessageSquare, Plus, Trash2, LogOut, User, Pin, PinOff, ChevronRight, BrainCircuit, PanelLeftClose, ChevronsUpDown, Check, FilePlus, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  isOpen: boolean;
  isMobileView: boolean;
  onSetOpen: (isOpen: boolean) => void;
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onNewCategory: (name: string, options?: { parentId?: string; isFolder?: boolean; interactionMode?: Category['interactionMode'] }) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePin: (id: string) => void;
  onLogout: () => void;
  onOpenPersonalContext: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { user, isOpen, isMobileView, onSetOpen, categories, activeCategoryId, onSelectCategory, onNewCategory, onDeleteCategory, onTogglePin, onLogout, onOpenPersonalContext } = props;
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string|null>(null);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  
  const isCollapsed = !isOpen && !isMobileView;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const { pinned, folders } = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, { ...c, children: [] as Category[] }]));
    const rootCategories: (Category & { children: Category[] })[] = [];
    
    for (const cat of categoryMap.values()) {
        const isFolder = cat.isFolder || categories.some(c => c.parentId === cat.id);
        if (isFolder && !cat.isFolder) {
            (cat as any).isFolder = true;
        }

        if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId)!;
            if(!parent.children) parent.children = [];
            parent.children.push(cat);
        } else {
            rootCategories.push(cat);
        }
    }
    
    return {
      pinned: categories.filter(c => c.isPinned),
      folders: rootCategories.sort((a,b) => a.name.localeCompare(b.name)),
    };
  }, [categories]);

  const handleNewSubItem = (parentId: string, type: 'chat' | 'whiteboard') => {
    const options = {
      parentId,
      interactionMode: type === 'chat' ? 'conversational' : 'whiteboard'
    } as const;
    onNewCategory(`New ${type}`, options);
    setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
    setActiveSubMenu(null);
  };


  const renderCategory = (category: Category & { children?: Category[] }, level = 0) => {
    const isFolder = category.isFolder || (category.children && category.children.length > 0);
    const isExpanded = isFolder && expandedFolders[category.id];
    const Icon = isFolder ? Folder : (category.interactionMode === 'whiteboard' ? BrainCircuit : MessageSquare);
    const indentStyle = isCollapsed ? {} : { paddingLeft: `${level * 16}px` };

    return (
      <div key={category.id}>
        <div 
            className="group relative flex items-center rounded-lg"
            style={indentStyle}
        >
          <div className={`flex items-center flex-1 w-full text-left p-0.5 rounded-lg ${isFolder && isCollapsed ? 'justify-center' : ''}`}>
            {isFolder && !isCollapsed && (
              <button onClick={(e) => handleToggleFolder(e, category.id)} className="p-1.5 rounded-md hover:bg-muted">
                <ChevronRight size={14} className={`transition-transform text-muted-foreground ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
            <button
              onClick={() => onSelectCategory(category.id)}
              title={isCollapsed ? category.name : ''}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors text-sm font-medium ${
                activeCategoryId === category.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              } ${isCollapsed ? 'justify-center' : ''} ${isFolder ? '' : isCollapsed ? '' : 'ml-1'}`}
            >
              <Icon size={18} />
              {!isCollapsed && <span className="flex-1 truncate">{category.name}</span>}
            </button>
          </div>

          {!isCollapsed && (
              <div className="absolute right-1.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/50 backdrop-blur-sm rounded-md">
                  {isFolder && (
                    <button onClick={() => setActiveSubMenu(category.id)} title="New item in folder" className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Plus size={14} /></button>
                  )}
                  <button onClick={() => onTogglePin(category.id)} title={category.isPinned ? "Unpin" : "Pin"} className="p-1.5 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"><Pin size={14} className={`${category.isPinned ? 'fill-current text-accent' : ''}`}/></button>
                  <button onClick={() => setDeletingId(category.id)} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
          )}
        </div>
        {isExpanded && !isCollapsed && category.children && (
            <div className="flex flex-col mt-1">
                {category.children.sort((a,b)=>a.name.localeCompare(b.name)).map(child => renderCategory(child, level + 1))}
            </div>
        )}
      </div>
    );
  };
  
  const newMenuItems = [
    { label: 'New Chat', icon: MessageSquare, action: () => onNewCategory('New Chat', { interactionMode: 'conversational' })},
    { label: 'New Whiteboard', icon: BrainCircuit, action: () => onNewCategory('New Whiteboard', { interactionMode: 'whiteboard' })},
    { label: 'New Folder', icon: Folder, action: () => onNewCategory('New Folder', { isFolder: true })},
  ]

  const SidebarContent = () => (
    <>
      <div className={`flex items-center p-2 h-16 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
         {!isCollapsed && (
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-md">
                    <BrainCircuit className="text-primary-foreground" size={22}/>
                </div>
                <h2 className="text-xl font-bold font-display text-foreground tracking-tight">Discovery Agent</h2>
            </div>
         )}
        {!isMobileView && (
            <button onClick={() => onSetOpen(!isOpen)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
                {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20}/>}
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 w-full p-2">
        {pinned.length > 0 && (
          <div>
            {!isCollapsed && <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pinned</h3>}
            <div className="space-y-1">{pinned.map(cat => renderCategory(cat))}</div>
          </div>
        )}
        
        <div>
          {!isCollapsed && <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace</h3>}
          <div className="space-y-1">{folders.filter(f => !f.isPinned).map(cat => renderCategory(cat))}</div>
        </div>
      </div>
      
      <div className="space-y-1 p-2 w-full shrink-0">
         <div className="relative" ref={newMenuRef}>
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              title={isCollapsed ? 'New Item' : ''}
              className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-foreground bg-muted/50 hover:bg-muted transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <FilePlus size={18} />
              {!isCollapsed && <span className="text-sm font-semibold flex-1">New...</span>}
              {!isCollapsed && <ChevronsUpDown size={16} className="text-muted-foreground" />}
            </button>
            {isNewMenuOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-popover border border-border rounded-lg shadow-xl p-1 animate-fade-in-slide-up" style={{animationDuration: '0.2s'}}>
                    {newMenuItems.map(item => (
                        <button key={item.label} onClick={() => { item.action(); setIsNewMenuOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-muted text-sm font-medium">
                           <item.icon size={16} className="text-muted-foreground" /> {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        <div className={`border-t border-border ${isCollapsed ? 'mx-2' : 'mx-1'} my-1`}></div>
        
        <button 
          onClick={onOpenPersonalContext}
          title={isCollapsed ? 'Taste Profile' : ''}
          className={`group flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <User size={18} />
          {!isCollapsed && <span className="flex-1 truncate text-sm font-semibold">Taste Profile</span>}
        </button>
        <button 
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : ''}
          className={`group flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="flex-1 truncate text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className={`bg-card/80 backdrop-blur-xl border-r border-border flex-col transition-all duration-300 ease-in-out ${isMobileView ? 'fixed inset-y-0 left-0 z-50' : 'relative'} ${isOpen ? 'w-72 flex' : (isMobileView ? 'w-72 flex -translate-x-full' : 'w-20 flex')}`}>
        <SidebarContent />
      </aside>
      {isMobileView && isOpen && (
          <div onClick={() => onSetOpen(false)} className="fixed inset-0 bg-black/50 z-40 animate-fade-in" style={{animationDuration: '0.3s'}}></div>
      )}

       {deletingId && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
                <div className="bg-popover border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm">
                    <h3 className="text-lg font-bold text-popover-foreground">Delete Item?</h3>
                    <p className="text-muted-foreground mt-2">Are you sure? Deleting a folder will also delete all chats inside it. This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg text-foreground bg-muted hover:bg-border transition-colors">Cancel</button>
                        <button onClick={() => { onDeleteCategory(deletingId); setDeletingId(null); }} className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        )}
        {activeSubMenu && (
             <div ref={subMenuRef} className="fixed z-50" style={{ top: 'var(--y)px', left: 'var(--x)px' }}>
                <div className="bg-popover border border-border rounded-lg shadow-xl p-1 animate-fade-in-slide-up" style={{animationDuration: '0.2s'}}>
                    <button onClick={() => handleNewSubItem(activeSubMenu, 'chat')} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-muted text-sm">
                        <MessageSquare size={16} className="text-muted-foreground" /> New Chat
                    </button>
                     <button onClick={() => handleNewSubItem(activeSubMenu, 'whiteboard')} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-muted text-sm">
                        <BrainCircuit size={16} className="text-muted-foreground" /> New Whiteboard
                    </button>
                </div>
             </div>
        )}
    </>
  );
};

export default Sidebar;