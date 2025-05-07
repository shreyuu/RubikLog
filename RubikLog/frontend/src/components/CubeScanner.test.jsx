import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CubeScanner from './CubeScanner';

// Mock MediaDevices API
beforeAll(() => {
    global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockImplementation(() =>
            Promise.resolve({
                getTracks: () => [{
                    stop: jest.fn()
                }]
            })
        )
    };
});

describe('CubeScanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders scanning tips', () => {
        render(<CubeScanner />);
        expect(screen.getByText(/Scanning Tips:/i)).toBeInTheDocument();
    });

    it('toggles camera when button is clicked', async () => {
        render(<CubeScanner />);

        // Initial state - camera off
        expect(screen.getByText(/Start Camera/i)).toBeInTheDocument();

        // Click to start camera
        await act(async () => {
            fireEvent.click(screen.getByText(/Start Camera/i));
        });

        // Camera should be on
        expect(screen.getByText(/Stop Camera/i)).toBeInTheDocument();
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

        // Click to stop camera
        await act(async () => {
            fireEvent.click(screen.getByText(/Stop Camera/i));
        });

        // Camera should be off again
        expect(screen.getByText(/Start Camera/i)).toBeInTheDocument();
    });

    it('shows error message when camera access fails', async () => {
        // Mock camera access failure
        navigator.mediaDevices.getUserMedia.mockImplementationOnce(() =>
            Promise.reject(new Error('Camera access denied'))
        );

        render(<CubeScanner />);

        await act(async () => {
            fireEvent.click(screen.getByText(/Start Camera/i));
        });

        expect(screen.getByText(/Camera error:/i)).toBeInTheDocument();
    });
});