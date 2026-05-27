import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import DrawPlayerList from './DrawPlayerList';

test('DrawPlayerList sorts players by score', () => {
    const players = [
        { sessionId: '1', name: 'Alice', isOnline: true, lastSeen: '', score: 10, hasGuessed: false },
        { sessionId: '2', name: 'Bob', isOnline: true, lastSeen: '', score: 30, hasGuessed: true },
        { sessionId: '3', name: 'Charlie', isOnline: true, lastSeen: '', score: 20, hasGuessed: false }
    ];

    render(<DrawPlayerList players={players} currentChooserId="1" />);
    
    // Check order by looking at all li elements
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Bob/);
    expect(items[1]).toHaveTextContent(/Charlie/);
    expect(items[2]).toHaveTextContent(/Alice/);
});

test('DrawPlayerList indicates the drawer', () => {
    const players = [
        { sessionId: '1', name: 'Alice', isOnline: true, lastSeen: '', score: 10, hasGuessed: false },
        { sessionId: '2', name: 'Bob', isOnline: true, lastSeen: '', score: 30, hasGuessed: false }
    ];

    const { container } = render(<DrawPlayerList players={players} currentChooserId="1" />);
    
    // Check if "Ritar..." text is rendered for Alice
    expect(container.textContent).toMatch(/Ritar\.\.\./);
});
