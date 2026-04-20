import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { UserJwtPayload } from './auth';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('JWT_SECRET is not defined');
  }
  return secret;
};

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload as UserJwtPayload;
  } catch (error) {
    throw error;
  }
};

export const createToken = async (payload: UserJwtPayload, expiresIn: string = '24h') => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(getJwtSecretKey()));
};

export const getUserContext = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await verifyAuth(token);
    return verified;
  } catch (error) {
    return null;
  }
};
