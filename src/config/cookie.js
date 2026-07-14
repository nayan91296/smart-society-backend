import env from './env.js'

export const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'strict' : 'lax',
  domain: env.cookieDomain,
}

export default cookieOptions
