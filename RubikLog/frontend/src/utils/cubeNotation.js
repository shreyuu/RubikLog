export const generateScrambleFromColors = (colors) => {
    const moves = [];
    const faces = ['U', 'R', 'F', 'B', 'L', 'D'];

    // Get center colors for orientation
    const centerColors = faces.map((_, i) => colors[i][4]);

    // Determine cube orientation based on center colors
    const colorMapping = {};
    faces.forEach((face, i) => {
        colorMapping[centerColors[i]] = face;
    });

    // Generate moves based on color patterns and orientation
    faces.forEach((face, i) => {
        const faceColors = colors[i];
        const centerColor = centerColors[i];

        // Check each sticker against the center color
        faceColors.forEach((color, j) => {
            if (j !== 4 && color !== centerColor) {
                const targetFace = colorMapping[color];
                if (targetFace) {
                    moves.push(`${targetFace}'`);
                }
            }
        });
    });

    return moves.join(' ') || "Scramble not detected";
};