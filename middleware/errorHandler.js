/**
 * Global error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);

    const errorMessage = err.message || 'Internal Server Error';
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: errorMessage,
        status: statusCode
    });
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    errorHandler,
    asyncHandler
}; 