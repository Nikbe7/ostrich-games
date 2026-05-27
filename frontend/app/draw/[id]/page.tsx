'use client';

import React, { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSessionId, getPlayerName, setPlayerName, setLastGameId, clearLastGameId } from '@/utils/session';

import DrawPlayerList from '@/components/draw/DrawPlayerList';
import Canvas from '@/components/draw/Canvas';

const AbandonRoundButton = ({ startedAt, onAbandon }: { startedAt: number, onAbandon: () => void }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const unlockTime = startedAt + 14400; // 4 hours in seconds
            const now = Date.now() / 1000;
            return Math.max(0, Math.floor(unlockTime - now));
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [startedAt]);

    const canAbandon = timeLeft <= 0;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <button
            onClick={canAbandon ? onAbandon : undefined}
            disabled={!canAbandon}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl shadow-lg transition-all ${
                canAbandon 
                ? 'bg-red-600/90 hover:bg-red-500 text-white cursor-pointer' 
                : 'bg-gray-800/80 text-gray-400 cursor-not-allowed border border-gray-700/50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
            {canAbandon ? 'Avsluta runda i förtid' : `Kan avbrytas om ${formatTime(timeLeft)}`}
        </button>
    );
};

import DrawTools from '@/components/draw/DrawTools';
import DrawChat from '@/components/draw/DrawChat';
import StatusOverlay from '@/components/StatusOverlay';
import MobileSidebar from '@/components/MobileSidebar';
import SoundToggle from '@/components/SoundToggle';
import DrawRulesModal from '@/components/draw/DrawRulesModal';
import GameHistory from '@/components/GameHistory';
import { useDrawSocket } from '@/hooks/useDrawSocket';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
const RoundTimer = ({ deadline, startedAt }: { deadline: number | null, startedAt?: number | null }) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        // Fallback calculation in case backend doesn't send drawingDeadline
        const effectiveDeadline = deadline || (startedAt ? startedAt + 86400 : null);
        
        if (!effectiveDeadline) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil(effectiveDeadline - Date.now() / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [deadline, startedAt]);

    // Display loading state if null to avoid it suddenly popping in or being hidden
    if (timeLeft === null) {
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400/50 bg-amber-400/5 px-2 py-1 rounded-md border border-amber-400/10 shrink-0 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>--h --m</span>
            </div>
        );
    }

    if (timeLeft === 0) return null;

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const timeString = hours > 0 
        ? `${hours}h ${minutes}m`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20 shrink-0" title="Tid kvar">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{timeString}</span>
        </div>
    );
};

