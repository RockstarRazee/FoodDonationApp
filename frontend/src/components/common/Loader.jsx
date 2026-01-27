const Loader = ({ size = "md", color = "white", className = "" }) => {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-5 h-5 border-2",
        lg: "w-8 h-8 border-3",
        xl: "w-12 h-12 border-4"
    };

    const colorClasses = {
        white: "border-white border-t-transparent",
        blue: "border-blue-600 border-t-transparent",
        emerald: "border-emerald-600 border-t-transparent",
        current: "border-current border-t-transparent"
    };

    return (
        <div
            className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-label="loading"
        ></div>
    );
};

export default Loader;
