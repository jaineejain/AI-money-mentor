export function notFoundHandler(request, response) {
  response
    .status(404)
    .json({
      detail: `Route not found: ${request.method} ${request.originalUrl}`,
    });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error(error);
  response.status(error.statusCode || 500).json({
    detail: error.statusCode ? error.message : "Internal server error.",
  });
}
