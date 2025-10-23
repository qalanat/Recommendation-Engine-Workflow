import React, { useMemo, useState } from 'react';
import { ChatMessage, CardArtifact, ChipArtifact } from '../types';
import { MapPin, Search, Paperclip, ChevronDown, Star, MessageSquareQuote, CheckCircle2, ImageOff } from 'lucide-react';
import { marked } from 'marked';

interface ChatMessageItemProps {
    message: ChatMessage;
    onArtifactAction: (text: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onArtifactAction }) => {
    const isUser = message.sender === 'user';
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);
    
    // State for card/chip selections
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    const [selectedChipIds, setSelectedChipIds] = useState<Set<string>>(new Set());

    if (message.isLoading) {
        return (
            <div className="flex items-end gap-3 animate-fade-in-slide-up justify-start">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700">
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                </div>
                <div className="w-fit max-w-md rounded-2xl rounded-bl-lg bg-stone-200 dark:bg-stone-700 px-4 py-3">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Thinking...</p>
                </div>
            </div>
        );
    }
    
    const { cleanText, quickReplies, reviews } = useMemo(() => {
        let text = message.text || '';
        const quickReplyRegex = /\[QUICK_REPLY:((?:"[^"]*?",?)*)\]/g;
        const reviewRegex = /\[REVIEW: "([^"]+)", "([^"]+)", "([^"]+)"\]/g;
        
        const extractedReplies: string[] = [];
        const extractedReviews: { author: string, rating: string, text: string }[] = [];

        text = text.replace(quickReplyRegex, (_, replies) => {
            if (message.artifacts) return ''; // Don't show quick replies if there are cards
            const parsedReplies = replies.split('","').map(r => r.replace(/"/g, '').trim());
            extractedReplies.push(...parsedReplies);
            return ''; // Remove the tag from text
        });

        text = text.replace(reviewRegex, (_, author, rating, reviewText) => {
            extractedReviews.push({ author, rating, text: reviewText });
            return ''; // Remove the tag from text
        });

        return {
            cleanText: text.trim(),
            quickReplies: extractedReplies,
            reviews: extractedReviews,
        };
    }, [message.text, message.artifacts]);

    const parsedText = cleanText ? marked.parse(cleanText) : '';
    
    const handleToggleCard = (id: string) => {
        setSelectedCardIds(prev => {
            const newSet = new Set(prev);
            if(newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }

    const handleToggleChip = (id: string) => {
        setSelectedChipIds(prev => {
            const newSet = new Set(prev);
            if(newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }

    const handleContinue = () => {
        const selectedCards = message.artifacts?.cards?.filter(c => selectedCardIds.has(c.id)) || [];
        const selectedCardTitles = selectedCards.map(c => c.title);

        const selectedChips = message.artifacts?.chips?.filter(c => selectedChipIds.has(c.id)) || [];
        const selectedChipLabels = selectedChips.map(c => c.label);

        const selections = [...selectedCardTitles, ...selectedChipLabels];
        if(selections.length > 0) {
            const prompt = `I've selected: ${selections.join(', ')}.`;
            onArtifactAction(prompt);
        }
    };

    return (
        <div className={`flex flex-col gap-2 animate-fade-in-slide-up ${isUser ? 'items-end' : 'items-start'}`}>
            <div 
              className={`w-fit max-w-2xl rounded-2xl p-4 text-base ${isUser ? 'rounded-br-none bg-[#E07A5F] text-white' : 'rounded-bl-none bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'}`}
            >
                {message.file && (
                    <div className="mb-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/50 p-2">
                        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
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
                    <div className="prose prose-stone dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-table:w-full prose-th:bg-stone-100 prose-th:p-2 prose-td:p-2 dark:prose-th:bg-stone-600" dangerouslySetInnerHTML={{ __html: parsedText }} />
                )}
                
                {reviews.length > 0 && (
                     <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-600/60 space-y-3">
                         <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">User Reviews</h4>
                         {reviews.map((review, i) => (
                             <div key={i} className="rounded-lg bg-stone-100/70 dark:bg-stone-800/50 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm text-stone-700 dark:text-stone-200">{review.author}</p>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star size={14} fill="currentColor"/>
                                        <span className="text-sm font-bold">{review.rating}</span>
                                    </div>
                                </div>
                                <p className="text-stone-600 dark:text-stone-300 text-sm mt-1">"{review.text}"</p>
                            </div>
                         ))}
                     </div>
                )}


                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-600/60">
                        <button onClick={() => setIsSourcesOpen(!isSourcesOpen)} className="flex justify-between items-center w-full">
                          <h4 className={`text-xs font-semibold uppercase tracking-wider ${isUser ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>Sources</h4>
                          <ChevronDown size={16} className={`transition-transform ${isUser ? 'text-white/70' : 'text-stone-400 dark:text-stone-500'} ${isSourcesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`sources-container ${isSourcesOpen ? 'open' : ''}`}>
                          <div className="sources-content pt-2 flex flex-col gap-2">
                            {message.sources.map((source, i) => (
                                <div key={i}>
                                <a 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors ${
                                      isUser ? 'bg-white/20 hover:bg-white/40' : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-600'
                                    }`}
                                >
                                    <div className={`flex-shrink-0 rounded-md p-1.5 ${isUser ? 'bg-white/20' : 'bg-white dark:bg-stone-600'}`}>
                                        {source.type === 'maps' ? <MapPin size={14} className="text-green-500"/> : <Search size={14} className="text-blue-500"/>}
                                    </div>
                                    <span className={`truncate ${isUser ? 'text-white' : 'text-stone-700 dark:text-stone-200'}`}>{source.title || 'View Source'}</span>
                                </a>
                                {source.type === 'maps' && source.reviewSnippets && source.reviewSnippets.length > 0 && (
                                    <div className={`ml-5 mt-2 space-y-2 border-l-2 pl-4 ${isUser ? 'border-white/30' : 'border-stone-200 dark:border-stone-600'}`}>
                                        {source.reviewSnippets.slice(0, 2).map((review, idx) => (
                                            <div key={idx} className="text-xs">
                                                <div className="flex items-center gap-1">
                                                    <MessageSquareQuote size={12} className={isUser ? 'text-white/60' : 'text-stone-400'}/>
                                                    <p className={isUser ? 'text-white/90' : 'text-stone-500 dark:text-stone-400'}><span className={isUser ? 'font-semibold text-white' : 'font-semibold text-stone-600 dark:text-stone-300'}>{review.author}</span> rated it <span className="font-semibold">{review.rating} ★</span></p>
                                                </div>
                                                <p className={`italic mt-0.5 ${isUser ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>"{review.text}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                            ))}
                          </div>
                        </div>
                    </div>
                )}
            </div>
             {/* Artifacts Container */}
            {message.artifacts && !isUser && (
                <div className="w-full max-w-2xl pl-2 space-y-4 animate-fade-in-slide-up">
                    {/* Cards */}
                    {message.artifacts.cards && message.artifacts.cards.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {message.artifacts.cards.map(card => (
                                <button key={card.id} onClick={() => handleToggleCard(card.id)} className={`relative text-left rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.03] focus:outline-none ${selectedCardIds.has(card.id) ? 'border-orange-400 shadow-lg' : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'}`}>
                                    <div className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/70 backdrop-blur-sm dark:bg-black/50">
                                        <CheckCircle2 size={20} className={`transition-colors ${selectedCardIds.has(card.id) ? 'text-orange-500 fill-orange-100 dark:fill-orange-900/50' : 'text-stone-300 dark:text-stone-500'}`} />
                                    </div>
                                    {card.imageUrl ? 
                                        <img src={card.imageUrl} alt={card.title} className="w-full h-32 object-cover rounded-t-lg" /> :
                                        <div className="w-full h-32 bg-stone-200 dark:bg-stone-700 rounded-t-lg flex items-center justify-center">
                                            <ImageOff className="text-stone-400 dark:text-stone-500" />
                                        </div>
                                    }
                                    <div className="p-3 bg-white dark:bg-stone-700 rounded-b-lg">
                                        <h4 className="font-semibold text-stone-800 dark:text-stone-100">{card.title}</h4>
                                        <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">{card.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {/* Chips */}
                    {message.artifacts.chips && message.artifacts.chips.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {message.artifacts.chips.map(chip => (
                                <button key={chip.id} onClick={() => handleToggleChip(chip.id)} className={`px-4 py-2 text-sm font-semibold border rounded-full transition-colors ${selectedChipIds.has(chip.id) ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-400 text-orange-700 dark:text-orange-200' : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-600'}`}>
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}
                    {/* Map Link */}
                    {message.artifacts.map && (
                         <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(message.artifacts.map.query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/50 rounded-full shadow-sm hover:bg-green-100 dark:hover:bg-green-900 transition-all duration-200 ease-out transform hover:scale-105">
                            <MapPin size={16}/>
                            Show on Map: {message.artifacts.map.query}
                        </a>
                    )}
                    {(message.artifacts.cards?.length || message.artifacts.chips?.length) ? (
                        <div className="pt-2">
                             <button onClick={handleContinue} className="px-5 py-2.5 text-sm font-bold text-white bg-[#E07A5F] rounded-full shadow-md hover:bg-opacity-90 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100" disabled={selectedCardIds.size === 0 && selectedChipIds.size === 0}>
                                Continue
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
            {quickReplies.length > 0 && (
                 <div className="flex flex-wrap gap-2 justify-start w-full max-w-2xl pl-2">
                    {quickReplies.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => onArtifactAction(reply)}
                            className="px-4 py-2 text-sm font-semibold text-[#E07A5F] bg-white dark:bg-stone-700 dark:text-orange-300 rounded-full shadow-sm hover:bg-orange-50 dark:hover:bg-stone-600 transition-all duration-200 ease-out transform hover:scale-105"
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
