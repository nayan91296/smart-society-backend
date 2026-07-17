import fs from 'fs/promises'
import path from 'path'
import { DOCUMENTS_DIR, UPLOADS_ROOT } from '../config/upload.js'

/**
 * Local disk storage abstraction. Swap implementation later for S3/GCS.
 */
class LocalDocumentStorage {
  buildStorageKey(filename) {
    return `documents/${filename}`
  }

  buildPublicUrl(storageKey) {
    const key = storageKey.replace(/^\/+/, '')
    return `/uploads/${key}`
  }

  resolveAbsolutePath(storageKey) {
    const key = storageKey.replace(/^\/+/, '')
    const absolute = path.resolve(UPLOADS_ROOT, key)
    if (!absolute.startsWith(UPLOADS_ROOT)) {
      throw new Error('Invalid storage key')
    }
    return absolute
  }

  async delete(storageKey) {
    if (!storageKey) return false
    try {
      await fs.unlink(this.resolveAbsolutePath(storageKey))
      return true
    } catch {
      return false
    }
  }

  getDocumentsDir() {
    return DOCUMENTS_DIR
  }
}

const documentStorage = new LocalDocumentStorage()

export default documentStorage
