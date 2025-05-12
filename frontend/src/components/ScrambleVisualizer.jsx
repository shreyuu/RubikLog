import React from 'react';

const CubeFace = ({ colors, debug }) => {
    return (
        <div className="grid grid-cols-3 gap-0.5 w-24 h-24">
            {colors.map((color, index) => (
                <div
                    key={index}
                    className={`w-full h-full ${color} border border-gray-300 dark:border-gray-600`}
                    style={{ aspectRatio: '1' }}
                >
                    {debug && <span className="text-xs">{index}</span>}
                </div>
            ))}
        </div>
    );
};

const ScrambleVisualizer = ({ scramble }) => {
    // Initial cube state (solved)
    const initialState = {
        up: Array(9).fill('bg-cubeColors-white'),
        right: Array(9).fill('bg-cubeColors-red'),
        front: Array(9).fill('bg-cubeColors-green'),
        down: Array(9).fill('bg-cubeColors-yellow'),
        left: Array(9).fill('bg-cubeColors-orange'),
        back: Array(9).fill('bg-cubeColors-blue')
    };

    const rotateLayer = (face, isClockwise) => {
        const newFace = [...face];
        if (isClockwise) {
            [
                newFace[0], newFace[1], newFace[2],
                newFace[3], newFace[4], newFace[5],
                newFace[6], newFace[7], newFace[8]
            ] = [
                    newFace[6], newFace[3], newFace[0],
                    newFace[7], newFace[4], newFace[1],
                    newFace[8], newFace[5], newFace[2]
                ];
        } else {
            [
                newFace[0], newFace[1], newFace[2],
                newFace[3], newFace[4], newFace[5],
                newFace[6], newFace[7], newFace[8]
            ] = [
                    newFace[2], newFace[5], newFace[8],
                    newFace[1], newFace[4], newFace[7],
                    newFace[0], newFace[3], newFace[6]
                ];
        }
        return newFace;
    };

    const applyMove = (state, move) => {
        const newState = JSON.parse(JSON.stringify(state));
        const isDouble = move.includes('2');
        const isCounterClockwise = move.includes("'");
        const baseMoves = {
            'R': () => {
                // Right face rotation
                newState.right = rotateLayer(newState.right, !isCounterClockwise);
                // Adjacent faces
                let temp = [...newState.up];
                if (!isCounterClockwise) {
                    [newState.up[2], newState.up[5], newState.up[8]] = [newState.front[2], newState.front[5], newState.front[8]];
                    [newState.front[2], newState.front[5], newState.front[8]] = [newState.down[2], newState.down[5], newState.down[8]];
                    [newState.down[2], newState.down[5], newState.down[8]] = [newState.back[6], newState.back[3], newState.back[0]];
                    [newState.back[6], newState.back[3], newState.back[0]] = [temp[2], temp[5], temp[8]];
                } else {
                    [newState.up[2], newState.up[5], newState.up[8]] = [newState.back[6], newState.back[3], newState.back[0]];
                    [newState.back[6], newState.back[3], newState.back[0]] = [newState.down[2], newState.down[5], newState.down[8]];
                    [newState.down[2], newState.down[5], newState.down[8]] = [newState.front[2], newState.front[5], newState.front[8]];
                    [newState.front[2], newState.front[5], newState.front[8]] = [temp[2], temp[5], temp[8]];
                }
            },
            'L': () => {
                // Left face rotation
                newState.left = rotateLayer(newState.left, !isCounterClockwise);
                // Adjacent faces
                let temp = [...newState.up];
                if (!isCounterClockwise) {
                    [newState.up[0], newState.up[3], newState.up[6]] = [newState.back[8], newState.back[5], newState.back[2]];
                    [newState.back[8], newState.back[5], newState.back[2]] = [newState.down[0], newState.down[3], newState.down[6]];
                    [newState.down[0], newState.down[3], newState.down[6]] = [newState.front[0], newState.front[3], newState.front[6]];
                    [newState.front[0], newState.front[3], newState.front[6]] = [temp[0], temp[3], temp[6]];
                } else {
                    [newState.up[0], newState.up[3], newState.up[6]] = [newState.front[0], newState.front[3], newState.front[6]];
                    [newState.front[0], newState.front[3], newState.front[6]] = [newState.down[0], newState.down[3], newState.down[6]];
                    [newState.down[0], newState.down[3], newState.down[6]] = [newState.back[8], newState.back[5], newState.back[2]];
                    [newState.back[8], newState.back[5], newState.back[2]] = [temp[0], temp[3], temp[6]];
                }
            },
            'U': () => {
                // Up face rotation
                newState.up = rotateLayer(newState.up, !isCounterClockwise);
                // Adjacent faces
                let temp = newState.front[0], temp2 = newState.front[1], temp3 = newState.front[2];
                if (!isCounterClockwise) {
                    [newState.front[0], newState.front[1], newState.front[2]] = [newState.right[0], newState.right[1], newState.right[2]];
                    [newState.right[0], newState.right[1], newState.right[2]] = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.back[0], newState.back[1], newState.back[2]] = [newState.left[0], newState.left[1], newState.left[2]];
                    [newState.left[0], newState.left[1], newState.left[2]] = [temp, temp2, temp3];
                } else {
                    [newState.front[0], newState.front[1], newState.front[2]] = [newState.left[0], newState.left[1], newState.left[2]];
                    [newState.left[0], newState.left[1], newState.left[2]] = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.back[0], newState.back[1], newState.back[2]] = [newState.right[0], newState.right[1], newState.right[2]];
                    [newState.right[0], newState.right[1], newState.right[2]] = [temp, temp2, temp3];
                }
            },
            'D': () => {
                // Down face rotation
                newState.down = rotateLayer(newState.down, !isCounterClockwise);
                // Adjacent faces
                let temp = newState.front[6], temp2 = newState.front[7], temp3 = newState.front[8];
                if (!isCounterClockwise) {
                    [newState.front[6], newState.front[7], newState.front[8]] = [newState.left[6], newState.left[7], newState.left[8]];
                    [newState.left[6], newState.left[7], newState.left[8]] = [newState.back[6], newState.back[7], newState.back[8]];
                    [newState.back[6], newState.back[7], newState.back[8]] = [newState.right[6], newState.right[7], newState.right[8]];
                    [newState.right[6], newState.right[7], newState.right[8]] = [temp, temp2, temp3];
                } else {
                    [newState.front[6], newState.front[7], newState.front[8]] = [newState.right[6], newState.right[7], newState.right[8]];
                    [newState.right[6], newState.right[7], newState.right[8]] = [newState.back[6], newState.back[7], newState.back[8]];
                    [newState.back[6], newState.back[7], newState.back[8]] = [newState.left[6], newState.left[7], newState.left[8]];
                    [newState.left[6], newState.left[7], newState.left[8]] = [temp, temp2, temp3];
                }
            },
            'F': () => {
                // Front face rotation
                newState.front = rotateLayer(newState.front, !isCounterClockwise);
                // Adjacent faces
                let temp = [...newState.up];
                if (!isCounterClockwise) {
                    [newState.up[6], newState.up[7], newState.up[8]] = [newState.left[8], newState.left[5], newState.left[2]];
                    [newState.left[8], newState.left[5], newState.left[2]] = [newState.down[2], newState.down[1], newState.down[0]];
                    [newState.down[2], newState.down[1], newState.down[0]] = [newState.right[0], newState.right[3], newState.right[6]];
                    [newState.right[0], newState.right[3], newState.right[6]] = [temp[6], temp[7], temp[8]];
                } else {
                    [newState.up[6], newState.up[7], newState.up[8]] = [newState.right[0], newState.right[3], newState.right[6]];
                    [newState.right[0], newState.right[3], newState.right[6]] = [newState.down[2], newState.down[1], newState.down[0]];
                    [newState.down[2], newState.down[1], newState.down[0]] = [newState.left[8], newState.left[5], newState.left[2]];
                    [newState.left[8], newState.left[5], newState.left[2]] = [temp[6], temp[7], temp[8]];
                }
            },
            'B': () => {
                // Back face rotation
                newState.back = rotateLayer(newState.back, !isCounterClockwise);
                // Adjacent faces
                let temp = [...newState.up];
                if (!isCounterClockwise) {
                    [newState.up[0], newState.up[1], newState.up[2]] = [newState.right[2], newState.right[5], newState.right[8]];
                    [newState.right[2], newState.right[5], newState.right[8]] = [newState.down[8], newState.down[7], newState.down[6]];
                    [newState.down[8], newState.down[7], newState.down[6]] = [newState.left[6], newState.left[3], newState.left[0]];
                    [newState.left[6], newState.left[3], newState.left[0]] = [temp[0], temp[1], temp[2]];
                } else {
                    [newState.up[0], newState.up[1], newState.up[2]] = [newState.left[6], newState.left[3], newState.left[0]];
                    [newState.left[6], newState.left[3], newState.left[0]] = [newState.down[8], newState.down[7], newState.down[6]];
                    [newState.down[8], newState.down[7], newState.down[6]] = [newState.right[2], newState.right[5], newState.right[8]];
                    [newState.right[2], newState.right[5], newState.right[8]] = [temp[0], temp[1], temp[2]];
                }
            }
        };

        const moveChar = move[0];
        if (moveChar in baseMoves) {
            baseMoves[moveChar]();
            if (isDouble) {
                baseMoves[moveChar](); // Apply the same move again for double moves
            }
        }

        return newState;
    };

    const applyScramble = (scramble) => {
        let state = { ...initialState };
        if (!scramble) return state;

        const moves = scramble.split(' ').filter(move => move.length > 0);
        moves.forEach(move => {
            state = applyMove(state, move);
        });
        return state;
    };

    const currentState = applyScramble(scramble);

    return (
        <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Scramble Visualization</h3>
            <div className="flex flex-col items-center gap-4">
                <div className="w-24">
                    <CubeFace colors={currentState.up} />
                </div>
                <div className="flex gap-4">
                    <CubeFace colors={currentState.left} />
                    <CubeFace colors={currentState.front} />
                    <CubeFace colors={currentState.right} />
                    <CubeFace colors={currentState.back} />
                </div>
                <div className="w-24">
                    <CubeFace colors={currentState.down} />
                </div>
            </div>
        </div>
    );
};

export default ScrambleVisualizer;