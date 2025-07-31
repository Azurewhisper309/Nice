import xss from 'xss';

export function sanitizeUserInput({ displayName, principalName, role }) {
  if (!displayName || typeof displayName !== 'string') {
    throw new Error('Invalid display name');
  }
  const sanitizedDisplay = xss(displayName);
  if (sanitizedDisplay.length > 50) {
    throw new Error('Display name is too long');
  }

  if (!principalName || typeof principalName !== 'string') {
    throw new Error('Invalid email');
  }
  const sanitizedEmail = xss(principalName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new Error('Invalid email');
  }

  if (!role || typeof role !== 'string') {
    throw new Error('Invalid role');
  }
  const sanitizedRole = xss(role);

  return {
    display_name: sanitizedDisplay,
    email: sanitizedEmail,
    role: sanitizedRole,
  };
}
