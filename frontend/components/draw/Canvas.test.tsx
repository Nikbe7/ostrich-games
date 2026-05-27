import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Canvas from './Canvas';

test('Canvas renders without crashing', () => {
    const { container } = render(
        <Canvas lines={[]} isDrawer={false} color="#000" thickness={6} />
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
});

test('Canvas shows spectator badge when not drawer', () => {
    const { getByText } = render(
        <Canvas lines={[]} isDrawer={false} color="#000" thickness={6} />
    );
    expect(getByText(/Åskådare/i)).toBeInTheDocument();
});

test('Canvas shows drawer badge when drawer', () => {
    const { getByText } = render(
        <Canvas lines={[]} isDrawer={true} color="#000" thickness={6} />
    );
    expect(getByText(/Du ritar/i)).toBeInTheDocument();
});
