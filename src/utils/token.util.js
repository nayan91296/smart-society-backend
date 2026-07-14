import crypto from 'node:crypto'

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = hashToken(resetToken)

  return { resetToken, hashedToken }
}

export { hashToken, generatePasswordResetToken }
