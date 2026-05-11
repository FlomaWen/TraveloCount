export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/((?!login|j/|api/auth|_next|favicon.ico).*)'],
};
