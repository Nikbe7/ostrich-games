import { Player, HistoryEntry } from './game';

export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    thickness: number;
}

export interface ChatMessage {
    uuid: string;
    name: string;
    text: string;
    is_correct: boolean;
    is_system: boolean;
}

export interface DrawPlayer extends Player {
    hasGuessed: boolean;
}

export interface DrawGameHistoryEntry {
    word: string;
    chooser: string | null;
    correctGuessers: string[];
    chatLog: ChatMessage[];
    lines: Stroke[];
}

export interface DrawGame {
    gameId: string;
    word: string;
    status: 'waiting' | 'choosing' | 'drawing' | 'finished';
    players: DrawPlayer[];
    wordChooser: string | null;
    history: DrawGameHistoryEntry[];
    chatLog: ChatMessage[];
    lines: Stroke[];
    message: string;
    dynamic_ai_status?: string | null;
    chooserTimedOut?: boolean;
    chooserDeadline?: number | null;
    drawingDeadline?: number | null;
    drawingTimeLeft?: number;
    drawerTimeLeft?: number;
    drawingStartedAt?: number | null;
    correctGuessers: string[];
    guessesPerPlayer?: Record<string, number>;
    incorrectGuessCount?: number;
    revealedIndices?: number[];
    lastHintAt?: number;
    lockedPlayers?: Record<string, number>;
    wordDifficulty?: 'easy' | 'medium' | 'hard';
}
