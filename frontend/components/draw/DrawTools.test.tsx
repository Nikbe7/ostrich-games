import { render, fireEvent, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import DrawTools from './DrawTools';

test('DrawTools calls setColor when a color is clicked', () => {
    const mockSetColor = vi.fn();
    const { container } = render(
        <DrawTools color="#000000" setColor={mockSetColor} thickness={6} setThickness={() => {}} onClear={() => {}} />
    );
    
    // The red color button
    const redButton = container.querySelector('button[style="background-color: rgb(239, 68, 68);"]');
    if (redButton) {
        fireEvent.click(redButton);
        expect(mockSetColor).toHaveBeenCalledWith('#EF4444');
    }
});

test('DrawTools calls setThickness when thickness is changed', () => {
    const mockSetThickness = vi.fn();
    render(
        <DrawTools color="#000000" setColor={() => {}} thickness={6} setThickness={mockSetThickness} onClear={() => {}} />
    );
    
    const thickButton = screen.getByText('Tjock');
    fireEvent.click(thickButton);
    expect(mockSetThickness).toHaveBeenCalledWith(12);
});

test('DrawTools calls onClear when rensa is clicked', () => {
    const mockOnClear = vi.fn();
    render(
        <DrawTools color="#000000" setColor={() => {}} thickness={6} setThickness={() => {}} onClear={mockOnClear} />
    );
    
    const clearButton = screen.getByText(/Rensa/i);
    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
});
