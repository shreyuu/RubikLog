import React, { useRef, useState } from 'react';

const CubeScanner = ({ onScanComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);

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

    const captureImage = () => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg');
        onScanComplete(imageData);

        // Stop camera stream
        if (videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsScanning(false);
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg">
            <div className="relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg"
                />
                <canvas
                    ref={canvasRef}
                    className="hidden"
                    width="640"
                    height="480"
                />
            </div>
            <div className="mt-4 flex justify-center gap-4">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                        Start Camera
                    </button>
                ) : (
                    <button
                        onClick={captureImage}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                    >
                        Capture Image
                    </button>
                )}
            </div>
        </div>
    );
};

export default CubeScanner;