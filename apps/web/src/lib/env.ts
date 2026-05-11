function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  googleClientId: () => required('GOOGLE_CLIENT_ID'),
  googleClientSecret: () => required('GOOGLE_CLIENT_SECRET'),
  nextAuthSecret: () => required('NEXTAUTH_SECRET'),
};
