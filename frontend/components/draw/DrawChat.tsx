import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/types/draw';

interface DrawChatProps {
    chatLog: ChatMessage[];
    onGuess: (text: string) => void;
    disabled?: boolean;
    isDrawer?: boolean;
    guessesUsed?: number;
    lastHintAt?: number | null;
    lockedAt?: number | null;
    incorrectGuessCount?: number;
    hasGuessedCorrectly?: boolean;
}

export default function DrawChat({ chatLog = [], onGuess, disabled, isDrawer, guessesUsed = 0, lastHintAt, lockedAt, incorrectGuessCount = 0, hasGuessedCorrectly = false }: DrawChatProps) {
    const [inputValue, setInputValue] = useState('');
    const [lockCountdown, setLockCountdown] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatLog]);

    const MAX_GUESSES = 3;
    const guessesLeft = Math.max(0, MAX_GUESSES - guessesUsed);
    const outOfGuesses = guessesLeft === 0;

    useEffect(() => {
        if (!outOfGuesses || !lockedAt) {
            setLockCountdown(null);
            return;
        }
        
        const updateCountdown = () => {
            const unlocksAt = lockedAt + 1800;
            const remaining = Math.max(0, Math.ceil(unlocksAt - Date.now() / 1000));
            
            if (remaining <= 0) {
                setLockCountdown("Nu!");
                return;
            }
            
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            setLockCountdown(`${m}m ${s}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [outOfGuesses, lockedAt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || disabled || isDrawer || outOfGuesses || hasGuessedCorrectly) return;
        
        onGuess(inputValue.trim());
        setInputValue('');
    };

    return (
        <div className="flex flex-col h-full bg-brand-card/50 backdrop-blur-md rounded-xl shadow-xl border border-white/5 overflow-hidden">
            <div className="bg-black/20 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                    Gissningar
                </h3>
                <div className="flex items-center gap-4">
                    {/* Global Hint Tracker */}
                    <div className="flex items-center gap-1" title={`${incorrectGuessCount}/6 felgissningar till nästa ledtråd`}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div 
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < incorrectGuessCount ? 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.8)]' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>

                    {!isDrawer && (
                        <div className="flex gap-1.5" title={`${guessesLeft} gissningar kvar`}>
                            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                                <svg 
                                    key={i}
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor" 
                                    className={`w-3.5 h-3.5 transition-all duration-300 ${i < guessesLeft ? 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)] scale-100' : 'text-white/20 scale-75'}`}
                                >
                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                </svg>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px] md:min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
            >
                {chatLog.length === 0 ? (
                    <div className="text-center text-gray-400 italic mt-10">
                        Inga meddelanden än. Bli den första att gissa!
                    </div>
                ) : (
                    chatLog.map((msg, i) => {
                        const isHint = msg.is_system && msg.text.includes('Ledtråd:');
                        return (
                            <div 
                                key={i} 
                                className={`text-sm p-2 rounded-lg ${
                                    isHint
                                        ? 'bg-yellow-500/20 text-yellow-300 font-bold text-center border border-yellow-500/20'
                                        : msg.is_system 
                                            ? 'bg-blue-500/20 text-blue-300 font-bold text-center border border-blue-500/20'
                                            : 'bg-black/20 text-gray-200 border border-white/5'
                                }`}
                            >
                                {!msg.is_system && (
                                    <span className="font-bold mr-2 text-brand-primary">
                                        {msg.name}:
                                    </span>
                                )}
                                <span className={msg.is_system ? 'break-words' : 'break-all'}>
                                    {msg.text}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-black/30 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={disabled || isDrawer || outOfGuesses || hasGuessedCorrectly}
                        placeholder={
                            hasGuessedCorrectly
                                ? "Du har gissat rätt!"
                                : isDrawer 
                                    ? "Du ritar (kan inte gissa)" 
                                    : disabled 
                                        ? "Väntar..." 
                                        : outOfGuesses
                                            ? `Låst i ${lockCountdown || '...'}`
                                            : "Skriv din gissning här..."
                        }
                        className="w-full pl-4 pr-12 py-3 rounded-full border border-white/10 bg-black/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        maxLength={100}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || disabled || isDrawer || outOfGuesses}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-full disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}
