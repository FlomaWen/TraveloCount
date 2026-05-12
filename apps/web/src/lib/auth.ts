import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env } from './env';

interface ApiTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; avatarUrl: string | null };
}

async function exchangeWithApi(idToken: string): Promise<ApiTokens> {
  console.log('[auth] calling API auth/google, apiUrl=', env.apiUrl, 'idToken len=', idToken?.length);
  const res = await fetch(`${env.apiUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[auth] API auth failed status=', res.status, 'body=', body);
    throw new Error(`API auth failed: ${res.status}`);
  }
  return res.json();
}

async function refreshApiTokens(refreshToken: string): Promise<ApiTokens | null> {
  const res = await fetch(`${env.apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return res.json();
}

export const authOptions: NextAuthOptions = {
  secret: env.nextAuthSecret(),
  providers: [
    GoogleProvider({
      clientId: env.googleClientId(),
      clientSecret: env.googleClientSecret(),
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        console.log('[auth] account keys:', Object.keys(account), 'id_token present:', !!account.id_token, 'id_token length:', account.id_token?.length);
      }
      if (account?.id_token) {
        try {
          const tokens = await exchangeWithApi(account.id_token);
          token.accessToken = tokens.accessToken;
          token.refreshToken = tokens.refreshToken;
          token.userId = tokens.user.id;
          // access token TTL 15m: schedule refresh ~1m before
          token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
        } catch (e) {
          console.error('Failed to exchange Google id token with API', e);
          return { ...token, error: 'ApiExchangeError' };
        }
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      if (token.refreshToken) {
        const refreshed = await refreshApiTokens(token.refreshToken as string);
        if (refreshed) {
          token.accessToken = refreshed.accessToken;
          token.refreshToken = refreshed.refreshToken;
          token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
          return token;
        }
        return { ...token, error: 'RefreshAccessTokenError' };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.userId = token.userId as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
