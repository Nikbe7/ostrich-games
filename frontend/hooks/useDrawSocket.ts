import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { DrawGame, Stroke } from '@/types/draw';
import { useToast } from '@/components/Toast';
import { useSound } from '@/hooks/useSound';

export function useDrawSocket(gameId: string, sessionId: string, name: string) {
    const { socket, isConnected } = useSocket();
    const [game, setGame] = useState<DrawGame | null>(null);
    const [trueId, setTrueId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const { showToast } = useToast();
    const [secretWord, setSecretWord] = useState<string | null>(null);

    const prevGameRef = useRef<DrawGame | null>(null);
    const { playCorrect, playWrong, playWin, playLoss } = useSound();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);


    useEffect(() => {
        if (!game) return;
        const prev = prevGameRef.current;
        if (prev) {
            // Check for game finished
            if (game.status === 'finished' && prev.status === 'drawing') {
                if (game.correctGuessers.length > 0) {
                    setShowConfetti(true);
                    playWin();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
                    setTimeout(() => setShowConfetti(false), 4000);
                } else {
                    playLoss();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([300]);
                }
            } else if (game.status === 'drawing' && prev.status === 'drawing') {
                // Check if someone guessed correctly
                if ((game.correctGuessers || []).length > (prev.correctGuessers || []).length) {
                    playCorrect();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                }
            }
        }
        prevGameRef.current = game;
    }, [game, playWin, playLoss, playCorrect, playWrong]);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (updatedGame: DrawGame) => {
            if (updatedGame.gameId !== gameId) return;
            setGame(updatedGame);
            setError('');
        };

        const handleDrawLine = (line: Stroke) => {
            setGame(prev => {
                if (!prev || prev.gameId !== gameId) return prev;
                return { ...prev, lines: [...prev.lines, line] };
            });
        };

        const handleClearCanvas = () => {
            setGame(prev => {
                if (!prev || prev.gameId !== gameId) return prev;
                return { ...prev, lines: [] };
            });
        };

        const handleError = (msg: string) => {
            setError(msg);
            showToast(msg, 'error');
            setTimeout(() => setError(''), 5000);
        };

        const handleNotification = (msg: string) => {
            showToast(msg, 'info');
        };

        const handleSecretWord = (data: { word: string }) => {
            setSecretWord(data.word);
        };

        socket.on('update_game', handleUpdate);
        socket.on('draw_line_update', handleDrawLine);
        socket.on('clear_canvas_update', handleClearCanvas);
        socket.on('error', handleError);
        socket.on('notification', handleNotification);
        socket.on('secret_word', handleSecretWord);

        return () => {
            socket.off('update_game', handleUpdate);
            socket.off('draw_line_update', handleDrawLine);
            socket.off('clear_canvas_update', handleClearCanvas);
            socket.off('error', handleError);
            socket.off('notification', handleNotification);
            socket.off('secret_word', handleSecretWord);
        };
    }, [socket, gameId, showToast]);

    useEffect(() => {
        if (!socket || !isConnected || !gameId || !sessionId || !name) return;

        socket.emit('join_game', { gameId, sessionId, playerName: name }, (response: any) => {
            if (response?.status === 'ok' && response?.uuid) {
                setTrueId(response.uuid);
            } else if (response?.status === 'error') {
                setError(`Join failed: ${response.message}`);
            }
        });
    }, [socket, isConnected, gameId, sessionId, name]);

    const drawLine = useCallback((line: Stroke) => {
        if (game?.status !== 'drawing') return;
        
        // Optimistic UI update
        setGame(prev => {
            if (!prev) return prev;
            return { ...prev, lines: [...prev.lines, line] };
        });
        
        socket?.emit('draw_line', { gameId, line, sessionId });
    }, [socket, gameId, sessionId, game?.status]);

    const clearCanvas = useCallback(() => {
        if (game?.status !== 'drawing') return;
        setGame(prev => {
            if (!prev) return prev;
            return { ...prev, lines: [] };
        });
        socket?.emit('clear_canvas', { gameId, sessionId });
    }, [socket, gameId, sessionId, game?.status]);

    const abandonRound = useCallback(() => {
        if (game?.status !== 'drawing') return;
        socket?.emit('abandon_draw_game', { gameId, sessionId });
    }, [socket, gameId, sessionId, game?.status]);

    const chatGuess = useCallback((text: string) => {
        if (game?.status !== 'drawing') return;
        socket?.emit('chat_guess', { gameId, text, sessionId });
    }, [socket, gameId, sessionId, game?.status]);

    const submitWord = useCallback((word: string) => {
        socket?.emit('submit_word', { gameId, word, sessionId });
    }, [socket, gameId, sessionId]);

    const resetGame = useCallback(() => {
        socket?.emit('reset_game', { gameId, sessionId });
    }, [socket, gameId, sessionId]);

    const cancelStart = useCallback(() => {
        socket?.emit('cancel_start', { gameId, sessionId });
    }, [socket, gameId, sessionId]);

    const forceReset = useCallback(() => {
        socket?.emit('force_reset', { gameId, sessionId });
    }, [socket, gameId, sessionId]);

    const fetchSecretWord = useCallback(() => {
        socket?.emit('get_secret_word', { gameId, sessionId });
    }, [socket, gameId, sessionId]);



    return {
        game,
        trueId,
        isConnected,
        error,
        notification,
        showConfetti,
        secretWord,
        drawLine,
        clearCanvas,
        abandonRound,
        chatGuess,
        submitWord,
        resetGame,
        cancelStart,
        forceReset,
        fetchSecretWord,
        setNotification,
        setError
    };
}
