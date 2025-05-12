import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
    test('renders title and value', () => {
        render(<StatCard title="Test Title" value="123" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
    });

    test('applies correct styling classes', () => {
        render(<StatCard title="Test" value="456" />);
        const card = screen.getByRole('region', { name: /test/i });
        expect(card).toHaveClass('bg-white/70');
        expect(card).toHaveClass('dark:bg-gray-700/70');
    });
});