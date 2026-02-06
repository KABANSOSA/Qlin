// Middleware disabled - using ProtectedRoute component instead
// This avoids hydration issues with localStorage
export function middleware() {
  // Empty middleware - auth is handled client-side
}

export const config = {
  matcher: [],
}
