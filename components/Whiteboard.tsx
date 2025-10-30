import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { UserProfile, Category, PersonalContextItem, WhiteboardNode, ChatMessage } from '../types';
import { Send, PlusCircle, Trash2, Sparkles, Loader2, BrainCircuit, MessageSquarePlus } from 'lucide-react';
import { marked } from 'marked';

// --- Main Whiteboard Component --- //
interface WhiteboardProps {
  user: UserProfile;
  category: Category;
  onUpdateCategory: (category: Category) => void;
  personalContext: PersonalContextItem[];
  onDiscussNode: (nodeContent: string) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ user, category, onUpdateCategory, personalContext, onDiscussNode }) => {
    const [nodes, setNodes] = useState<WhiteboardNode[]>(category.whiteboardData || []);
    const [messages, setMessages] = useState<ChatMessage[]>(category.messages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const updateCategory = useCallback((newNodes: WhiteboardNode[], newMessages?: ChatMessage[]) => {
        onUpdateCategory({ 
            ...category, 
            whiteboardData: newNodes, 
            messages: newMessages !== undefined ? newMessages : messages 
        });
    }, [category, messages, onUpdateCategory]);

    // --- Node Management --- //
    const addNode = useCallback((content: string, parentId: string | null = null) => {
        const newNode: WhiteboardNode = { id: `node-${Date.now()}`, content, parentId };
        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        updateCategory(newNodes);
    }, [nodes, updateCategory]);

    const addMultipleNodes = useCallback((contents: string[], parentId: string) => {
        const newNodesToAdd = contents.map((content, index) => ({
             id: `node-${Date.now()}-${index}`, content, parentId
        }));
        const newNodes = [...nodes, ...newNodesToAdd];
        setNodes(newNodes);
        updateCategory(newNodes);
    }, [nodes, updateCategory]);

    const updateNode = (id: string, content: string) => {
        const newNodes = nodes.map(n => n.id === id ? { ...n, content } : n);
        setNodes(newNodes);
        updateCategory(newNodes);
    };

    const deleteNode = (id: string) => {
        let allIdsToDelete = new Set([id]);
        let queue = [id];
        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = nodes.filter(n => n.parentId === currentId);
            children.forEach(child => {
                allIdsToDelete.add(child.id);
                queue.push(child.id);
            });
        }
        const newNodes = nodes.filter(n => !allIdsToDelete.has(n.id));
        setNodes(newNodes);
        updateCategory(newNodes);
    };

    const handleExpandNode = useCallback(async (nodeId: string, nodeContent: string) => {
        setExpandingNodeId(nodeId);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a list of 5 concise sub-topics or ideas related to the following concept: "${nodeContent}". Format the response as a numbered list. For example: 1. Idea One 2. Idea Two 3. Idea Three.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const ideas = response.text
                .split('\n')
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(line => line.length > 0);
            
            addMultipleNodes(ideas, nodeId);

        } catch (e) {
            console.error("Failed to expand node:", e);
        } finally {
            setExpandingNodeId(null);
        }
    }, [addMultipleNodes]);
    
    type TreeNode = WhiteboardNode & { children: TreeNode[] };

    const nodeTree = useMemo(() => {
        const map = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];
        nodes.forEach(node => {
            map.set(node.id, { ...node, children: [] });
        });
        nodes.forEach(node => {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children.push(map.get(node.id)!);
            } else {
                roots.push(map.get(node.id)!);
            }
        });
        return roots;
    }, [nodes]);

    const renderNode = (node: TreeNode) => {
        const textRef = useRef<HTMLDivElement>(null);

        const handleBlur = () => {
            const newContent = textRef.current?.textContent?.trim() || '';
            if (newContent !== node.content && newContent) {
                updateNode(node.id, newContent);
            } else if (!newContent) {
                 textRef.current!.textContent = node.content; // Revert if empty
            }
        };
        
        const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textRef.current?.blur();
            }
        };

        return (
            <div className="mindmap-node animate-fade-in" style={{animationDelay: `${Math.random() * 0.1}s`}} key={node.id}>
                <div className="mindmap-node-content-wrapper">
                     <div className="mindmap-node-content group">
                        <div 
                            ref={textRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="mindmap-node-text"
                            dangerouslySetInnerHTML={{ __html: node.content }}
                        />
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/50 backdrop-blur-sm rounded-lg">
                             <button 
                                onClick={() => handleExpandNode(node.id, node.content)} 
                                disabled={expandingNodeId === node.id}
                                title="Expand with AI" 
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-50"
                             >
                                {expandingNodeId === node.id ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                             </button>
                              <button onClick={() => onDiscussNode(node.content)} title="Discuss this idea" className="p-1.5 rounded-md text-muted-foreground hover:text-secondary hover:bg-secondary/10"><MessageSquarePlus size={14}/></button>
                             <button onClick={() => addNode('New Idea', node.id)} title="Add child node" className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10"><PlusCircle size={14}/></button>
                             <button onClick={() => deleteNode(node.id)} title="Delete node" className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10"><Trash2 size={14}/></button>
                        </div>
                    </div>
                </div>
                {node.children && node.children.length > 0 && (
                    <div className="mindmap-node-children">
                        {node.children.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    // --- Chat Management --- //
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const newMessages = category.messages || [];
        setMessages(newMessages);
    }, [category.messages]);
    
    useEffect(() => {
        updateCategory(nodes, messages);
    }, [nodes, messages]);

    const initializeChat = useCallback(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: category.systemPrompt,
                    tools: [{ googleSearch: {} }],
                },
                history: messages
                    .filter(m => !m.isLoading && m.text)
                    .map(m => ({
                        role: m.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: m.text }]
                    }))
            });
            chatRef.current = chatSession;
        } catch (e) {
            console.error(e);
            setError('Failed to initialize the chat session.');
        }
    }, [category.systemPrompt, messages]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);
    
    const handleSend = async (inputText: string) => {
        if (!inputText.trim()) return;
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            if (!chatRef.current) throw new Error("Chat is not initialized.");
            const response = await chatRef.current.sendMessage({ message: [{ text: inputText }] });
            const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: response.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Render --- //
    return (
        <div className="flex h-full w-full bg-background">
            {/* Whiteboard Area */}
            <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
                        <BrainCircuit size={32} className="text-primary" />
                        {category.name}
                    </h1>
                </header>
                <div className="flex-1 space-y-2 mindmap-container">
                    {nodeTree.map(node => renderNode(node))}
                    <button onClick={() => addNode('New idea...')} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-muted-foreground bg-muted rounded-lg hover:bg-border transition-colors">
                        <PlusCircle size={16} /> Add a new thought
                    </button>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="w-full max-w-sm border-l border-border flex flex-col bg-card/50">
                <header className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Idea Pad</h2>
                    <p className="text-xs text-muted-foreground">Use the AI to brainstorm, then add ideas to your board.</p>
                </header>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col gap-1 animate-fade-in-slide-up ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                           <div className={`group relative w-fit max-w-xs rounded-2xl px-4 py-2.5 text-base ${msg.sender === 'user' ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-card text-card-foreground shadow-sm'}`}>
                                <div className="prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text, {breaks: true}) }} />
                                {msg.sender === 'ai' && !isLoading && (
                                     <button onClick={() => addNode(msg.text)} title="Add to whiteboard" className="absolute -top-2 -right-2 p-1 bg-card rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                        <PlusCircle size={18} className="text-primary"/>
                                     </button>
                                )}
                           </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-sm text-muted-foreground">The assistant is thinking...</div>}
                    {error && <div className="text-sm text-red-500">{error}</div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-2 sm:p-3 border-t border-border bg-background/80 backdrop-blur-sm">
                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

// --- Chat Input for Whiteboard --- //
const ChatInput: React.FC<{ onSend: (text: string) => void, isLoading: boolean }> = ({ onSend, isLoading }) => {
    const [text, setText] = useState('');
    
    const handleSendClick = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };
    
    return (
        <div className="flex items-center gap-2 rounded-full bg-card p-1.5 shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendClick(); }}}
                placeholder="Brainstorm a topic..."
                className="w-full border-none bg-transparent py-2 px-3 text-foreground placeholder-muted-foreground focus:outline-none"
                disabled={isLoading}
            />
            <button
                onClick={handleSendClick}
                disabled={isLoading || !text.trim()}
                className="flex-shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground transition-transform hover:scale-110 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
                aria-label="Send message"
            >
                <Send size={18} />
            </button>
        </div>
    );
};

export default Whiteboard;