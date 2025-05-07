import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CubeScanner from './CubeScanner';

// Mock HTMLMediaElement.play()
beforeAll(() => {
    // Mock navigator.mediaDevices
    global.navigator.mediaDevices = {
        getUserMedia: jest.fn()
    };

    // Mock HTMLMediaElement.play
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
    window.HTMLMediaElement.prototype.pause = () => { };
});

describe('CubeScanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup success response
        navigator.mediaDevices.getUserMedia.mockImplementation(() =>
            Promise.resolve({
                getTracks: () => [{
                    stop: jest.fn()
                }]
            })
        );
    });

    it('renders scanning tips', () => {
        render(<CubeScanner />);
        expect(screen.getByText(/Scanning Tips:/i)).toBeInTheDocument();
    });

    it('toggles camera when button is clicked', async () => {
        render(<CubeScanner />);

        // Click to start camera
        await act(async () => {
            fireEvent.click(screen.getByText(/Start Camera/i));
            // Wait for state updates
            await Promise.resolve();
        });

        expect(screen.getByText(/Stop Camera/i)).toBeInTheDocument();
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

        // Click to stop camera
        await act(async () => {
            fireEvent.click(screen.getByText(/Stop Camera/i));
            await Promise.resolve();
        });

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
            // Wait for error state to be set
            await Promise.resolve();
        });

        const errorDiv = screen.getByRole('alert');
        expect(errorDiv).toHaveTextContent(/Camera error: Camera access denied/i);
    });
});