import { Router } from 'express'
import societyController from '../../controllers/society.controller.js'
import wingSecretaryController from '../../controllers/wingSecretary.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import requireWingScope from '../../middlewares/requireWingScope.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  bulkCreateFloorRules,
  createFlatRules,
  createFloorRules,
  createWingRules,
  flatIdRules,
  flatListRules,
  floorIdRules,
  floorListRules,
  promoteWingSecretaryRules,
  updateFlatRules,
  updateFloorRules,
  updateProfileRules,
  updateWingRules,
  wingIdParamRules,
  wingIdRules,
  wingListRules,
  wingSecretaryParamRules,
} from '../../validators/society.validator.js'

const router = Router()

const adminOnly = [
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
]

const wingOps = [
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN, ROLES.WING_SECRETARY),
  requireSocietyContext,
  requireWingScope,
]

router.get('/profile', ...adminOnly, societyController.getProfile)
router.patch('/profile', ...adminOnly, validate(updateProfileRules), societyController.updateProfile)
router.get('/overview', ...adminOnly, societyController.getOverview)
router.get('/dashboard', ...wingOps, societyController.getDashboard)

router.get('/wings', ...adminOnly, validate(wingListRules), societyController.listWings)
router.post('/wings', ...adminOnly, validate(createWingRules), societyController.createWing)
router.get('/wings/:id', ...adminOnly, validate(wingIdRules), societyController.getWing)
router.patch('/wings/:id', ...adminOnly, validate(updateWingRules), societyController.updateWing)
router.delete('/wings/:id', ...adminOnly, validate(wingIdRules), societyController.deleteWing)

router.get(
  '/wings/:wingId/secretary',
  ...adminOnly,
  validate(wingSecretaryParamRules),
  wingSecretaryController.get,
)
router.post(
  '/wings/:wingId/secretary',
  ...adminOnly,
  validate(promoteWingSecretaryRules),
  wingSecretaryController.promote,
)
router.delete(
  '/wings/:wingId/secretary',
  ...adminOnly,
  validate(wingSecretaryParamRules),
  wingSecretaryController.demote,
)

router.get(
  '/wings/:wingId/floors',
  ...adminOnly,
  validate(wingIdParamRules),
  societyController.listFloors,
)
router.post(
  '/wings/:wingId/floors',
  ...adminOnly,
  validate(createFloorRules),
  societyController.createFloor,
)
router.post(
  '/wings/:wingId/floors/bulk',
  ...adminOnly,
  validate(bulkCreateFloorRules),
  societyController.bulkCreateFloors,
)

router.get('/floors', ...adminOnly, validate(floorListRules), societyController.listAllFloors)
router.get('/floors/:id', ...adminOnly, validate(floorIdRules), societyController.getFloor)
router.patch('/floors/:id', ...adminOnly, validate(updateFloorRules), societyController.updateFloor)
router.delete('/floors/:id', ...adminOnly, validate(floorIdRules), societyController.deleteFloor)

router.get('/flats', ...wingOps, validate(flatListRules), societyController.listFlats)
router.post('/flats', ...wingOps, validate(createFlatRules), societyController.createFlat)
router.get('/flats/:id', ...wingOps, validate(flatIdRules), societyController.getFlat)
router.patch('/flats/:id', ...wingOps, validate(updateFlatRules), societyController.updateFlat)
router.delete('/flats/:id', ...wingOps, validate(flatIdRules), societyController.deleteFlat)

export default router
