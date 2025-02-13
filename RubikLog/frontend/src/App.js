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

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center">RubikLog</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Modified Stopwatch Display */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="text-center mb-4">
                        <div
                            className={`text-4xl font-mono mb-2 ${isHolding
                                ? "text-red-500"
                                : isRunning
                                    ? "text-green-500"
                                    : "text-gray-900"
                                }`}
                        >
                            {time.toFixed(2)}s
                        </div>
                        <div className="text-gray-500">
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
                    className="bg-white p-6 rounded-lg shadow-md mb-6"
                >
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">
                            Solve Time (seconds)*:
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={solveTime}
                                onChange={(e) => setSolveTime(e.target.value)}
                                className="w-full p-2 border rounded mt-1"
                                required
                                readOnly
                            />
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">
                            Scramble (optional):
                            <input
                                type="text"
                                value={scramble}
                                onChange={(e) => setScramble(e.target.value)}
                                className="w-full p-2 border rounded mt-1"
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Add Solve
                    </button>
                </form>

                {/* Solve Records */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Solve Records</h2>
                    {solves.length === 0 ? (
                        <p className="text-gray-500">No solves recorded yet.</p>
                    ) : (
                        solves.map((solve) => (
                            <div
                                key={solve.id}
                                className="border-b py-2 flex justify-between items-center"
                            >
                                <div>
                                    <span className="font-medium">
                                        {formatTime(solve.time_taken)}s
                                    </span>
                                    {solve.scramble && (
                                        <span className="text-gray-600 ml-2">
                                            - {solve.scramble}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-6"> {/* Increased gap from 4 to 6 */}
                                    <span className="text-gray-500 text-sm">
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
