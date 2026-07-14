import compression from 'compression'

const compressionConfig = compression({
  level: 6,
  threshold: 1024,
})

export default compressionConfig
