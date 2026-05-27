import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardContent from './DashboardContent';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
        button: ({ children, className, onClick }: any) => (
            <button className={className} onClick={onClick}>{children}</button>
        ),
        li: ({ children, className }: any) => <li className={className}>{children}</li>
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock Toast hook
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

describe('DashboardContent', () => {
    it('renders header and buttons correctly', () => {
        render(
            <DashboardContent 
                gameType="hangman"
                gameHistory={[]}
                onClose={() => {}}
                onCreateGame={() => {}}
                onJoinGame={() => {}}
                onRejoinGame={() => {}}
                onRemoveGame={() => {}}
            />
        );

        expect(screen.getByText('Hänga Gubbe')).toBeInTheDocument();
        expect(screen.getByText('Starta Nytt Spel')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('SPEL-ID')).toBeInTheDocument();
        expect(screen.getByText('Gå Med')).toBeInTheDocument();
    });

    it('renders game history', () => {
        const mockHistory = [
            { id: 'TEST1', state: 'playing', last_activity: Date.now() / 1000 }
        ] as any[];

        render(
            <DashboardContent 
                gameType="hangman"
                gameHistory={mockHistory}
                onClose={() => {}}
                onCreateGame={() => {}}
                onJoinGame={() => {}}
                onRejoinGame={() => {}}
                onRemoveGame={() => {}}
            />
        );

        expect(screen.getByText('Dina Aktiva Spel')).toBeInTheDocument();
        expect(screen.getByText('TEST1')).toBeInTheDocument();
        expect(screen.getByText('Spela')).toBeInTheDocument();
    });
});
