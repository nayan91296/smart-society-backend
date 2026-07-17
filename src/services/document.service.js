import documentRepository from '../repositories/document.repository.js'
import wingRepository from '../repositories/wing.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import memberRepository from '../repositories/member.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import documentStorage from './storage.service.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { sanitizeDocument } from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  DOCUMENT_VISIBILITY,
  HTTP_STATUS,
  MESSAGES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MEMBER_DOWNLOAD_BASE = '/member/documents'
const ADMIN_DOWNLOAD_BASE = '/society/documents'

class DocumentService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.category) filter.category = new RegExp(escapeRegex(query.category), 'i')
    if (query.visibility) filter.visibility = query.visibility
    if (query.wingId) filter.wing = query.wingId
    if (query.flatId) filter.flat = query.flatId

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ title: regex }, { description: regex }, { fileName: regex }, { category: regex }]
    }

    const result = await documentRepository.search({ societyId, filter, page, limit })

    return {
      documents: result.data.map((d) =>
        sanitizeDocument(d, { downloadBase: ADMIN_DOWNLOAD_BASE }),
      ),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const document = await documentRepository.findInSociety(id, societyId)
    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found')
    }
    return sanitizeDocument(document, { downloadBase: ADMIN_DOWNLOAD_BASE })
  }

  async #validateUploadedForMember(societyId, memberId) {
    if (!memberId) return null
    const member = await memberRepository.findInSociety(memberId, societyId)
    if (!member) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'uploadedForMemberId not found in this society')
    }
    return member._id
  }

  async #validateVisibility(societyId, visibility, payload) {
    if (visibility === DOCUMENT_VISIBILITY.WING) {
      if (!payload.wingId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'wingId is required for WING visibility')
      }
      const wing = await wingRepository.findInSociety(payload.wingId, societyId)
      if (!wing) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found in this society')
    }

    if (visibility === DOCUMENT_VISIBILITY.FLAT) {
      if (!payload.flatId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'flatId is required for FLAT visibility')
      }
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    if (payload.wingId && visibility !== DOCUMENT_VISIBILITY.WING) {
      const wing = await wingRepository.findInSociety(payload.wingId, societyId)
      if (!wing) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found in this society')
    }

    if (payload.flatId && visibility !== DOCUMENT_VISIBILITY.FLAT) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }
  }

  async create(societyId, payload, file, actor, meta = {}) {
    if (!file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'File is required')
    }

    const visibility = payload.visibility || DOCUMENT_VISIBILITY.SOCIETY
    await this.#validateVisibility(societyId, visibility, payload)
    const uploadedForMember = await this.#validateUploadedForMember(
      societyId,
      payload.uploadedForMemberId,
    )

    const storageKey = documentStorage.buildStorageKey(file.filename)
    const fileUrl = documentStorage.buildPublicUrl(storageKey)

    const document = await documentRepository.create({
      society: societyId,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      fileName: file.originalname || file.filename,
      fileUrl,
      storageKey,
      mimeType: file.mimetype,
      size: file.size,
      visibility,
      wing: visibility === DOCUMENT_VISIBILITY.WING ? payload.wingId : payload.wingId || null,
      flat: visibility === DOCUMENT_VISIBILITY.FLAT ? payload.flatId : payload.flatId || null,
      uploadedBy: actor.id,
      uploadedForMember,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Document',
      entityId: document._id,
      description: `Document "${document.title}" uploaded`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, document._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const document = await documentRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found')
    }

    const visibility = payload.visibility || document.visibility
    if (payload.visibility || payload.wingId || payload.flatId) {
      await this.#validateVisibility(societyId, visibility, {
        wingId: payload.wingId ?? document.wing?.toString?.(),
        flatId: payload.flatId ?? document.flat?.toString?.(),
      })
      document.visibility = visibility
      document.wing =
        visibility === DOCUMENT_VISIBILITY.WING
          ? payload.wingId || document.wing
          : payload.wingId !== undefined
            ? payload.wingId || null
            : document.wing
      document.flat =
        visibility === DOCUMENT_VISIBILITY.FLAT
          ? payload.flatId || document.flat
          : payload.flatId !== undefined
            ? payload.flatId || null
            : document.flat
    }

    ;['title', 'description', 'category'].forEach((field) => {
      if (payload[field] !== undefined) document[field] = payload[field]
    })

    if (payload.uploadedForMemberId !== undefined) {
      document.uploadedForMember = await this.#validateUploadedForMember(
        societyId,
        payload.uploadedForMemberId,
      )
    }

    await document.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Document',
      entityId: document._id,
      description: `Document "${document.title}" updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const document = await documentRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found')
    }

    document.isDeleted = true
    document.deletedAt = new Date()
    await document.save()

    if (document.storageKey) {
      await documentStorage.delete(document.storageKey)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Document',
      entityId: document._id,
      description: `Document "${document.title}" deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async getDownloadStream(societyId, id) {
    const document = await documentRepository.findInSociety(id, societyId)
    if (!document || !document.storageKey) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found')
    }

    const absolutePath = documentStorage.resolveAbsolutePath(document.storageKey)
    return {
      absolutePath,
      fileName: document.fileName || 'document',
      mimeType: document.mimeType || 'application/octet-stream',
    }
  }

  #memberVisibilityFilter(member, flat) {
    const wingId = flat?.wing?._id || flat?.wing

    return {
      visibility: { $ne: DOCUMENT_VISIBILITY.PRIVATE },
      $or: [
        { visibility: DOCUMENT_VISIBILITY.SOCIETY },
        { visibility: DOCUMENT_VISIBILITY.WING, wing: wingId },
        { visibility: DOCUMENT_VISIBILITY.FLAT, flat: member.flat },
      ],
    }
  }

  async listForMember(member, query = {}) {
    const flat = await flatRepository.findInSociety(member.flat, member.society)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member flat not found')
    }

    const { page, limit } = getPagination(query.page, query.limit)
    const filter = this.#memberVisibilityFilter(member, flat)

    if (query.category) filter.category = new RegExp(escapeRegex(query.category), 'i')
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$and = [
        { $or: filter.$or },
        { $or: [{ title: regex }, { description: regex }, { fileName: regex }, { category: regex }] },
      ]
      delete filter.$or
    }

    const result = await documentRepository.search({
      societyId: member.society,
      filter,
      page,
      limit,
    })

    return {
      documents: result.data.map((d) =>
        sanitizeDocument(d, { downloadBase: MEMBER_DOWNLOAD_BASE }),
      ),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getForMember(member, id) {
    const flat = await flatRepository.findInSociety(member.flat, member.society)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member flat not found')
    }

    const document = await documentRepository.model
      .findOne({
        _id: id,
        society: member.society,
        isDeleted: false,
        ...this.#memberVisibilityFilter(member, flat),
      })
      .populate('wing', 'name code')
      .populate({
        path: 'flat',
        select: 'flatNumber wing floor',
        populate: [
          { path: 'wing', select: 'name code' },
          { path: 'floor', select: 'floorNumber name' },
        ],
      })
      .populate('uploadedBy', 'firstName lastName email')

    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found')
    }

    return sanitizeDocument(document, { downloadBase: MEMBER_DOWNLOAD_BASE })
  }

  async getDownloadStreamForMember(member, id) {
    await this.getForMember(member, id)
    return this.getDownloadStream(member.society, id)
  }
}

export default new DocumentService()
