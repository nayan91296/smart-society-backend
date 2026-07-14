import morgan from 'morgan'
import env from './env.js'

const morganConfig = morgan(env.isDev ? 'dev' : 'combined')

export default morganConfig
