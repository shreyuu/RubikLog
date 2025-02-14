import React, { useState, useEffect, useCallback } from "react";
import DeleteButton from "./components/DeleteButton";

function App() {
    const [solves, setSolves] = useState([]);
    const [solveTime, setSolveTime] = useState("");
    const [scramble, setScramble] = useState("");
    const [error, setError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [darkMode, setDarkMode] = useState(true);

    // Format time function
    const formatTime = (timeString) => {
        const time = parseFloat(timeString);
        if (isNaN(time)) return "Invalid time";

        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(2);
        return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
    };

    // Fetch data from the Django API
    useEffect(() => {
        const fetchSolves = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/solves/");
                if (!response.ok) throw new Error("Failed to fetch solves");
                const data = await response.json();
                setSolves(data);
            } catch (err) {
                setError(err.message);
                console.error("Fetch error:", err);
            }
        };
        fetchSolves();
    }, []);

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
                    }
                }
                setIsHolding(false);
            }
        },
        [isHolding, timerActive, time]
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
            const response = await fetch("http://127.0.0.1:8000/api/solves/", {
                method: "POST",
                body: JSON.stringify({
                    time_taken: timeValue, // Changed from solve_time to time_taken
                    scramble: scramble.trim() || "", // Changed null to empty string
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(Object.values(errorData).flat().join(", "));
            }

            const data = await response.json();
            setSolves((prev) => [...prev, data]);
            setSolveTime("");
            setScramble("");
        } catch (err) {
            setError(err.message);
            console.error("Submission error:", err);
        }
    };

    // Add this handler function after other handlers
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/solves/${id}/`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
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
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-200">
            <div className="max-w-2xl mx-auto relative">
                <h1 className="mb-8 text-4xl font-extrabold text-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
                        RubikLog
                    </span>
                </h1>

                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg bg-gray-800 dark:bg-gray-200 transition-colors duration-200"
                    >
                        {darkMode ? (
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
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
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-4">
                        <div
                            className={`text-6xl font-mono mb-4 transition-colors ${isHolding
                                ? "text-red-400"
                                : isRunning
                                    ? "text-emerald-400"
                                    : "text-gray-100"
                                }`}
                        >
                            {time.toFixed(2)}s
                        </div>
                        <div className="text-gray-400 text-lg">
                            {isHolding
                                ? "Release SPACE to start"
                                : !timerActive
                                    ? "Hold SPACE to prepare"
                                    : "Press SPACE to stop"}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700"
                >
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2">
                            Solve Time (seconds)*:
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={solveTime}
                                onChange={(e) => setSolveTime(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg mt-1 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                readOnly
                            />
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2">
                            Scramble (optional):
                            <input
                                type="text"
                                value={scramble}
                                onChange={(e) => setScramble(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg mt-1 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </label>
                    </div>
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
                    {solves.length === 0 ? (
                        <p className="text-gray-400">No solves recorded yet.</p>
                    ) : (
                        solves.map((solve) => (
                            <div
                                key={solve.id}
                                className="border-b border-gray-700 py-4 flex justify-between items-center"
                            >
                                <div>
                                    <span className="font-medium text-gray-100">
                                        {formatTime(solve.time_taken)}s
                                    </span>
                                    {solve.scramble && (
                                        <span className="text-gray-400 ml-2">
                                            - {solve.scramble}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-gray-400 text-sm">
                                        {new Date(solve.created_at).toLocaleString()}
                                    </span>
                                    <DeleteButton onClick={() => handleDelete(solve.id)} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
