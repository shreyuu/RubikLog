import React, { useRef, useState, useEffect } from 'react';

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
    const [isScanning, setIsScanning] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [scannedFaces, setScannedFaces] = useState([]);

    const startScanning = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment'
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsScanning(true);
            drawScanOverlay();
        } catch (error) {
            setValidationMessage('Error accessing camera: ' + error.message);
        }
    };

    const stopScanning = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsScanning(false);
            setScannedFaces([]);
        }
    };

    const drawScanOverlay = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const { width, height } = canvasRef.current;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        // Draw vertical lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(width * (i / 3), 0);
            ctx.lineTo(width * (i / 3), height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, height * (i / 3));
            ctx.lineTo(width, height * (i / 3));
            ctx.stroke();
        }
    };

    const captureFace = async () => {
        if (!videoRef.current || scannedFaces.length >= 6) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        try {
            // Convert to base64
            const imageData = canvas.toDataURL('image/jpeg');

            // Send to backend
            const response = await fetch('/api/scan-cube/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const data = await response.json();

            if (data.is_valid) {
                setScannedFaces(prev => [...prev, data.colors]);
                setValidationMessage(`Face ${scannedFaces.length + 1}/6 captured successfully`);

                if (scannedFaces.length + 1 >= 6) {
                    onScanComplete(scannedFaces);
                    stopScanning();
                }
            } else {
                setValidationMessage('Invalid cube face - please try again');
            }
        } catch (error) {
            setValidationMessage('Error capturing face: ' + error.message);
        }
    };

    useEffect(() => {
        if (isScanning) {
            drawScanOverlay();
        }

        return () => stopScanning();
    }, [isScanning]);

    return (
        <div className="relative max-w-md mx-auto">
            <ScanningGuide />

            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                        if (canvasRef.current) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                            drawScanOverlay();
                        }
                    }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
            </div>

            <div className="mt-4 space-y-4">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Start Scanning
                    </button>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={captureFace}
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                            disabled={scannedFaces.length >= 6}
                        >
                            Capture Face ({scannedFaces.length}/6)
                        </button>
                        <button
                            onClick={stopScanning}
                            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Stop Scanning
                        </button>
                    </div>
                )}

                {validationMessage && (
                    <div className={`p-3 rounded-lg text-center ${validationMessage.includes('Error')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                        {validationMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CubeScanner;