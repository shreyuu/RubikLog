import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SolveList } from './components/SolveList';
import { Timer } from './components/Timer';
import { ScrambleDisplay } from './components/ScrambleDisplay';
import { generateScramble } from './utils/scrambleGenerator';

function App() {
    const [solves, setSolves] = useState([]);
    const [currentScramble, setCurrentScramble] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Generate initial scramble
        setCurrentScramble(generateScramble());
        // Fetch initial solves
        fetchSolves();
    }, []);

    const fetchSolves = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/solves/');
            setSolves(response.data);
        } catch (error) {
            console.error('Error fetching solves:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSolveComplete = async (time) => {
        try {
            await axios.post('http://localhost:8000/api/solves/', {
                time_taken: time,
                scramble: currentScramble
            });
            fetchSolves();
            setCurrentScramble(generateScramble());
        } catch (error) {
            console.error('Error saving solve:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">RubikLog</h1>
            <ScrambleDisplay scramble={currentScramble} />
            <Timer onSolveComplete={handleSolveComplete} />
            <SolveList solves={solves} isLoading={isLoading} />
        </div>
    );
}

export default App;
