import { withIronSession } from 'next-iron-session';

/** Create cookie handler. */
export default function withSession(handler: any) {
  return withIronSession(handler, {
    password: process.env.SECRET_COOKIE_PASSWORD
      ? process.env.SECRET_COOKIE_PASSWORD
      : '',
    cookieName: 'auth',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'strict',
      httpOnly: true,
    },
  });
}

/** Assign context. */
function _withAuth(handler: any) {
  return async (context: any) => {
    const newCtx = {
      ...context,
    };

    return handler(newCtx);
  };
}

/** Function to parse the cookies. */
export function withAuth(handler: any) {
  return withSession(_withAuth(handler));
}
