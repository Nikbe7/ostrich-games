import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameHistory from './GameHistory';
import { HistoryEntry } from '@/types/game';

describe('GameHistory Component', () => {
    const mockPlayers = [
        { sessionId: 'user1', name: 'Alice' },
        { sessionId: 'user2', name: 'Bob' },
        { sessionId: 'user3', name: 'Charlie' }
    ];

    const mockHangmanHistory: HistoryEntry[] = [
        {
            word: 'TEST',
            winner: 'user1',
            chooser: 'user2',
            wrongGuesses: 3
        },
        {
            word: 'LOST',
            winner: null,
            chooser: 'user3'
        }
    ];

    const mockDrawHistory: HistoryEntry[] = [
        {
            word: 'APPLE',
            chooser: 'user1',
            correctGuessers: ['user2', 'user3'],
            lines: [{ type: 'draw', color: '#000', thickness: 2, points: [] }]
        }
    ];

    it('renders hangman history correctly (win & loss)', () => {
        render(<GameHistory history={mockHangmanHistory} players={mockPlayers as any} />);
        
        // Win entry
        expect(screen.getByText('TEST')).toBeInTheDocument();
        expect(screen.getByText('🏆 3 fel')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument(); // Winner name
        
        // Loss entry
        expect(screen.getByText('LOST')).toBeInTheDocument();
        expect(screen.getByText('💀 Hängd')).toBeInTheDocument();
    });

    it('renders draw history correctly', () => {
        render(<GameHistory history={mockDrawHistory} players={mockPlayers as any} />);
        
        expect(screen.getByText('APPLE')).toBeInTheDocument();
        expect(screen.getByText('2 gissade rätt')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument(); // Chooser name
    });

    it('handles interaction when lines exist', () => {
        const handleClick = vi.fn();
        render(<GameHistory history={mockDrawHistory} players={mockPlayers as any} onItemClick={handleClick} />);
        
        const item = screen.getByText('APPLE').closest('li');
        expect(item).toBeInTheDocument();
        
        fireEvent.click(item!);
        expect(handleClick).toHaveBeenCalledWith(mockDrawHistory[0]);
    });

    it('handles interaction when guessedLetters exist', () => {
        const handleClick = vi.fn();
        const historyWithLetters: HistoryEntry[] = [{
            word: 'TEST',
            chooser: 'user1',
            guessedLetters: ['T', 'E', 'S']
        }];
        render(<GameHistory history={historyWithLetters} players={mockPlayers as any} onItemClick={handleClick} />);
        
        const item = screen.getByText('TEST').closest('li');
        fireEvent.click(item!);
        expect(handleClick).toHaveBeenCalledWith(historyWithLetters[0]);
    });
});
