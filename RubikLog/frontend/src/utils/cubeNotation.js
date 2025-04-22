const validateCorners = (colors) => {
    // Add logic to validate corners if necessary
    return true; // Placeholder for corner validation logic
};

export const validateCubeState = (colors) => {
    // Count each color
    const colorCount = colors.flat().reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1;
        return acc;
    }, {});

    // Each color should appear exactly 9 times
    const validCount = Object.values(colorCount).every(count => count === 9);
    if (!validCount) return false;

    // Validate center pieces (must be different)
    const centers = colors.map(face => face[4]);
    const uniqueCenters = new Set(centers);
    if (uniqueCenters.size !== 6) return false;

    // Validate corner pieces
    const corners = validateCorners(colors);
    if (!corners) return false;

    return true;
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