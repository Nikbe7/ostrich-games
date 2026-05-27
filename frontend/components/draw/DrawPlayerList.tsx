import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawPlayer } from '@/types/draw';

interface DrawPlayerListProps {
    players: DrawPlayer[];
    currentChooserId: string;
    currentPlayerId?: string; // We'll add this to match "(Du)" highlighting
}

export default function DrawPlayerList({ players, currentChooserId, currentPlayerId }: DrawPlayerListProps) {
    if (!players || players.length === 0) return null;

    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
        <div className="bg-brand-card/50 p-4 rounded-xl backdrop-blur-md border border-white/5 shadow-xl flex flex-col flex-shrink-0 min-h-0 max-h-[45vh]">
            <h2 className="text-sm font-bold mb-3 flex items-center justify-between shrink-0">
                Spelare
                <span className="bg-black/40 text-xs px-2 py-0.5 rounded-full text-brand-primary">{players.length}</span>
            </h2>
            <ul className="space-y-1.5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                <AnimatePresence mode="popLayout">
                    {sortedPlayers.map((player) => {
                        const isCurrent = player.sessionId === currentPlayerId;
                        const isChooser = player.sessionId === currentChooserId;

                        // Determine medal based on score (allowing ties)
                        let medal = null;
                        if (player.score > 0) {
                            // Find all unique scores sorted descending
                            const uniqueScores = Array.from(new Set(sortedPlayers.map(p => p.score))).sort((a, b) => b - a);
                            const rank = uniqueScores.indexOf(player.score);

                            if (rank === 0) medal = '🥇';
                            else if (rank === 1) medal = '🥈';
                            else if (rank === 2) medal = '🥉';
                        }

                        return (
                            <motion.li
                                key={player.sessionId}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`flex items-center justify-between p-2 rounded-lg transition-colors border ${isCurrent ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <div className="relative shrink-0">
                                        <div className={`w-3 h-3 rounded-full border-2 border-brand-card ${player.isOnline ? 'bg-brand-primary' : 'bg-gray-500'}`} />
                                    </div>
                                    {medal && <span className="text-sm shrink-0 drop-shadow-md">{medal}</span>}
                                    <span className={`text-sm truncate font-medium flex items-center gap-2 ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                                        {player.name} {isCurrent && '(Du)'}
                                        {player.hasGuessed && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500 shrink-0">
                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </span>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <div className="text-[10px] text-gray-500 mb-0.5">
                                        {player.isOnline ? (isChooser ? 'Ritar...' : 'Online') : 'Offline'}
                                    </div>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[10px] text-gray-400">Poäng:</span>
                                        <span className="font-bold text-xs text-brand-primary transition-all duration-300 transform">
                                            {player.score || 0}
                                        </span>
                                    </div>
                                </div>
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ul>
        </div>
    );
}
