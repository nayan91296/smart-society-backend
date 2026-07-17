import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { fileURLToPath } from 'url'
import ApiError from '../utils/ApiError.js'
import { HTTP_STATUS } from '../constants/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads')
export const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, 'documents')

fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })

export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, DOCUMENTS_DIR)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ext && /^\.[a-z0-9]{1,10}$/i.test(ext) ? ext : ''
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${safeExt}`
    cb(null, name)
  },
})

export const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
      return cb(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Unsupported file type'))
    }
    return cb(null, true)
  },
})
