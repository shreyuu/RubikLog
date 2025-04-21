import React, { useRef, useState } from 'react';

const ScanningGuide = () => (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">Scanning Tips:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
            <li>Ensure good lighting conditions</li>
            <li>Hold the cube steady</li>
            <li>Center the face in the grid</li>
            <li>Scan faces in order: top, right, front, back, left, bottom</li>
            <li>Maintain consistent lighting across all faces</li>
        </ul>
    </div>
);

const CubeScanner = ({ onScanComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [currentFace, setCurrentFace] = useState(0);
    const faces = ['top', 'right', 'front', 'back', 'left', 'bottom'];
    const colors = [];

    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsScanning(true);
        } catch (err) {
            console.error('Error accessing webcam:', err);
        }
    };

    const detectColors = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const gridSize = 3;
        const cellWidth = canvasRef.current.width / gridSize;
        const cellHeight = canvasRef.current.height / gridSize;

        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Analyze each grid cell
        const faceColors = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                let imageData = ctx.getImageData(
                    x * cellWidth + cellWidth / 4,
                    y * cellHeight + cellHeight / 4,
                    cellWidth / 2,
                    cellHeight / 2
                );
                imageData = adjustBrightness(imageData); // Adjust brightness
                const color = getAverageColor(imageData.data);
                faceColors.push(determineRubikColor(color));
            }
        }
        return faceColors;
    };

    const getAverageColor = (data) => {
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        const count = data.length / 4;
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    };

    const determineRubikColor = (rgb) => {
        // Update color references for better accuracy
        const colors = {
            white: { r: 255, g: 255, b: 255, threshold: 30 },
            yellow: { r: 255, g: 255, b: 0, threshold: 50 },
            red: { r: 255, g: 0, b: 0, threshold: 50 },
            orange: { r: 255, g: 140, b: 0, threshold: 60 }, // Adjusted orange values
            blue: { r: 0, g: 0, b: 255, threshold: 50 },
            green: { r: 0, g: 255, b: 0, threshold: 50 }
        };

        let minDistance = Infinity;
        let closestColor = '';

        for (const [color, value] of Object.entries(colors)) {
            const distance = Math.sqrt(
                Math.pow(rgb.r - value.r, 2) +
                Math.pow(rgb.g - value.g, 2) +
                Math.pow(rgb.b - value.b, 2)
            );
            if (distance < minDistance && distance < value.threshold) {
                minDistance = distance;
                closestColor = color;
            }
        }

        return closestColor || 'unknown';
    };

    // Add brightness adjustment
    const adjustBrightness = (imageData) => {
        const data = imageData.data;
        const brightness = 1.2; // Increase brightness by 20%

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * brightness);     // Red
            data[i + 1] = Math.min(255, data[i + 1] * brightness); // Green
            data[i + 2] = Math.min(255, data[i + 2] * brightness); // Blue
        }
        return imageData;
    };

    const validateCubeState = (colors) => {
        // Placeholder for cube state validation logic
        // Implement validation logic as needed
    };

    const captureFace = () => {
        const faceColors = detectColors();

        // Validate detected colors
        if (faceColors.includes('unknown')) {
            alert('Could not detect all colors clearly. Please adjust lighting or cube position.');
            return;
        }

        const centerColor = faceColors[4]; // Center sticker
        const surroundingColors = faceColors.filter((_, i) => i !== 4);

        // Check if surrounding colors make sense
        if (surroundingColors.includes(centerColor)) {
            alert('Invalid color pattern detected. Center color should not appear on surrounding stickers.');
            return;
        }

        colors[currentFace] = faceColors;
        if (currentFace === 5) {
            try {
                validateCubeState(colors);
                setIsScanning(false);
                if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
                onScanComplete(colors);
            } catch (error) {
                alert('Invalid cube state detected. Please try scanning again.');
                setCurrentFace(0);
                colors.length = 0;
            }
        } else {
            setCurrentFace(prev => prev + 1);
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg">
            <ScanningGuide />
            <h3 className="text-xl font-semibold mb-4">
                Scan Cube Face: {faces[currentFace]}
            </h3>
            <div className="relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    width="640"
                    height="480"
                />
                <div className="grid grid-cols-3 absolute top-0 left-0 w-full h-full pointer-events-none">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white/50" />
                    ))}
                </div>
            </div>
            <div className="mt-4 flex justify-center gap-4">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                        Start Scanning
                    </button>
                ) : (
                    <button
                        onClick={captureFace}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                    >
                        Capture {faces[currentFace]} Face
                    </button>
                )}
            </div>
        </div>
    );
};

export default CubeScanner;