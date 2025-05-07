import { useEffect, useRef, useState } from 'react';

const CubeScanner = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);

    // Start webcam automatically when component mounts
    useEffect(() => {
        startWebcam();
        // Cleanup when component unmounts
        return () => {
            stopWebcam();
        };
    }, []);

    // Cleanup function for webcam
    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    // Initialize webcam
    const startWebcam = async () => {
        try {
            stopWebcam(); // Clean up any existing streams

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment'
                }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsScanning(true);
                setError(null);
            }
        } catch (err) {
            setError(`Camera error: ${err.message}`);
            setIsScanning(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />

                {error && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
                        {error}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Scanning Tips:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                    <li>Ensure good lighting conditions</li>
                    <li>Hold the cube steady</li>
                    <li>Center the face in the grid</li>
                    <li>Scan faces in order: top, right, front, back, left, bottom</li>
                    <li>Maintain consistent lighting across all faces</li>
                </ul>
            </div>

            <div className="mt-4 flex justify-center">
                <button
                    onClick={() => isScanning ? stopWebcam() : startWebcam()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isScanning ? 'Stop Camera' : 'Start Camera'}
                </button>
            </div>
        </div>
    );
};

export default CubeScanner;