import React, { useRef, useState } from 'react';

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
                const imageData = ctx.getImageData(
                    x * cellWidth + cellWidth / 4,
                    y * cellHeight + cellHeight / 4,
                    cellWidth / 2,
                    cellHeight / 2
                );
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
        const colors = {
            white: { r: 255, g: 255, b: 255 },
            yellow: { r: 255, g: 255, b: 0 },
            red: { r: 255, g: 0, b: 0 },
            orange: { r: 255, g: 165, b: 0 },
            blue: { r: 0, g: 0, b: 255 },
            green: { r: 0, g: 255, b: 0 }
        };

        let minDistance = Infinity;
        let closestColor = '';

        for (const [color, value] of Object.entries(colors)) {
            const distance = Math.sqrt(
                Math.pow(rgb.r - value.r, 2) +
                Math.pow(rgb.g - value.g, 2) +
                Math.pow(rgb.b - value.b, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }

        return closestColor;
    };

    const captureFace = () => {
        const faceColors = detectColors();
        colors[currentFace] = faceColors;

        if (currentFace === 5) {
            // All faces scanned
            setIsScanning(false);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            onScanComplete(colors);
        } else {
            setCurrentFace(prev => prev + 1);
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg">
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