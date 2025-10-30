import React, { useMemo, useState } from 'react';
import { ChatMessage, CardArtifact, ChipArtifact } from '../types';
import { MapPin, Search, Paperclip, ChevronDown, Star, MessageSquareQuote, CheckCircle2, ImageOff, ThumbsUp, ThumbsDown, Info, Copy } from 'lucide-react';
import { marked } from 'marked';

interface ChatMessageItemProps {
    message: ChatMessage;
    onArtifactAction: (text: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onArtifactAction }) => {
    const isUser = message.sender === 'user';
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);
    
    if (message.isLoading) {
        return (
            <div className="flex items-end gap-3 animate-fade-in-slide-up justify-start">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                </div>
                <div className="w-fit max-w-md rounded-2xl rounded-bl-lg bg-card border border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
            </div>
        );
    }
    
    const { cleanText, quickReplies } = useMemo(() => {
        let text = message.text || '';
        const quickReplyRegex = /\[QUICK_REPLY:((?:"[^"]*?",?)*)\]/g;
        
        const extractedReplies: string[] = [];

        text = text.replace(quickReplyRegex, (_, replies) => {
            if (message.artifacts?.recommendationGroups) return ''; // Don't show quick replies if there are cards
            const parsedReplies = replies.split('","').map(r => r.replace(/"/g, '').trim());
            extractedReplies.push(...parsedReplies);
            return ''; // Remove the tag from text
        });

        return {
            cleanText: text.trim(),
            quickReplies: extractedReplies,
        };
    }, [message.text, message.artifacts]);

    const parsedText = useMemo(() => cleanText ? marked.parse(cleanText, { breaks: true, gfm: true }) : '', [cleanText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
    };

    return (
        <div className={`group flex flex-col gap-2 animate-fade-in-slide-up ${isUser ? 'items-end' : 'items-start'}`}>
            <div 
              className={`relative w-fit max-w-2xl rounded-2xl text-base ${isUser ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-card text-card-foreground border border-border'}`}
            >
                <div className="px-4 py-3">
                    {message.file && (
                        <div className="mb-2 rounded-lg border border-border bg-muted/30 p-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Paperclip size={16} />
                                <span>{message.file.name}</span>
                            </div>
                            {message.file.type.startsWith('image/') && (
                            <img src={message.file.url} alt={message.file.name} className="mt-2 max-h-48 rounded-md" />
                            )}
                            {message.file.type.startsWith('video/') && (
                            <video src={message.file.url} controls className="mt-2 max-h-48 rounded-md" />
                            )}
                        </div>
                    )}
                    {parsedText && (
                        <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3" dangerouslySetInnerHTML={{ __html: parsedText }} />
                    )}
                </div>
                
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 p-3 border-t border-border/80">
                        <button onClick={() => setIsSourcesOpen(!isSourcesOpen)} className="flex justify-between items-center w-full">
                          <h4 className={`text-xs font-semibold uppercase tracking-wider ${isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>Sources</h4>
                          <ChevronDown size={16} className={`transition-transform ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'} ${isSourcesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSourcesOpen && (
                          <div className="pt-2 flex flex-col gap-2 animate-fade-in" style={{animationDuration: '0.3s'}}>
                            {message.sources.map((source, i) => (
                                <div key={i}>
                                <a 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors ${
                                      isUser ? 'bg-black/10 hover:bg-black/20' : 'bg-muted/50 hover:bg-muted'
                                    }`}
                                >
                                    <div className={`flex-shrink-0 rounded-md p-1.5 ${isUser ? 'bg-black/10' : 'bg-card'}`}>
                                        {source.type === 'maps' ? <MapPin size={14} className="text-green-500"/> : <Search size={14} className="text-blue-500"/>}
                                    </div>
                                    <span className="truncate">{source.title || 'View Source'}</span>
                                </a>
                                {source.type === 'maps' && source.reviewSnippets && source.reviewSnippets.length > 0 && (
                                    <div className={`ml-5 mt-2 space-y-2 border-l-2 pl-4 ${isUser ? 'border-primary-foreground/30' : 'border-border'}`}>
                                        {source.reviewSnippets.slice(0, 2).map((review, idx) => (
                                            <div key={idx} className="text-xs">
                                                <div className="flex items-center gap-1">
                                                    <MessageSquareQuote size={12} className={isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}/>
                                                    <p className={isUser ? 'text-primary-foreground/90' : 'text-muted-foreground'}><span className="font-semibold">{review.author}</span> rated it <span className="font-semibold">{review.rating} ★</span></p>
                                                </div>
                                                <p className={`italic mt-0.5 ${isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>"{review.text}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                            ))}
                          </div>
                        )}
                    </div>
                )}
                 {!isUser && !message.isLoading && cleanText && (
                    <button onClick={handleCopy} title="Copy" className="absolute -top-3 -right-3 p-1.5 bg-card border border-border rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 text-muted-foreground hover:text-primary">
                        <Copy size={14}/>
                    </button>
                )}
            </div>
             {/* Artifacts Container */}
            {message.artifacts && !isUser && (
                <div className="w-full max-w-full space-y-6 animate-fade-in-slide-up">
                    {/* Recommendation Groups (Carousels) */}
                    {message.artifacts.recommendationGroups?.map((group, index) => (
                        <div key={index} className="space-y-3">
                            <h3 className="text-lg font-bold font-display text-foreground pl-2">{group.title}</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{scrollSnapType: 'x mandatory'}}>
                                {group.cards.map(card => (
                                    <div key={card.id} className="flex-shrink-0 w-64 bg-card rounded-xl border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col" style={{scrollSnapAlign: 'start'}}>
                                        {card.imageUrl ? 
                                            <img src={card.imageUrl} alt={card.title} className="w-full h-32 object-cover rounded-t-lg" /> :
                                            <div className="w-full h-32 bg-muted rounded-t-lg flex items-center justify-center">
                                                <ImageOff className="text-muted-foreground" />
                                            </div>
                                        }
                                        <div className="p-3 flex-1">
                                            <h4 className="font-bold text-card-foreground truncate">{card.title}</h4>
                                            {card.rating && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={14} className="text-amber-500" fill="currentColor"/>
                                                    <span className="text-sm font-bold text-muted-foreground">{card.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                            <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">{card.description}</p>
                                            
                                            {card.explanation && (
                                                <div className="mt-2 p-2 text-xs rounded-lg bg-muted/50 text-muted-foreground flex items-start gap-2">
                                                    <Info size={14} className="flex-shrink-0 mt-0.5 text-sky-500"/>
                                                    <span>{card.explanation}</span>
                                                </div>
                                            )}
                                            {card.socialProof && (
                                                <div className="mt-2 text-xs font-semibold text-rose-500">{card.socialProof}</div>
                                            )}
                                        </div>
                                        <div className="p-3 mt-auto border-t border-border flex items-center justify-between">
                                            <button onClick={() => onArtifactAction(`Show me fewer recommendations like '${card.title}'`)} title="Less like this" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors">
                                                <ThumbsDown size={16}/>
                                            </button>
                                            <button onClick={() => onArtifactAction(`Find more recommendations similar to '${card.title}'`)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                                                <span>More like this</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Chips */}
                    {message.artifacts.chips && message.artifacts.chips.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-2">
                            {message.artifacts.chips.map(chip => (
                                <button key={chip.id} onClick={() => onArtifactAction(chip.label)} className="px-4 py-2 text-sm font-semibold border rounded-full transition-colors bg-card border-border text-foreground hover:bg-muted">
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Map Link */}
                    {message.artifacts.map && (
                         <a href={`httpshttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(message.artifacts.map.query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/50 rounded-full shadow-sm hover:bg-green-100 dark:hover:bg-green-900 transition-all duration-200 ease-out transform hover:scale-105">
                            <MapPin size={16}/>
                            Show on Map: {message.artifacts.map.query}
                        </a>
                    )}
                </div>
            )}
            {quickReplies.length > 0 && (
                 <div className="flex flex-wrap gap-2 justify-start w-full max-w-2xl pl-2">
                    {quickReplies.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => onArtifactAction(reply)}
                            className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full shadow-sm hover:bg-primary/20 transition-all"
                        >
                            {reply}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatMessageItem;