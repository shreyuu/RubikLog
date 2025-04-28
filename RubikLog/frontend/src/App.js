import React, { useState, useEffect } from 'react';
import StatCard from './components/StatCard';
import DeleteButton from './components/DeleteButton';
import { generateScramble } from './utils/scrambleGenerator';

function App() {
    const [solves, setSolves] = useState([]);
    const [currentScramble, setCurrentScramble] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setCurrentScramble(generateScramble());
        fetchSolves();
    }, []);

    const fetchSolves = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/solves/');
            const data = await response.json();
            setSolves(data.results);
        } catch (error) {
            setError('Error fetching solves');
            console.error('Error fetching solves:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSolveComplete = async (time) => {
        try {
            const response = await fetch('http://localhost:8000/api/solves/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time_taken: time,
                    scramble: currentScramble
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save solve');
            }

            await fetchSolves();
            setCurrentScramble(generateScramble());
        } catch (error) {
            setError('Error saving solve');
            console.error('Error saving solve:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">RubikLog</h1>
            <div className="scramble-display mb-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Scramble:</h2>
                <p className="text-lg">{currentScramble}</p>
            </div>

            <div className="solve-timer mb-6">
                {error && <div className="error-message text-red-500 mb-4">{error}</div>}
                <button
                    onClick={() => handleSolveComplete()}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg"
                >
                    Start Timer
                </button>
            </div>

            <div className="solves-list">
                <h2 className="text-2xl font-semibold mb-4">Recent Solves</h2>
                {isLoading ? (
                    <p>Loading solves...</p>
                ) : (
                    <div className="grid gap-4">
                        {solves.map(solve => (
                            <StatCard
                                key={solve.id}
                                title={new Date(solve.created_at).toLocaleString()}
                                value={`${solve.time_taken}s`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
