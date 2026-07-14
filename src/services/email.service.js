import nodemailer from 'nodemailer'
import env from '../config/env.js'
import { logger } from '../helpers/index.js'

class EmailService {
  constructor() {
    this.transporter = null

    if (env.smtp.host && env.smtp.user && env.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
      })
    }
  }

  async sendMail({ to, subject, html, text }) {
    const mailOptions = {
      from: env.smtp.from,
      to,
      subject,
      html,
      text,
    }

    if (!this.transporter) {
      logger.info('Email (dev mode - SMTP not configured)', {
        to,
        subject,
        text,
      })
      return { messageId: 'dev-mode' }
    }

    return this.transporter.sendMail(mailOptions)
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`

    const subject = 'SmartSociety - Password Reset'
    const text = `Hi ${user.firstName},\n\nReset your password using this link (valid for ${env.passwordResetExpiresIn}):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`
    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Reset your password using the link below. This link is valid for <strong>${env.passwordResetExpiresIn}</strong>.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `

    return this.sendMail({ to: user.email, subject, html, text })
  }
}

export default new EmailService()
