import React from 'react';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500 to-teal-600">
            {/* Main Content Container */}
            <div className="w-full max-w-[400px]">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