export default function DrawGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const gameId = id.toUpperCase();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [sessionId, setSessionId] = useState('');
    const [name, setName] = useState('');
    const [wordInput, setWordInput] = useState('');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    
    // Draw tools state
    const [color, setColor] = useState('#000000');
    const [thickness, setThickness] = useState(6);
    const [showSecretWordUI, setShowSecretWordUI] = useState(false);
    const [wordChoices, setWordChoices] = useState<string[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [viewingHistory, setViewingHistory] = useState<any>(null);

    const {
        game,
        trueId,
        isConnected,
        error,
        notification,
        showConfetti,
        drawLine,
        clearCanvas,
        abandonRound,
        chatGuess,
        submitWord,
        resetGame,
        cancelStart,
        forceReset,
        fetchSecretWord,
        secretWord
    } = useDrawSocket(gameId, sessionId, name);

    useEffect(() => {
        const sid = getSessionId();
        setSessionId(sid);
        const savedName = getPlayerName();

        if (!savedName) {
            const inputName = prompt('Ange ditt namn för att gå med:');
            if (inputName) {
                setPlayerName(inputName);
                setName(inputName);
            } else {
                router.push('/');
                return;
            }
        } else {
            setName(savedName);
        }
    }, [router]);

    useEffect(() => {
        if (gameId) {
            setLastGameId(gameId);
        }
    }, [router, gameId]);

    const handleAbandonRound = () => {
        setShowConfirmModal(true);
    };

    const confirmAbandonRound = () => {
        setShowConfirmModal(false);
        abandonRound();
    };

    useEffect(() => {
        if (game?.status !== 'drawing') {
            setShowSecretWordUI(false);
        }
    }, [game?.status]);

    const handleLeaveGame = () => {
        clearLastGameId();
        router.push('/');
    };

    const myId = trueId || user?.id || sessionId;
    const playerMe = game?.players.find(p => p.sessionId === myId || p.sessionId === trueId || p.sessionId === user?.id || p.sessionId === sessionId || p.name === name);
    const isChooser = game?.wordChooser === myId || game?.wordChooser === trueId || game?.wordChooser === user?.id || game?.wordChooser === sessionId || playerMe?.is_chooser || (playerMe && game?.wordChooser === playerMe.sessionId) || false;
    const isMyTurnToChoose = isChooser && game?.status === 'choosing';
    const isDrawingPhase = game?.status === 'drawing';

    useEffect(() => {
        if (isMyTurnToChoose && wordChoices.length === 0) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/draw/random-words`)
                .then(res => res.json())
                .then(data => {
                    if (data.words) setWordChoices(data.words);
                })
                .catch(() => showToast('Kunde inte hämta ordval.', 'error'));
        }
        
        // Reset choices if it's not our turn to choose anymore
        if (!isMyTurnToChoose && wordChoices.length > 0) {
            setWordChoices([]);
        }
    }, [isMyTurnToChoose, wordChoices.length, showToast]);
    return (
        <div className="game-layout bg-transparent text-white relative h-screen max-h-screen overflow-hidden flex flex-col md:flex-row">
            {/* Using StatusOverlay with cast since it expects Hangman Game type, but they share enough fields */}
            <StatusOverlay
                game={game as any}
                sessionId={sessionId}
                error={error}
                notification={notification}
                showConfetti={showConfetti}
                onNewGame={resetGame}
                onCancelStart={cancelStart}
                onForceReset={forceReset}
            />

            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-3 py-2 bg-brand-card/80 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
                <button onClick={handleLeaveGame} className="text-gray-300 text-sm p-1.5 rounded hover:bg-white/10 transition-colors">←</button>
                <div className="flex items-center gap-2 overflow-hidden mx-2">
                    <span className="text-sm font-bold truncate">Rita & Gissa</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <SoundToggle />
                    <button onClick={() => setShowMobileSidebar(true)} className="text-gray-300 p-1.5 rounded hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </button>
                </div>
            </div>

            <MobileSidebar
                isOpen={showMobileSidebar}
                onClose={() => setShowMobileSidebar(false)}
                gameId={gameId}
                game={game as any}
                sessionId={sessionId}
                onLeave={handleLeaveGame}
            />

            {/* Left Sidebar */}
            <aside className="game-sidebar bg-brand-card/50 backdrop-blur-md p-3 border-r border-white/5 flex flex-col gap-3 z-10">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold flex-1 flex items-center gap-2 min-w-0">
                        <span className="truncate">Rum: {gameId}</span>
                    </h1>
                    <div className="flex items-center gap-1 shrink-0">
                        <SoundToggle />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(gameId);
                                showToast('Spel-ID kopierat!', 'info');
                            }}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0"
                            title="Kopiera Spel-ID"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        </button>
                    </div>
                </div>

                {game && (
                    <div className="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
                        <DrawPlayerList players={game.players} currentChooserId={game.wordChooser || ''} currentPlayerId={sessionId} />
                        {game.history && game.history.length > 0 && (
                            <GameHistory
                                history={game.history}
                                players={game.players}
                                onItemClick={setViewingHistory}
                                selectedIndex={viewingHistory ? game.history.indexOf(viewingHistory) : -1}
                            />
                        )}
                    </div>
                )}

                <div className="border-t border-white/5 pt-3 shrink-0">
                    <DrawRulesModal />
                    <button
                        onClick={handleLeaveGame}
                        className="w-full flex items-center justify-center gap-2 text-gray-300 text-sm border border-white/10 hover:bg-white/5 p-2 rounded transition-colors"
                    >
                        ← Tillbaka
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 p-2 md:p-4 relative flex flex-col">
                {!game ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                        <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                        <p>{isConnected ? 'Ansluter...' : 'Väntar på server...'}</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row gap-4 h-full">
                        {/* Canvas & Tools Column */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                            {/* Word Header */}
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center flex items-center justify-center relative min-h-[60px]">
                                {(game.status === 'drawing' || viewingHistory) && (
                                    <>
                                        <div className="text-2xl font-mono tracking-[0.2em] font-bold text-white">
                                            {viewingHistory ? viewingHistory.word : (isChooser || game.correctGuessers?.includes(myId) || game.correctGuessers?.includes(sessionId) || (user?.id && game.correctGuessers?.includes(user.id))
                                                ? game.word 
                                                : game.word.split('').map((char, index) => 
                                                    (game.revealedIndices || []).includes(index) || char === ' ' ? char : '_'
                                                  ).join(' '))}
                                        </div>
                                        {!viewingHistory && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <RoundTimer deadline={game.drawingDeadline || null} startedAt={game.drawingStartedAt || null} />
                                            </div>
                                        )}
                                    </>
                                )}
                                {game.status === 'choosing' && !viewingHistory && (
                                    <div className="text-xl font-bold animate-pulse text-brand-primary">
                                        {isChooser ? 'Välj ett ord!' : 'Väntar på att ord väljs...'}
                                    </div>
                                )}
                                {game.status === 'waiting' && (
                                    <div className="text-xl text-gray-400">Väntar på att spelet ska starta</div>
                                )}
                                {game.status === 'finished' && (
                                    <div className="text-xl font-bold text-green-400">
                                        Ordet var: {game.word}
                                    </div>
                                )}
                            </div>

                            {/* Center Action Area (Canvas or Choose Word) */}
                            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                                {isMyTurnToChoose && !viewingHistory ? (
                                    <div className="w-full max-w-md bg-brand-card/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-brand-primary/30 animate-fadeIn">
                                        <div className="flex flex-col gap-6">
                                            <div className="text-center relative">
                                                <h2 className="text-2xl font-bold text-white mb-2">Välj ett ord att rita!</h2>
                                                <p className="text-gray-300 text-sm">Klicka på ett ord nedan för att börja runda.</p>
                                                <div className="absolute right-0 top-0">
                                                    <RoundTimer deadline={game.chooserDeadline || null} />
                                                </div>
                                            </div>
                                            
                                            {wordChoices.length === 0 ? (
                                                <div className="flex justify-center p-8">
                                                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {wordChoices.map((choice, i) => {
                                                        const diff = i === 0 ? { label: 'Lätt', color: 'bg-green-500/20 text-green-400 border-green-500/30 group-hover:bg-green-500/30' }
                                                                    : i === 1 ? { label: 'Medium (+1p)', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 group-hover:bg-yellow-500/30' }
                                                                    : { label: 'Svår (+2p)', color: 'bg-red-500/20 text-red-400 border-red-500/30 group-hover:bg-red-500/30' };
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => submitWord(choice)}
                                                                className="group w-full py-4 px-6 bg-black/40 hover:bg-brand-primary/20 border border-white/10 hover:border-brand-primary/50 text-white font-bold text-xl rounded-xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between"
                                                            >
                                                                <span>{choice}</span>
                                                                <span className={`text-xs px-3 py-1 rounded-full border transition-colors ${diff.color}`}>
                                                                    {diff.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="flex justify-center mt-2">
                                                <button
                                                    onClick={() => cancelStart()}
                                                    className="text-xs text-red-400 hover:text-red-300 underline decoration-red-500/30 transition-colors"
                                                >
                                                    Ångra och låt någon annan välja
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : game.status === 'choosing' && !viewingHistory ? (
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]"></div>
                                        <div className="text-xl font-bold text-gray-300 drop-shadow-md">
                                            Väntar på att <span className="text-brand-primary">{game.players.find((p: any) => p.sessionId === game.wordChooser)?.name || 'någon'}</span> ska välja ord...
                                        </div>
                                        <RoundTimer deadline={game.chooserDeadline || null} />
                                        {game.chooserTimedOut && (
                                            <button
                                                onClick={forceReset}
                                                className="mt-4 bg-red-600/90 hover:bg-red-500 text-white text-sm font-bold py-2 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                                            >
                                                ⚡ Tvinga nytt spel
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col items-center h-full max-h-full">
                                        <Canvas 
                                            lines={viewingHistory ? viewingHistory.lines : game.lines} 
                                            isDrawer={!viewingHistory && isChooser && isDrawingPhase}
                                            color={color}
                                            thickness={thickness}
                                            onDrawEnd={drawLine}
                                            startedAt={(!viewingHistory && game.status === 'drawing') ? (game.drawingStartedAt || undefined) : undefined}
                                        />
                                        {!viewingHistory && isChooser && isDrawingPhase && (
                                            <div className="mt-3 w-full relative flex items-center justify-center">
                                                {/* Potential Score Indicator */}
                                                {(() => {
                                                    const hints = game.revealedIndices?.length || 0;
                                                    const base = hints === 0 ? 3 : hints === 1 ? 2 : 1;
                                                    const bonus = game.wordDifficulty === 'hard' ? 2 : game.wordDifficulty === 'medium' ? 1 : 0;
                                                    const total = base + bonus;
                                                    const diffLabel = game.wordDifficulty === 'hard' ? 'Svår' : game.wordDifficulty === 'medium' ? 'Medium' : 'Lätt';
                                                    const diffColor = game.wordDifficulty === 'hard' ? 'text-red-400' : game.wordDifficulty === 'medium' ? 'text-yellow-400' : 'text-green-400';
                                                    return (
                                                        <div className="absolute left-0 bg-brand-primary/20 border border-brand-primary/50 text-brand-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" clipRule="evenodd" />
                                                            </svg>
                                                            Möjlig vinst: {total}p
                                                            {bonus > 0 && (
                                                                <span className={`${diffColor} ml-0.5`}>(+{bonus} {diffLabel})</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                <button 
                                                    onClick={() => {
                                                        if (!showSecretWordUI) {
                                                            fetchSecretWord();
                                                        }
                                                        setShowSecretWordUI(!showSecretWordUI);
                                                    }}
                                                    className="text-xs bg-brand-primary/80 hover:bg-brand-primary text-white w-28 py-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors font-semibold flex items-center justify-center gap-2 border border-white/10 z-10"
                                                >
                                                    {showSecretWordUI ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                            Dölj ord
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                            Visa ord
                                                        </>
                                                    )}
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {showSecretWordUI && secretWord && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            className="absolute left-1/2 ml-[64px] bg-black/60 text-white font-mono font-bold px-4 py-1.5 rounded-full border border-white/20 shadow-inner whitespace-nowrap"
                                                        >
                                                            {secretWord}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                        <div className="w-full mt-4">
                                            {viewingHistory && (
                                                <div className="flex flex-col items-center justify-center p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl backdrop-blur-sm animate-fadeIn shadow-inner">
                                                    <span className="text-brand-primary font-bold mb-3 flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                                                        Visar historik från en tidigare runda
                                                    </span>
                                                    <button 
                                                        onClick={() => setViewingHistory(null)} 
                                                        className="bg-brand-primary hover:bg-brand-primaryHover text-white px-6 py-2.5 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                                        Återgå till aktuellt spel
                                                    </button>
                                                </div>
                                            )}
                                            {!viewingHistory && (
                                                <DrawTools
                                                    color={color}
                                                    setColor={setColor}
                                                    thickness={thickness}
                                                    setThickness={setThickness}
                                                    onClear={clearCanvas}
                                                    disabled={!isChooser || !isDrawingPhase || (game.drawerTimeLeft !== undefined && game.drawerTimeLeft <= 0)}
                                                />
                                            )}
                                            {!viewingHistory && isChooser && isDrawingPhase && game.drawingStartedAt && (
                                                <div className="mt-4 flex justify-center">
                                                    <AbandonRoundButton 
                                                        startedAt={game.drawingStartedAt} 
                                                        onAbandon={handleAbandonRound} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Column */}
                        <div className="w-full md:w-80 h-[40vh] md:h-full flex-shrink-0">
                            <DrawChat 
                                chatLog={game.chatLog} 
                                onGuess={chatGuess} 
                                disabled={game.status !== 'drawing'}
                                isDrawer={isChooser}
                                guessesUsed={game.guessesPerPlayer?.[myId] || 0}
                                lastHintAt={game.lastHintAt}
                                lockedAt={game.lockedPlayers?.[myId] || null}
                                incorrectGuessCount={game.incorrectGuessCount}
                                hasGuessedCorrectly={game.correctGuessers?.includes(myId) || game.correctGuessers?.includes(sessionId) || (user?.id ? game.correctGuessers?.includes(user.id) : false)}
                            />
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-brand-card border border-red-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.738c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white">Är du säker?</h2>
                                <p className="text-gray-300 text-sm">
                                    Om du avslutar rundan i förtid stängs spelet ner. Alla poäng som delats ut hittills sparas och ordet visas för alla i chatten.
                                </p>
                            </div>

                            <div className="mt-8 flex gap-3 relative z-10">
                                <button 
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    Nej, avbryt
                                </button>
                                <button 
                                    onClick={confirmAbandonRound}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                                >
                                    Ja, avsluta
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
