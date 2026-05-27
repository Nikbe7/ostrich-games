import React from 'react';

interface DrawToolsProps {
    color: string;
    setColor: (c: string) => void;
    thickness: number;
    setThickness: (t: number) => void;
    onClear: () => void;
    disabled?: boolean;
}

const COLORS = [
    '#000000', // Black
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#FFFFFF', // White (Eraser effect)
];

const THICKNESSES = [
    { label: 'Smal', value: 3 },
    { label: 'Normal', value: 6 },
    { label: 'Tjock', value: 12 },
    { label: 'Extrem', value: 24 },
];

export default function DrawTools({ color, setColor, thickness, setThickness, onClear, disabled }: DrawToolsProps) {
    if (disabled) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-card/50 backdrop-blur-md rounded-xl shadow-xl border border-white/5">
            {/* Colors */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-300 mr-2">Färg:</span>
                <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                color === c ? 'border-brand-primary scale-110 shadow-lg' : 'border-white/20 hover:scale-105 hover:border-white/40'
                            } ${c === '#FFFFFF' ? 'flex items-center justify-center bg-white' : ''}`}
                            style={{ backgroundColor: c !== '#FFFFFF' ? c : 'white' }}
                            title={c === '#FFFFFF' ? 'Suddgummi' : undefined}
                        >
                            {c === '#FFFFFF' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Thickness */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-300 mr-2">Tjocklek:</span>
                <div className="flex gap-2 bg-black/30 border border-white/5 p-1 rounded-lg">
                    {THICKNESSES.map(t => (
                        <button
                            key={t.value}
                            onClick={() => setThickness(t.value)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                thickness === t.value 
                                    ? 'bg-brand-primary text-white shadow font-bold' 
                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear Canvas */}
            <button
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 rounded-lg font-semibold transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Rensa
            </button>
        </div>
    );
}
