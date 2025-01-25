import React, { useState, useEffect } from "react";

function App() {
    const [solves, setSolves] = useState([]);
    const [solveTime, setSolveTime] = useState("");
    const [scramble, setScramble] = useState("");
    const [error, setError] = useState(null);

    // Format time function
    const formatTime = (timeString) => {
        const time = parseFloat(timeString);
        if (isNaN(time)) return "Invalid time";
        
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(2);
        return minutes > 0 ? 
            `${minutes}:${seconds.padStart(5, '0')}` : 
            seconds;
    };

    // Fetch data from the Django API
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/solves/")
            .then((response) => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then((data) => setSolves(data))
            .catch(error => setError(error.message));
    }, []);

    // Add a new solve record
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!solveTime) {
            setError("Please enter a solve time");
            return;
        }

        const newSolve = {
            solve_time: parseFloat(solveTime),
            scramble: scramble || null
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/solves/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSolve),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add solve');
            }

            const data = await response.json();
            setSolves([...solves, data]);
            setSolveTime("");
            setScramble("");
        } catch (err) {
            setError(err.message);
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
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
                                    <span className="font-medium">{formatTime(solve.solve_time)}s</span>
                                    {solve.scramble && (
                                        <span className="text-gray-600 ml-2">- {solve.scramble}</span>
                                    )}
                                </div>
                                <span className="text-gray-500 text-sm">
                                    {new Date(solve.created_at).toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
