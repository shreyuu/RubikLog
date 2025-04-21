export const validateCubeState = (colors) => {
    // Check if all faces have 9 stickers
    if (!colors || colors.length !== 6 || colors.some(face => !face || face.length !== 9)) {
        return false;
    }

    // Count center colors (should have exactly one of each)
    const centerColors = colors.map(face => face[4]);
    const uniqueCenters = new Set(centerColors);
    if (uniqueCenters.size !== 6) {
        return false;
    }

    // Count total stickers of each color (should have exactly 9 of each)
    const allStickers = colors.flat();
    const colorCounts = allStickers.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1;
        return acc;
    }, {});

    return Object.values(colorCounts).every(count => count === 9);
};

export const generateScrambleFromColors = (colors) => {
    if (!validateCubeState(colors)) {
        throw new Error('Invalid cube state detected');
    }

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