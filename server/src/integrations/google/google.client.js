import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

let client = null;
if (env.GOOGLE_CLIENT_ID) {
  client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
}

export const verifyGoogleIdToken = async (idToken) => {
  if (!idToken) {
    throw new Error('Google ID token is required');
  }

  // If no Google client configured in dev, support mocked payload
  if (!client || !env.GOOGLE_CLIENT_ID) {
    logger.info('[SIMULATED] Google OAuth verification');
    return {
      sub: `google_sim_${Date.now()}`,
      email: 'google_user@example.com',
      name: 'Google User',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      email_verified: true,
    };
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

export default { verifyGoogleIdToken };
