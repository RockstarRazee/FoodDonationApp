import Loader from './Loader';

const Button = ({
    children,
    isLoading = false,
    disabled = false,
    variant = 'primary',
    className = '',
    type = 'button',
    onClick,
    ...props
}) => {
    const baseClasses = "relative flex items-center justify-center font-bold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95";

    const variants = {
        primary: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:from-emerald-600 hover:to-green-700 hover:shadow-emerald-500/30 hover:-translate-y-1 active:translate-y-0",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        blue: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30",
        purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30"
    };

    const variantClasses = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${variantClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader size="md" color="current" />
                </div>
            )}
            <span className={`${isLoading ? 'opacity-0' : 'opacity-100'} flex items-center gap-2`}>
                {children}
            </span>
        </button>
    );
};

export default Button;
