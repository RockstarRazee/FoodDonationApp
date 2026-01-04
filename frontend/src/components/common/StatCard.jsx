import React from 'react';

const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`text-xl ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        {/* Hover Effect */}
        <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    </div>
);

export default StatCard;
