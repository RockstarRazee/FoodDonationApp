const RoleDivider = () => {
    return (
        <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Admin Access
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>
    );
};

export default RoleDivider;
