import { render, fireEvent, screen } from '@testing-library/react';
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
