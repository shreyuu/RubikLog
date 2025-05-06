import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CubeScanner from './CubeScanner';

// Mock canvas context
const mockContext = {
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '#00ff00',
    lineWidth: 2
};

// Mock canvas element
const mockCanvas = {
    getContext: () => mockContext,
    width: 640,
    height: 480,
    toDataURL: jest.fn().mockReturnValue('mock-image-data')
};

// Mock video element
const mockVideoElement = {
    play: jest.fn(),
    pause: jest.fn(),
    videoWidth: 640,
    videoHeight: 480,
    srcObject: null
};

// Setup mocks before tests
beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock getUserMedia
    global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
            getTracks: () => [{
                stop: jest.fn()
            }]
        })
    };

    // Mock canvas creation
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
            return mockCanvas;
        }
        return origCreateElement(tagName);
    });

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = () => mockContext;

    // Mock HTMLVideoElement
    Object.defineProperty(global.HTMLVideoElement.prototype, 'play', {
        configurable: true,
        value: mockVideoElement.play
    });

    // Mock window.URL
    window.URL.createObjectURL = jest.fn();
    window.URL.revokeObjectURL = jest.fn();
});

// Cleanup after tests
afterEach(() => {
    jest.restoreAllMocks();
});

describe('CubeScanner', () => {
    const mockOnScanComplete = jest.fn();

    it('renders scanning guide', () => {
        render(<CubeScanner onScanComplete={mockOnScanComplete} />);
        expect(screen.getByText('Scanning Tips:')).toBeInTheDocument();
    });

    it('starts scanning when start button is clicked', async () => {
        render(<CubeScanner onScanComplete={mockOnScanComplete} />);

        await act(async () => {
            fireEvent.click(screen.getByText('Start Scanning'));
        });

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('shows capture and stop buttons when scanning', async () => {
        const { rerender } = render(<CubeScanner onScanComplete={mockOnScanComplete} />);

        await act(async () => {
            fireEvent.click(screen.getByText('Start Scanning'));
            rerender(<CubeScanner onScanComplete={mockOnScanComplete} />);
        });

        expect(screen.getByText(/Capture Face/i)).toBeInTheDocument();
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
    });

    it('handles camera access error', async () => {
        global.navigator.mediaDevices.getUserMedia = jest.fn(() =>
            Promise.reject(new Error('Camera access denied'))
        );

        render(<CubeScanner onScanComplete={mockOnScanComplete} />);

        await act(async () => {
            fireEvent.click(screen.getByText('Start Scanning'));
        });

        expect(screen.getByText(/Error accessing camera/i)).toBeInTheDocument();
    });

    it('stops scanning when stop button is clicked', async () => {
        render(<CubeScanner onScanComplete={mockOnScanComplete} />);

        await act(async () => {
            fireEvent.click(screen.getByText('Start Scanning'));
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Stop Scanning'));
        });

        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('shows progress during face captures', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ is_valid: true, colors: ['white'] })
            })
        );

        render(<CubeScanner onScanComplete={mockOnScanComplete} />);

        await act(async () => {
            fireEvent.click(screen.getByText('Start Scanning'));
        });

        await act(async () => {
            fireEvent.click(screen.getByText(/Capture Face/i));
        });

        expect(await screen.findByText(/Face 1\/6 captured successfully/i)).toBeInTheDocument();
    });
});