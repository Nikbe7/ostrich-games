import { render, fireEvent, screen, act } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import DrawChat from './DrawChat';

test('DrawChat renders messages correctly', () => {
    const chatLog = [
        { uuid: '1', name: 'Alice', text: 'Hello', is_correct: false, is_system: false },
        { uuid: 'sys', name: 'System', text: 'Bob gissade rätt!', is_correct: true, is_system: true }
    ];

    render(<DrawChat chatLog={chatLog} onGuess={() => {}} />);
    
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/Bob gissade rätt!/)).toBeInTheDocument();
});

test('DrawChat calls onGuess with input value', () => {
    const mockOnGuess = vi.fn();
    render(<DrawChat chatLog={[]} onGuess={mockOnGuess} />);
    
    const input = screen.getByPlaceholderText(/Skriv din gissning här/i);
    fireEvent.change(input, { target: { value: 'TEST' } });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnGuess).toHaveBeenCalledWith('TEST');
});

test('DrawChat disables input if disabled prop is true', () => {
    render(<DrawChat chatLog={[]} onGuess={() => {}} disabled={true} />);
    const input = screen.getByPlaceholderText(/Väntar.../i);
    expect(input).toBeDisabled();
});

test('DrawChat disables input when user is locked (3 guesses)', () => {
    const lockedAt = Date.now() / 1000 - 100; // Locked 100 seconds ago
    render(<DrawChat chatLog={[]} onGuess={() => {}} guessesUsed={3} lockedAt={lockedAt} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input.getAttribute('placeholder')).toMatch(/Låst/i);
});

test('DrawChat enables input when lock expires after 30 minutes', () => {
    vi.useFakeTimers();
    const lockedAt = Date.now() / 1000 - 1801; // Locked 30 mins and 1 sec ago
    render(<DrawChat chatLog={[]} onGuess={() => {}} guessesUsed={3} lockedAt={lockedAt} />);
    
    // Advance timers so the setInterval runs and lock is cleared
    act(() => {
        vi.advanceTimersByTime(1100);
    });
    
    const input = screen.getByRole('textbox');
    expect(input).not.toBeDisabled();
    expect(input.getAttribute('placeholder')).toMatch(/Skriv din gissning här/i);
    
    vi.useRealTimers();
});
