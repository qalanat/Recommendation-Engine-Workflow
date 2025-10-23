import React, { useState, useMemo } from 'react';
import { Category, UserProfile } from '../types';
import { Folder, MessageSquare, Plus, Trash2, LogOut, PanelLeftClose, PanelLeftOpen, User, Pin, PinOff, ChevronRight, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onNewCategory: (name: string, options?: { parentId?: string; isFolder?: boolean }) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePin: (id: string) => void;
  onLogout: () => void;
  onOpenPersonalContext: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { user, isCollapsed, onToggleCollapse, categories, activeCategoryId, onSelectCategory, onNewCategory, onDeleteCategory, onTogglePin, onLogout, onOpenPersonalContext } = props;
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const { pinned, folders } = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, { ...c, children: [] as Category[] }]));
    
    const rootCategories: (Category & { children: Category[] })[] = [];

    for (const cat of categoryMap.values()) {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(cat);
      } else {
        rootCategories.push(cat);
      }
    }

    return {
      pinned: categories.filter(c => c.isPinned),
      folders: rootCategories.sort((a,b) => a.name.localeCompare(b.name)),
    };
  }, [categories]);
  
  const [deletingId, setDeletingId] = useState<string|null>(null);

  const renderCategory = (category: Category & { children?: Category[] }, level = 0) => {
    const isFolder = category.children && category.children.length > 0;
    const isExpanded = isFolder && expandedFolders[category.id];

    return (
      <div key={category.id}>
        <div className="group relative flex items-center" style={{ paddingLeft: `${level * 16}px` }}>
          {isFolder && (
            <button onClick={() => handleToggleFolder(category.id)} className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700">
               <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onSelectCategory(category.id)}
            title={isCollapsed ? category.name : ''}
            className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${!isFolder ? 'ml-5' : ''} ${
              activeCategoryId === category.id 
                ? 'bg-[#E07A5F] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50' 
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <Folder size={18} />
            {!isCollapsed && <span className="flex-1 truncate text-sm font-medium">{category.name}</span>}
          </button>
          {!isCollapsed && (
              <div className="absolute right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <button onClick={() => onTogglePin(category.id)} title="Pin" className="p-1.5 rounded-md text-stone-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-stone-700">
                    {category.isPinned ? <PinOff size={14}/> : <Pin size={14}/>}
                  </button>
                   <button onClick={() => onNewCategory(`New Chat in ${category.name}`, { parentId: category.id })} title="New Chat" className="p-1.5 rounded-md text-stone-400 hover:text-green-500 hover:bg-green-100 dark:hover:bg-stone-700">
                    <Plus size={14}/>
                  </button>
                  <button onClick={() => setDeletingId(category.id)} title="Delete" className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-stone-700">
                      <Trash2 size={14} />
                  </button>
              </div>
          )}
        </div>
        {isExpanded && category.children && (
            <div className="flex flex-col">
                {category.children.map(child => renderCategory(child, level + 1))}
            </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`bg-stone-50 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex flex-col p-3 space-y-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 items-center' : 'w-72'}`}>
      <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
         {!isCollapsed && (
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-lg shadow-md">
                    <MessageSquare className="text-white" size={20}/>
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Kai</h2>
            </div>
         )}
        <button onClick={onToggleCollapse} className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700">
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 w-full -mr-1 pr-1">
        {pinned.length > 0 && (
          <div>
            {!isCollapsed && <h3 className="px-2 mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Pinned</h3>}
            {pinned.map(cat => renderCategory(cat))}
          </div>
        )}
        
        <div>
          {!isCollapsed && <h3 className="px-2 mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Workspace</h3>}
          {folders.filter(f => !f.isPinned).map(cat => renderCategory(cat))}
        </div>
      </div>
      

      <div className="space-y-2 w-full">
         <button 
          onClick={() => onNewCategory('New Chat')}
          title={isCollapsed ? 'New Chat' : ''}
          className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-stone-600 dark:text-stone-300 bg-stone-200/50 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Plus size={18} />
          {!isCollapsed && <span className="text-sm font-medium">New Chat</span>}
        </button>
        <button 
          onClick={() => onNewCategory('New Folder', { isFolder: true })}
          title={isCollapsed ? 'New Folder' : ''}
          className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-stone-600 dark:text-stone-300 bg-stone-200/50 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Folder size={18} />
          {!isCollapsed && <span className="text-sm font-medium">New Folder</span>}
        </button>
        
        <div className={`border-t border-stone-200 dark:border-stone-700 ${isCollapsed ? 'mx-2' : 'mx-1'} my-2`}></div>
        
        <button 
          onClick={onOpenPersonalContext}
          title={isCollapsed ? `Personal Context for ${user.name}` : ''}
          className={`group flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <User size={18} />
          {!isCollapsed && <span className="flex-1 truncate text-sm font-medium">{user.name}</span>}
           {!isCollapsed && <LogOut onClick={(e) => { e.stopPropagation(); onLogout();}} size={16} className="text-stone-400 group-hover:text-red-500 transition-colors"/>}
        </button>
      </div>

       {deletingId && (
            <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in-slide-up" style={{animationDuration: '0.2s'}}>
                <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Delete Item?</h3>
                    <p className="text-stone-600 dark:text-stone-300 mt-2">Are you sure? Deleting a folder will also delete all chats inside it. This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg text-stone-700 dark:text-stone-200 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors">Cancel</button>
                        <button onClick={() => { onDeleteCategory(deletingId); setDeletingId(null); }} className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        )}
    </aside>
  );
};

export default Sidebar;