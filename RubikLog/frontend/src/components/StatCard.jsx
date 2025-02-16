import React from 'react';

const StatCard = ({ title, value }) => {
    return (
        <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {value}
            </p>
        </div>
    );
};

export default StatCard;