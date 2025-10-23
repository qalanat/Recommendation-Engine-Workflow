import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Mic, Paperclip, X } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInputProps {
    onSend: (text: string, file?: ChatMessage['file']) => void;
    onAudioToggle: () => void;
    isLoading: boolean;
    inputMode: 'text' | 'audio';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onAudioToggle, isLoading, inputMode }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState<ChatMessage['file'] | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSendClick = () => {
        if (text.trim() || file) {
            onSend(text, file);
            setText('');
            setFile(undefined);
            if(fileInputRef.current) fileInputRef.current.value = "";
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };
    
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFile({
                    name: selectedFile.name,
                    type: selectedFile.type,
                    url: URL.createObjectURL(selectedFile),
                    base64: (reader.result as string).split(',')[1]
                });
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    const isRecording = inputMode === 'audio';
    const canSend = (text.trim().length > 0 || !!file) && !isRecording;

    return (
        <div className="flex items-end gap-2 rounded-full bg-white dark:bg-stone-800 p-2 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700 focus-within:ring-[#E07A5F] transition-shadow">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isLoading}
                className="flex-shrink-0 rounded-full p-3 text-stone-500 dark:text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-100 disabled:opacity-50 icon-snap"
                aria-label="Attach file"
            >
                <Paperclip size={22} />
            </button>
            <div className="relative flex-1">
                {file && (
                     <div className="absolute bottom-full left-0 mb-1 w-full animate-fade-in-slide-up">
                        <div className="flex items-center justify-between rounded-lg bg-stone-700/90 p-2 text-sm text-white backdrop-blur-sm">
                            <span className="truncate text-stone-100">{file.name}</span>
                            <button onClick={() => setFile(undefined)} className="rounded-full p-1 hover:bg-stone-600">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (canSend) handleSendClick();
                        }
                    }}
                    placeholder={isRecording ? "Listening..." : "Type a message..."}
                    className="w-full max-h-36 resize-none border-none bg-transparent py-3 px-2 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none"
                    rows={1}
                    disabled={isRecording}
                />
            </div>
            {canSend ? (
                 <button
                    onClick={handleSendClick}
                    disabled={isLoading}
                    className="flex-shrink-0 rounded-full bg-[#E07A5F] p-3 text-white transition-transform hover:scale-110 disabled:scale-100 disabled:bg-stone-400 dark:disabled:bg-stone-600"
                    aria-label="Send message"
                >
                    <Send size={22} />
                </button>
            ) : (
                <button
                    onClick={onAudioToggle}
                    disabled={isLoading && !isRecording}
                    className={`relative flex-shrink-0 rounded-full p-3 text-white transition-colors ${
                        isRecording ? 'bg-red-500 mic-glow z-10' : 'bg-[#81B29A]'
                    }`}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    <Mic size={22} />
                </button>
            )}
        </div>
    );
};

export default ChatInput;