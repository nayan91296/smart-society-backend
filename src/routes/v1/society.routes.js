import { Router } from 'express'
import societyController from '../../controllers/society.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
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
  updateFlatRules,
  updateFloorRules,
  updateProfileRules,
  updateWingRules,
  wingIdParamRules,
  wingIdRules,
  wingListRules,
} from '../../validators/society.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/profile', societyController.getProfile)
router.patch('/profile', validate(updateProfileRules), societyController.updateProfile)
router.get('/overview', societyController.getOverview)
router.get('/dashboard', societyController.getDashboard)

router.get('/wings', validate(wingListRules), societyController.listWings)
router.post('/wings', validate(createWingRules), societyController.createWing)
router.get('/wings/:id', validate(wingIdRules), societyController.getWing)
router.patch('/wings/:id', validate(updateWingRules), societyController.updateWing)
router.delete('/wings/:id', validate(wingIdRules), societyController.deleteWing)

router.get(
  '/wings/:wingId/floors',
  validate(wingIdParamRules),
  societyController.listFloors,
)
router.post(
  '/wings/:wingId/floors',
  validate(createFloorRules),
  societyController.createFloor,
)
router.post(
  '/wings/:wingId/floors/bulk',
  validate(bulkCreateFloorRules),
  societyController.bulkCreateFloors,
)

router.get('/floors', validate(floorListRules), societyController.listAllFloors)
router.get('/floors/:id', validate(floorIdRules), societyController.getFloor)
router.patch('/floors/:id', validate(updateFloorRules), societyController.updateFloor)
router.delete('/floors/:id', validate(floorIdRules), societyController.deleteFloor)

router.get('/flats', validate(flatListRules), societyController.listFlats)
router.post('/flats', validate(createFlatRules), societyController.createFlat)
router.get('/flats/:id', validate(flatIdRules), societyController.getFlat)
router.patch('/flats/:id', validate(updateFlatRules), societyController.updateFlat)
router.delete('/flats/:id', validate(flatIdRules), societyController.deleteFlat)

export default router
