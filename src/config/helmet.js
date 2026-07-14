import helmet from 'helmet'
import env from './env.js'

const helmetConfig = helmet({
  contentSecurityPolicy: env.isProd,
  crossOriginEmbedderPolicy: env.isProd,
})

export default helmetConfig
