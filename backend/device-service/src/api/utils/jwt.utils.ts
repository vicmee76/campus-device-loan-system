import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
if (!JWT_EXPIRES_IN) {
  throw new Error('JWT_EXPIRES_IN is not set');
}

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
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

