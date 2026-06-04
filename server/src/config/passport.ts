import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import type { JwtPayload } from 'jsonwebtoken';
import config from './config';
import { tokenTypes } from './tokens';
import prisma from './prisma';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload: JwtPayload, done: VerifiedCallback): Promise<void> => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    //stateful check bổ sung cho tính stateless của JWT 
    const user = await prisma.user.findFirst({//cai nay kiem tra xem user co ton tai va chua bi xoa/ban hay khong
      where: { id: payload.sub as string, deletedAt: null },
    });
    if (!user || user.status !== 'active') {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
