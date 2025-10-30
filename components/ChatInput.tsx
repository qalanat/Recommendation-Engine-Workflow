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
        <div className="relative w-full">
            {file && (
                <div className="absolute bottom-full left-0 mb-2 w-full animate-fade-in-slide-up">
                    <div className="ml-12 flex items-center justify-between rounded-lg bg-card/80 p-2 text-sm backdrop-blur-sm border border-border">
                        <span className="truncate text-foreground font-medium">{file.name}</span>
                        <button onClick={() => setFile(undefined)} className="rounded-full p-1 hover:bg-muted">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex items-end gap-2 rounded-full bg-card p-2 shadow-sm border border-border focus-within:ring-2 focus-within:ring-ring transition-all">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording || isLoading}
                    className="flex-shrink-0 rounded-full p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    aria-label="Attach file"
                >
                    <Paperclip size={20} />
                </button>
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
                    className="w-full max-h-36 resize-none border-none bg-transparent py-2.5 px-1 text-base text-foreground placeholder-muted-foreground focus:outline-none"
                    rows={1}
                    disabled={isRecording}
                />
                {canSend ? (
                     <button
                        onClick={handleSendClick}
                        disabled={isLoading}
                        className="flex-shrink-0 rounded-full bg-primary p-3 text-primary-foreground transition-transform hover:scale-110 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
                        aria-label="Send message"
                    >
                        <Send size={20} />
                    </button>
                ) : (
                    <button
                        onClick={onAudioToggle}
                        disabled={isLoading && !isRecording}
                        className={`relative flex-shrink-0 rounded-full p-3 text-primary-foreground transition-colors ${
                            isRecording ? 'bg-red-500 mic-glow z-10' : 'bg-secondary'
                        }`}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        <Mic size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;