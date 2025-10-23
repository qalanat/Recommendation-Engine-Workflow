import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GroundingChunk, LiveServerMessage, Modality, Blob } from "@google/genai";
import { UserProfile, ChatMessage, GroundingSource, Category, PersonalContextItem } from '../types';
import ChatMessageItem from './ChatMessage';
import ChatInput from './ChatInput';
import { AudioWaveform, MapPin } from 'lucide-react';
import { encode, decode, decodeAudioData } from './utils/audio';
import { playSound, startHapticPulse, stopHapticPulse } from './utils/ux';

interface UnifiedChatProps {
  user: UserProfile;
  category: Category;
  onUpdateCategory: (category: Category) => void;
  personalContext: PersonalContextItem[];
}

const UnifiedChat: React.FC<UnifiedChatProps> = ({ user, category, onUpdateCategory, personalContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(category.messages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
    const [liveTranscript, setLiveTranscript] = useState({ user: '', model: '' });
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentTranscriptionRef = useRef({ user: '', model: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages, liveTranscript]);

    useEffect(() => {
        if (isLoading) {
            startHapticPulse();
        } else {
            stopHapticPulse();
        }
        return () => stopHapticPulse();
    }, [isLoading]);
    
     useEffect(() => {
        onUpdateCategory({ ...category, messages });
    }, [messages]);

    const requestLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn(`Could not get user location: ${error.message}`);
                }
            );
        }
    }, []);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    const initializeChat = useCallback(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            let combinedSystemInstruction = category.systemPrompt;
            const contextString = personalContext
                .filter(item => item.answer.trim() !== '')
                .map(item => `- ${item.question}: ${item.answer}`)
                .join('\n');

            if (contextString) {
                combinedSystemInstruction += `\n\nFor your reference, here is some personal context provided by the user:\n${contextString}`;
            }

            if (userLocation) {
                 combinedSystemInstruction += `\n\nThe user's current location is approximately latitude ${userLocation.latitude}, longitude ${userLocation.longitude}. Use this for distance-based queries.`;
            }

            if(category.interactionMode === 'card') {
                combinedSystemInstruction += `\n\nIMPORTANT: You are in Card-based UI mode. Your response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks or any other text. The JSON object must have a 'text' property with your conversational response, and can optionally have 'cards', 'chips', and 'map' properties.
- 'text': Your textual response to the user.
- 'cards': An array of objects, where each object has 'id' (a unique string), 'title' (string), 'description' (string), and optional 'imageUrl' (string URL).
- 'chips': An array of objects, where each object has 'id' (a unique string) and 'label' (string).
- 'map': An object with a 'query' property (e.g., "coffee shops near me" or a specific address).

Example:
{"text": "Great! To help me find the perfect cologne, what scent family are you drawn to?", "cards": [{"id": "c1", "title": "Woody", "description": "Earthy and masculine scents.", "imageUrl": "https://example.com/woody.jpg"}, {"id": "c2", "title": "Citrus", "description": "Fresh and zesty notes."}], "chips": []}`;
            }

            const chatSession = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: combinedSystemInstruction,
                    tools: [{ googleSearch: {} }, { googleMaps: {} }],
                    thinkingConfig: { thinkingBudget: 32768 }
                },
                history: category.messages
                    .filter(m => !m.isLoading && m.text) // Filter out loading messages and ensure text exists
                    .map(m => ({
                        role: m.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: m.text }]
                    }))
            });
            chatRef.current = chatSession;
             if (messages.length === 0 && category.id.startsWith('rec-')) {
              const greetings = [
                  `Hello ${user.name}! What can I help you discover today?`,
                  `Hi ${user.name}! Let's find something amazing for you.`,
                  `Welcome back, ${user.name}! What adventure are we planning?`,
                  `Hey ${user.name}! I'm here to help. What are you in the mood for?`,
              ];
              const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
              setMessages([{ 
                id: 'init',
                sender: 'ai', 
                text: randomGreeting
              }]);
            }
        } catch (e) {
            console.error(e);
            setError('Failed to initialize the chat session.');
        }
    }, [user.name, category.systemPrompt, category.messages, personalContext, category.interactionMode, userLocation]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);
    
    const handleSend = async (inputText: string, file?: ChatMessage['file']) => {
        if (!inputText.trim() && !file) return;
        playSound('send');

        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputText, file };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            if (!chatRef.current) throw new Error("Chat is not initialized.");
            
            const messageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [{ text: inputText }];
            if (file) {
                 messageParts.push({
                    inlineData: { data: file.base64, mimeType: file.type },
                });
            }
            
            const response = await chatRef.current.sendMessage({ message: messageParts });

            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            let sources: GroundingSource[] = groundingChunks?.map((chunk: GroundingChunk) => {
                if (chunk.web) {
                    return { uri: chunk.web.uri, title: chunk.web.title ?? '', type: 'web' as const };
                }
                if (chunk.maps) {
                     const reviewSnippets = chunk.maps.placeAnswerSources?.reviewSnippets?.map(rs => ({
                        text: (rs as any).text,
                        author: (rs as any).authorName,
                        rating: (rs as any).starRating,
                    })) || [];
                    return { uri: chunk.maps.uri, title: chunk.maps.title ?? '', type: 'maps' as const, reviewSnippets };
                }
                return null;
            }).filter(Boolean) ?? [];

            let aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: response.text, sources };

            if(category.interactionMode === 'card') {
                try {
                    // Find the first and last curly braces to extract the JSON object
                    const startIndex = response.text.indexOf('{');
                    const endIndex = response.text.lastIndexOf('}');
                    if (startIndex !== -1 && endIndex !== -1) {
                        const jsonString = response.text.substring(startIndex, endIndex + 1);
                        const parsedResponse = JSON.parse(jsonString);
                        aiMessage = {
                            ...aiMessage,
                            text: parsedResponse.text || '',
                            artifacts: {
                                cards: parsedResponse.cards,
                                chips: parsedResponse.chips,
                                map: parsedResponse.map ? {...parsedResponse.map, userLocation} : undefined
                            }
                        };
                    }
                } catch (parseError) {
                    console.warn("Failed to parse card JSON, falling back to text.", parseError);
                    // The message already contains the raw text, so no action needed.
                }
            }
            
            setMessages(prev => [...prev, aiMessage]);

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, sender: 'ai', text: `Sorry, an error occurred: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const stopLiveConversation = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
         if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        
        setInputMode('text');
        setLiveTranscript({ user: '', model: '' });
        currentTranscriptionRef.current = { user: '', model: '' };
        setError(null);
        playSound('stop');
    }, []);

    const startLiveConversation = useCallback(async () => {
        if (inputMode === 'audio') return;
        playSound('start');

        setInputMode('audio');
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are a helpful assistant. The user's name is ${user.name}. Keep responses concise and conversational.`
                },
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(console.error);
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
                            setLiveTranscript(prev => ({ ...prev, user: currentTranscriptionRef.current.user }));
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentTranscriptionRef.current.model += message.serverContent.outputTranscription.text;
                             setLiveTranscript(prev => ({ ...prev, model: currentTranscriptionRef.current.model }));
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullUser = currentTranscriptionRef.current.user;
                            const fullModel = currentTranscriptionRef.current.model;
                            if (fullUser || fullModel) {
                                // Add user turn to chat history
                                if(fullUser) {
                                    setMessages(prev => [...prev, {
                                        id: `user-${Date.now()}`,
                                        sender: 'user',
                                        text: fullUser
                                    }]);
                                }
                                 // Add model turn to chat history
                                if(fullModel) {
                                    setMessages(prev => [...prev, {
                                        id: `ai-${Date.now()}`,
                                        sender: 'ai',
                                        text: fullModel
                                    }]);
                                }
                            }
                            currentTranscriptionRef.current = { user: '', model: '' };
                            setLiveTranscript({ user: '', model: '' });
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);
                            
                            sourceNode.addEventListener('ended', () => audioSourcesRef.current.delete(sourceNode));
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(sourceNode);
                        }

                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live session error:", e);
                        setError('An error occurred during the live session.');
                        stopLiveConversation();
                    },
                    onclose: () => {
                        // Don't auto-stop on close unless there's an error.
                    },
                }
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (e) {
            console.error(e);
            setError('Failed to start session. Check microphone permissions.');
            setInputMode('text');
        }
    }, [inputMode, user.name, stopLiveConversation]);

    const handleAudioToggle = useCallback(() => {
        if (inputMode === 'audio') {
            stopLiveConversation();
        } else {
            startLiveConversation();
        }
    }, [inputMode, startLiveConversation, stopLiveConversation]);

    const handleArtifactAction = (prompt: string) => {
        handleSend(prompt);
    }

    return (
        <div className="flex h-full flex-col bg-transparent">
            <header className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 p-4 shrink-0">
                 <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100">{category.name}</h1>
                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize flex items-center gap-1.5">
                        {category.interactionMode} Mode 
                        {userLocation && <span className="flex items-center gap-1"><MapPin size={12} className="text-green-500" /> Location On</span>}
                    </p>
                </div>
                 {inputMode === 'audio' && (
                    <div className="flex items-center gap-2 text-[#E07A5F] animate-pulse">
                        <AudioWaveform size={20} />
                        <span>Live Conversation</span>
                    </div>
                )}
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((msg) => (
                    <ChatMessageItem key={msg.id} message={msg} onArtifactAction={handleArtifactAction} />
                ))}
                 {inputMode === 'audio' && (
                    <div className="p-3 space-y-2 text-sm text-stone-600 animate-fade-in-slide-up">
                        {liveTranscript.user && (
                            <div className="flex justify-end">
                                <p className="p-3 rounded-2xl max-w-lg bg-orange-100 text-orange-900 opacity-80">{liveTranscript.user}</p>

                            </div>
                        )}
                        {liveTranscript.model && (
                             <div className="flex justify-start items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400 ai-speaking-indicator"></div>
                                <p className="p-3 rounded-2xl max-w-lg bg-stone-200 text-stone-800 opacity-80">{liveTranscript.model}</p>
                            </div>
                        )}
                    </div>
                )}
                {isLoading && <ChatMessageItem message={{ id: 'loading', sender: 'ai', text: '', isLoading: true }} onArtifactAction={() => {}} />}
                {error && <div className="rounded-2xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-300">{error}</div>}
                <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-stone-200 dark:border-stone-700 p-2 sm:p-4 glassmorphic">
                <ChatInput
                    onSend={handleSend}
                    onAudioToggle={handleAudioToggle}
                    isLoading={isLoading}
                    inputMode={inputMode}
                />
            </footer>
        </div>
    );
};

export default UnifiedChat;
