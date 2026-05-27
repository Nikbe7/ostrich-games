import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PortalLobby from './PortalLobby';
import { User } from '@/types/game';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
        button: ({ children, className, onClick, disabled }: any) => (
            <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
        )
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock DashboardContent since it's tested separately
vi.mock('./DashboardContent', () => ({
    default: ({ onClose }: any) => (
        <div data-testid="mock-dashboard">
            <button onClick={onClose}>Mock Close</button>
        </div>
    )
}));

describe('PortalLobby', () => {
    const mockUser: User = { username: 'TestPlayer', id: '123' };
    
    it('renders user information and games', () => {
        render(
            <PortalLobby 
                user={mockUser}
                gameHistory={[]}
                onLogout={vi.fn()}
                onCreateGame={vi.fn()}
                onJoinGame={vi.fn()}
                onRejoinGame={vi.fn()}
                onRemoveGame={vi.fn()}
            />
        );

        expect(screen.getByText('TestPlayer')).toBeInTheDocument();
        expect(screen.getByText('Hänga Gubbe')).toBeInTheDocument();
        expect(screen.getByText('Rita & Gissa')).toBeInTheDocument();
    });

    it('opens modal when clicking active game', () => {
        render(
            <PortalLobby 
                user={mockUser}
                gameHistory={[]}
                onLogout={vi.fn()}
                onCreateGame={vi.fn()}
                onJoinGame={vi.fn()}
                onRejoinGame={vi.fn()}
                onRemoveGame={vi.fn()}
            />
        );

        expect(screen.queryByTestId('mock-dashboard')).not.toBeInTheDocument();
        
        // Click the Hangman button (it is active)
        const hangmanBtn = screen.getByText('Hänga Gubbe').closest('button');
        fireEvent.click(hangmanBtn!);

        expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    });
});
