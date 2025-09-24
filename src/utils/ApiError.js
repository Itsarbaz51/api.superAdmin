class ApiError extends Error {
  static send(res, statusCode, message) {
    return res.status(statusCode).json({
      success: false,
      message,
      stack:
        process.env.NODE_ENV === "development" ? new Error().stack : undefined,
    });
  }
}

export default ApiError;
