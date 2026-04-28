export const extensionCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export function withCorsHeaders(headers?: HeadersInit) {
  return {
    ...extensionCorsHeaders,
    ...(headers ?? {})
  };
}