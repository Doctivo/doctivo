import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'doctivo-super-secret-key-for-jwt-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'doctivo-super-secret-key-for-refresh-2026';

export const generateTokens = (userId: string, role: string) => {
  // Access Token: Short-lived (1 hour)
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  
  // Refresh Token: Long-lived (30 days)
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string, role: string };
  } catch (error) {
    return null;
  }
};
