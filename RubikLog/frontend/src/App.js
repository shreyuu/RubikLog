import React, { useEffect, useState } from "react";

function App() {
    const [solves, setSolves] = useState([]);
    const [solveTime, setSolveTime] = useState("");
    const [scramble, setScramble] = useState("");

    // Fetch data from the Django API
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/solves/")
            .then((response) => response.json())
            .then((data) => setSolves(data));
    }, []);

    // Add a new solve record
    const handleSubmit = (e) => {
        e.preventDefault();

        const newSolve = { solve_time: solveTime, scramble };
        fetch("http://127.0.0.1:8000/api/solves/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSolve),
        })
            .then((response) => response.json())
            .then((data) => {
                setSolves([...solves, data]);
                setSolveTime("");
                setScramble("");
            });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Rubik's Cube Solver</h1>

                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="mb-4">
                        <label htmlFor="solveTime" className="block text-gray-700 font-medium mb-2">
                            Solve Time (in seconds):
                        </label>
                        <input
                            type="number"
                            id="solveTime"
                            value={solveTime}
                            onChange={(e) => setSolveTime(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="scramble" className="block text-gray-700 font-medium mb-2">
                            Scramble:
                        </label>
                        <textarea
                            id="scramble"
                            value={scramble}
                            onChange={(e) => setScramble(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Add Solve
                    </button>
                </form>

                <h2 className="text-xl font-semibold mb-4">Solve Records</h2>
                <ul className="divide-y divide-gray-300">
                    {solves.map((solve, index) => (
                        <li key={index} className="py-2">
                            <p className="text-gray-800">
                                <span className="font-bold">Time:</span> {solve.solve_time}s
                            </p>
                            <p className="text-gray-800">
                                <span className="font-bold">Scramble:</span> {solve.scramble}
                            </p>
                            <p className="text-gray-500 text-sm">
                                <span className="font-bold">Date:</span> {new Date(solve.date_solved).toLocaleString()}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
