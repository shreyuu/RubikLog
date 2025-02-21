const moves = ["R", "L", "U", "D", "F", "B"];
const modifiers = ["", "'", "2"];

export const generateScramble = (length = 20) => {
    let scramble = [];
    let lastMove = "";

    for (let i = 0; i < length; i++) {
        let move;
        do {
            move = moves[Math.floor(Math.random() * moves.length)];
        } while (move === lastMove);

        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        scramble.push(move + modifier);
        lastMove = move;
    }

    return scramble.join(" ");
};
