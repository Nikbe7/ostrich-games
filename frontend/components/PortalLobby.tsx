'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GameMetadata } from '@/types/game';
import DashboardContent from '@/components/DashboardContent';

interface PortalLobbyProps {
    user: User;
    onLogout: () => void;
    gameHistory: GameMetadata[];
    onCreateGame: () => void;
    onJoinGame: (gameId: string) => void;
    onRejoinGame: (gameId: string) => void;
    onRemoveGame: (gameId: string) => void;
}

export default function PortalLobby({ 
    user, 
    onLogout, 
    gameHistory,
    onCreateGame,
    onJoinGame,
    onRejoinGame,
    onRemoveGame
}: PortalLobbyProps) {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const games = [
        {
            id: 'hangman',
            name: 'Hänga Gubbe',
            description: '',
            route: '/hangman',
            icon: '/hangman-icon.png',
            active: true
        },
        {
            id: 'draw',
            name: 'Rita & Gissa',
            description: 'Kommer snart 👀',
            route: '/draw',
            icon: '🎨',
            active: false
        }
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header / User Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="bg-brand-card/80 p-5 sm:p-8 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl"
            >
                <div className="flex flex-row justify-between items-center gap-4">
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide uppercase">Inloggad som</p>
                        <p className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primaryHover to-white truncate">{user.username}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-xs sm:text-sm text-gray-400 hover:text-brand-primary transition-colors font-medium border border-transparent hover:border-brand-primary/30 px-3 py-1.5 rounded-lg flex-shrink-0"
                    >
                        Logga ut
                    </button>
                </div>
            </motion.div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                    >
                        <button
                            onClick={() => game.active && setSelectedGame(game.id)}
                            disabled={!game.active}
                            className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full relative overflow-hidden group
                                ${game.active 
                                    ? 'bg-brand-card/60 hover:bg-brand-card/90 border-white/10 hover:border-brand-primary/50 shadow-lg hover:shadow-[0_0_20px_rgba(5,150,105,0.2)]' 
                                    : 'bg-black/30 border-white/5 opacity-70 cursor-not-allowed'
                                }`}
                        >
                            {/* Background glow effect on hover for active games */}
                            {game.active && (
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            )}
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    {game.icon.startsWith('/') ? (
                                        <img src={game.icon} alt={game.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" />
                                    ) : (
                                        <span className="text-4xl sm:text-5xl">{game.icon}</span>
                                    )}
                                    {!game.active && (
                                        <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-white/10 text-gray-400 px-2 py-1 rounded-full whitespace-nowrap">
                                            Kommer Snart
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 ${game.active ? 'text-white group-hover:text-brand-primary transition-colors' : 'text-gray-400'}`}>
                                    {game.name}
                                </h3>
                                {game.description && (
                                    <p className="text-xs sm:text-sm text-gray-400 flex-grow">
                                        {game.description}
                                    </p>
                                )}
                            </div>
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Game Modal */}
            <AnimatePresence>
                {selectedGame === 'hangman' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGame(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto rounded-2xl custom-scrollbar"
                        >
                            <DashboardContent
                                gameHistory={gameHistory}
                                onClose={() => setSelectedGame(null)}
                                onCreateGame={onCreateGame}
                                onJoinGame={onJoinGame}
                                onRejoinGame={onRejoinGame}
                                onRemoveGame={onRemoveGame}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
