import React, { useState, useEffect, useCallback, useMemo } from "react";
import StatCard from "./components/StatCard";
import DeleteButton from "./components/DeleteButton";
import { generateScramble } from "./utils/scrambleGenerator";
import CubeScanner from "./components/CubeScanner";
import { generateScrambleFromColors } from "./utils/cubeNotation";
import ScrambleVisualizer from './components/ScrambleVisualizer';

// Update API_URL to use relative path
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const TIMEOUT_DURATION = 5000; // 5 seconds

const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
};

// Add loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
);

// Update the customAnimationClasses object
const customAnimationClasses = {
    button: `
        relative inline-flex items-center justify-center p-2 rounded-lg
        transition-all duration-300 ease-in-out
        before:absolute before:inset-0
        before:rounded-lg before:border-2 before:scale-100
        before:transition-all before:duration-500 before:ease-out
        before:border-transparent before:transform
        hover:before:scale-105 hover:before:border-current
        after:absolute after:inset-0
        after:rounded-lg after:border-2 after:scale-105
        after:transition-all after:duration-500 after:ease-out
        after:border-transparent after:transform
        hover:after:scale-100 hover:after:border-current
    `,
    successMessage:
        "fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg animate-bounce",
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4 text-center">
                    Something went wrong. Please refresh the page.
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [solves, setSolves] = useState([]);
    const [solveTime, setSolveTime] = useState("");
    const [scramble, setScramble] = useState(() => {
        return localStorage.getItem("lastScramble") || "";
    });
    const [error, setError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [timerActive, setTimerActive] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : true;
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [cubeState, setCubeState] = useState(null);
    const [sortOrder, setSortOrder] = useState('latest');
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Format time function
    const formatTime = (timeString) => {
        const time = parseFloat(timeString);
        if (isNaN(time)) return "Invalid time";

        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(2);
        return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
    };

    const getBestTime = (solves) => {
        if (!solves.length) return "-";
        const bestTime = Math.min(...solves.map((solve) => solve.time_taken));
        return formatTime(bestTime);
    };

    const getAo5 = (solves) => {
        if (!Array.isArray(solves) || solves.length < 5) return "-";
        const recent5 = solves
            .slice(-5)
            .map((solve) => solve.time_taken)
            .sort((a, b) => a - b);
        // Remove best and worst times
        const sum = recent5.slice(1, -1).reduce((a, b) => a + b, 0);
        return (sum / 3).toFixed(2);
    };

    const getAo12 = (solves) => {
        if (!Array.isArray(solves) || solves.length < 12) return "-";
        const recent12 = solves
            .slice(-12)
            .map((solve) => solve.time_taken)
            .sort((a, b) => a - b);
        // Remove best and worst times
        const sum = recent12.slice(1, -1).reduce((a, b) => a + b, 0);
        return (sum / 10).toFixed(2);
    };

    const memoizedGetAo5 = useMemo(() => getAo5(solves), [solves]);
    const memoizedGetAo12 = useMemo(() => getAo12(solves), [solves]);

    const sortedSolves = useMemo(() => {
        if (!Array.isArray(solves)) return [];

        const sorted = [...solves];
        switch (sortOrder) {
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'fastest':
                return sorted.sort((a, b) => a.time_taken - b.time_taken);
            case 'slowest':
                return sorted.sort((a, b) => b.time_taken - a.time_taken);
            default: // latest
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    }, [solves, sortOrder]);

    const paginatedSolves = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedSolves.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedSolves, currentPage]);

    const totalPages = Math.ceil(sortedSolves.length / ITEMS_PER_PAGE);

    useEffect(() => {
        const fetchSolves = async () => {
            try {
                const response = await fetchWithTimeout(`${API_URL}/solves/`);
                if (!response.ok) {
                    throw new Error('Failed to fetch solves');
                }
                const data = await response.json();
                setSolves(data.results); // Set the results array from the response
                setIsLoading(false);
            } catch (err) {
                setError('Error loading solves: ' + err.message);
                setIsLoading(false);
            }
        };

        fetchSolves();
    }, []); // Empty dependency array means this runs once on mount

    // Stopwatch logic
    useEffect(() => {
        let intervalId;
        if (isRunning) {
            intervalId = setInterval(() => {
                setTime((prevTime) => prevTime + 0.01);
            }, 10);
        }
        return () => clearInterval(intervalId);
    }, [isRunning]);

    // Add this function before other handlers
    const handleNewScramble = useCallback(() => {
        const newScramble = generateScramble();
        setScramble(newScramble);
        localStorage.setItem("lastScramble", newScramble);
    }, []);

    // Handle keydown
    const handleKeyDown = useCallback((event) => {
        if (event.code === "Space" && !event.repeat) {
            event.preventDefault();
            setIsHolding(true);
        }
    }, []);

    // Handle keyup
    const handleKeyUp = useCallback(
        (event) => {
            if (event.code === "Space") {
                event.preventDefault();
                if (isHolding) {
                    if (!timerActive) {
                        // Start timer
                        setTime(0);
                        setIsRunning(true);
                        setTimerActive(true);
                    } else {
                        // Stop timer
                        setIsRunning(false);
                        setTimerActive(false);
                        setSolveTime(time.toFixed(2));
                        // Remove the automatic scramble generation
                        // handleNewScramble();
                    }
                }
                setIsHolding(false);
            }
        },
        [isHolding, timerActive, time] // Remove handleNewScramble from dependencies
    );

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Add a new solve record
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Convert to float and validate
        const timeValue = parseFloat(solveTime);
        if (!timeValue || isNaN(timeValue) || timeValue <= 0) {
            setError("Please enter a valid solve time");
            return;
        }

        try {
            const response = await fetchWithTimeout(`${API_URL}/solves/`, {
                method: "POST",
                body: JSON.stringify({
                    time_taken: timeValue,
                    scramble: scramble.trim() || "",
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(Object.values(errorData).flat().join(", "));
            }

            const newSolve = await response.json();
            setSolves((prevSolves) => {
                // Ensure prevSolves is an array
                const currentSolves = Array.isArray(prevSolves) ? prevSolves : [];
                return [...currentSolves, newSolve];
            });

            setSolveTime("");
            setScramble("");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
            setError(err.message);
            console.error("Submission error:", err);
        }
    };

    // Add this handler function after other handlers
    const handleDelete = async (id) => {
        try {
            const response = await fetchWithTimeout(`${API_URL}/solves/${id}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete solve (${response.status})`);
            }

            // Remove the solve from state only if delete was successful
            setSolves((prev) => prev.filter((solve) => solve.id !== id));
        } catch (err) {
            setError(err.message);
            console.error("Delete error:", err);
        }
    };

    // Add theme toggle effect
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // Add an effect to save scramble when manually entered
    useEffect(() => {
        localStorage.setItem("lastScramble", scramble);
    }, [scramble]);

    // Add this effect:
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    // Add handler for scan completion
    const handleScanComplete = (colors) => {
        setCubeState(colors);
        setShowScanner(false);
        const detectedScramble = generateScrambleFromColors(colors);
        setScramble(detectedScramble);

        // Display detected state
        console.log("Detected cube state:", colors);
    };

    // Add cube state visualization
    const renderCubeState = () => {
        if (!cubeState) return null;

        return (
            <div className="grid grid-cols-3 gap-2 mt-4">
                {cubeState.map((face, i) => (
                    <div key={i} className="grid grid-cols-3 gap-1">
                        {face.map((color, j) => (
                            <div
                                key={j}
                                className="w-8 h-8 rounded"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-200">
                <div className="max-w-4xl mx-auto relative px-4 sm:px-6 lg:px-8">
                    {/* <div className="w-full mx-auto relative px-4"> */}{" "}
                    {/* full screen width*/}
                    <h1 className="mb-8 text-4xl font-extrabold text-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
                            RubikLog
                        </span>
                    </h1>
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`${customAnimationClasses.button} ${darkMode
                                ? "text-yellow-400 hover:before:border-yellow-400"
                                : "text-gray-900 dark:text-gray-100 hover:before:border-gray-900 dark:hover:before:border-gray-100"
                                }`}
                        >
                            {darkMode ? (
                                <svg
                                    className="w-6 h-6 relative"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-6 h-6 relative"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    {/* Stopwatch Display */}
                    <div
                        className={`
                        bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl 
                        shadow-lg mb-6 border-2 transition-all duration-300
                        ${isHolding
                                ? "border-red-400 scale-105"
                                : isRunning
                                    ? "border-emerald-400 scale-105"
                                    : "border-gray-200 dark:border-gray-700"
                            }
                    `}
                    >
                        <div className="text-center mb-4">
                            <div
                                className={`text-6xl font-mono mb-4 transition-colors ${isHolding
                                    ? "text-red-400"
                                    : isRunning
                                        ? "text-emerald-400"
                                        : "text-gray-800 dark:text-gray-100"
                                    }`}
                            >
                                {time.toFixed(2)}s
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg">
                                {isHolding
                                    ? "Release SPACE to start"
                                    : !timerActive
                                        ? "Hold SPACE to prepare"
                                        : "Press SPACE to stop"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <p>⌨️ Use SPACE to control the timer</p>
                                <p>🎯 Hold until red, release to start</p>
                                <p>⏱️ Press again to stop</p>
                            </div>
                        </div>
                    </div>
                    {/* Statistics */}
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            Statistics
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Best" value={getBestTime(solves)} />
                            <StatCard title="Average of 5" value={memoizedGetAo5} />
                            <StatCard title="Average of 12" value={memoizedGetAo12} />
                            <StatCard title="Total Solves" value={solves.length} />
                        </div>
                    </div>
                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 mb-2">
                                Solve Time (seconds)*:
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={solveTime}
                                    onChange={(e) => setSolveTime(e.target.value)}
                                    className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    readOnly
                                />
                            </label>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 mb-2">
                                Scramble (optional):
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={scramble}
                                        onChange={(e) => setScramble(e.target.value)}
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleNewScramble}
                                        className="mt-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </label>
                        </div>
                        <div className="mb-4">
                            {scramble && <ScrambleVisualizer scramble={scramble} />}
                        </div>
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium mb-2"
                            >
                                Scan Cube with Camera
                            </button>
                            {showScanner && (
                                <CubeScanner onScanComplete={handleScanComplete} />
                            )}
                        </div>
                        {cubeState && renderCubeState()}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-3 rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-300 font-medium"
                        >
                            Add Solve
                        </button>
                    </form>
                    {/* Solve Records */}
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Solve Records
                        </h2>
                        {isLoading && <LoadingSpinner />}
                        <div className="flex justify-between items-center mb-4">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
                            >
                                <option value="latest">Latest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="fastest">Fastest First</option>
                                <option value="slowest">Slowest First</option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 
                                        ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 
                                        ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        <div className="solves-list">
                            {!Array.isArray(paginatedSolves) ? (
                                <p>Loading solves...</p>
                            ) : paginatedSolves.length === 0 ? (
                                <p>No solves recorded yet</p>
                            ) : (
                                paginatedSolves.map((solve) => (
                                    <div key={solve.id} className="solve-item">
                                        <div
                                            className="border-b border-gray-200 dark:border-gray-700 py-4 flex justify-between items-center"
                                        >
                                            <div>
                                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                                    {formatTime(solve.time_taken)}s
                                                </span>
                                                {solve.scramble && (
                                                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                                                        - {solve.scramble}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {new Date(solve.created_at).toLocaleString()}
                                                </span>
                                                <DeleteButton onClick={() => handleDelete(solve.id)} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {showSuccess && (
                        <div className={customAnimationClasses.successMessage}>
                            Solve recorded successfully!
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;
