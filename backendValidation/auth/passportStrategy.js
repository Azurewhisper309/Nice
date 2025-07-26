import { OIDCStrategy } from 'passport-azure-ad';

dotenv.config(); // Load environment variables from .env file

export const azureStrategy = new OIDCStrategy({
  identityMetadata: `${process.env.AZURE_AUTHORITY}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: process.env.AZURE_REDIRECT_URI,
  allowHttpForRedirectUrl: true,
  scope: ['openid', 'profile', 'email']
}, (issuer, subject, profile, accessToken, refreshToken, done) => {
  if (!profile.oid) return done(new Error('No oid found'), null);
  const user = {
    oid: profile.oid,
    displayName: profile.displayName,
    principalName: profile._json.preferred_username,
    roles: profile._json.roles || []
  };
  return done(null, user);
});
