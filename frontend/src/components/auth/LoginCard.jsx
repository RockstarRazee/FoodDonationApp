import React from 'react';
import { FaLeaf } from 'react-icons/fa';

const LoginCard = ({ children, title }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up border border-gray-100">
            {/* Header Branding */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <FaLeaf className="text-3xl text-emerald-500" />
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {title || "FoodConnect"}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div>
                {children}
            </div>
        </div>
    );
};

export default LoginCard;
