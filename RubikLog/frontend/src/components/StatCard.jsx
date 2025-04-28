import React, { memo } from 'react';

const StatCard = memo(({ title, value }) => {
    return (
        <div className="bg-white/70 dark:bg-gray-700/70 p-4 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {title}
            </h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;