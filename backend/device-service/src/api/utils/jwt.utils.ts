import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN_RAW: string = process.env.JWT_EXPIRES_IN as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
if (!JWT_EXPIRES_IN_RAW) {
  throw new Error('JWT_EXPIRES_IN is not set');
}

// Convert numeric value to hours format if needed (e.g., "24" -> "24h")
const JWT_EXPIRES_IN: string = /^\d+$/.test(JWT_EXPIRES_IN_RAW) 
  ? `${JWT_EXPIRES_IN_RAW}h` 
  : JWT_EXPIRES_IN_RAW;

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'student' | 'staff';
}

export const generateToken = (payload: JwtPayload): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error(`Invalid token: ${error.message}`);
    }
    throw new Error('Token verification failed');
  }
};

