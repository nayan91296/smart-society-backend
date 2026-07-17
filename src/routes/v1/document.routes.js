import { Router } from 'express'
import documentController from '../../controllers/document.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { documentUpload } from '../../config/upload.js'
import { ROLES } from '../../constants/roles.js'
import {
  createDocumentRules,
  documentIdRules,
  documentListRules,
  updateDocumentRules,
} from '../../validators/document.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(documentListRules), documentController.list)
router.post(
  '/',
  documentUpload.single('file'),
  validate(createDocumentRules),
  documentController.create,
)
router.get('/:id/download', validate(documentIdRules), documentController.download)
router.get('/:id', validate(documentIdRules), documentController.get)
router.patch('/:id', validate(updateDocumentRules), documentController.update)
router.delete('/:id', validate(documentIdRules), documentController.softDelete)

export default router
