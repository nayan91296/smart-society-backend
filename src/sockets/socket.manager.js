let ioInstance = null

const setIO = (io) => {
  ioInstance = io
}

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized')
  }

  return ioInstance
}

export { setIO, getIO }
