import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ title, value }) => {
    return (
        <div
            className="bg-white/70 dark:bg-gray-700/70 p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm"
            role="region"
            aria-label={title}
        >
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                {title}
            </h3>
            <p className="mt-1 text-xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
};

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]).isRequired
};

export default StatCard;