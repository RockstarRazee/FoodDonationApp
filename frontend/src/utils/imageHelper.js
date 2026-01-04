export const getImageUrl = (path) => {
    if (!path) return null;

    // If it's already a full URL (e.g., Google photo or already formatted), return it
    if (path.startsWith('http') || path.startsWith('blob:')) {
        return path;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Replace backslashes with forward slashes for Windows paths
    const normalizedPath = cleanPath.replace(/\\/g, '/');

    // Return full backend URL
    return `http://localhost:5000/${normalizedPath}`;
};
