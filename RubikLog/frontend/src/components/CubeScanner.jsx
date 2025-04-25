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
    const [detectedColors, setDetectedColors] = useState(Array(9).fill('unknown'));
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
                imageData = normalizeColors(imageData); // Normalize colors
                const color = getAverageColor(imageData.data);
                faceColors.push(determineRubikColor(color));
            }
        }
        setDetectedColors(faceColors);
        return faceColors;
    };

    const normalizeColors = (imageData) => {
        const data = imageData.data;
        let minBrightness = 255;
        let maxBrightness = 0;

        // Find min and max brightness
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
        }

        const range = maxBrightness - minBrightness;
        if (range === 0) return imageData;

        // Normalize brightness
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                data[i + j] = ((data[i + j] - minBrightness) / range) * 255;
            }
        }

        return imageData;
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

    const rgbToHsv = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h, s = max === 0 ? 0 : d / max;
        const v = max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: h = 0; break; // Add default case
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    };

    const determineRubikColor = (rgb) => {
        // Updated color references with HSV conversion for better accuracy
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        // Color definitions with HSV ranges
        const colorRanges = {
            white: { h: [0, 360], s: [0, 20], v: [80, 100] },
            yellow: { h: [50, 70], s: [50, 100], v: [80, 100] },
            red: { h: [350, 10], s: [60, 100], v: [60, 100] },
            orange: { h: [20, 35], s: [60, 100], v: [70, 100] },
            blue: { h: [210, 240], s: [60, 100], v: [50, 100] },
            green: { h: [100, 140], s: [40, 100], v: [40, 100] }
        };

        for (const [color, range] of Object.entries(colorRanges)) {
            const hInRange = (hsv.h >= range.h[0] && hsv.h <= range.h[1]) ||
                (range.h[0] > range.h[1] && (hsv.h >= range.h[0] || hsv.h <= range.h[1]));
            const sInRange = hsv.s >= range.s[0] && hsv.s <= range.s[1];
            const vInRange = hsv.v >= range.v[0] && hsv.v <= range.v[1];

            if (hInRange && sInRange && vInRange) {
                return color;
            }
        }
        return 'unknown';
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

    const handleCapture = async (imageData) => {
        try {
            const response = await fetch('http://localhost:8000/api/solves/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cube_image: imageData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to process image');
            }

            const data = await response.json();
            if (data.solve && data.solve.scramble) {
                onScanComplete(data.solve.scramble);
            }
        } catch (error) {
            console.error('Error processing image:', error);
        }
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

    const colorToRGB = {
        white: '255, 255, 255',
        yellow: '255, 255, 0',
        red: '255, 0, 0',
        orange: '255, 165, 0',
        blue: '0, 0, 255',
        green: '0, 255, 0',
        unknown: '0, 0, 0'
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
                    {detectedColors.map((color, i) => (
                        <div
                            key={i}
                            className={`border-2 ${color === 'unknown'
                                ? 'border-white/50'
                                : `border-${color}-500`
                                }`}
                            style={{
                                backgroundColor: color !== 'unknown'
                                    ? `rgba(${colorToRGB[color]}, 0.3)`
                                    : 'transparent'
                            }}
                        />
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