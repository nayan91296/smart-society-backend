export const generateTicketNumber = () => `CMP-${Date.now().toString(36).toUpperCase()}`

export const generateWorkOrderNumber = () =>
  `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export const generateInvoiceNumber = () =>
  `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export const generatePaymentNumber = () =>
  `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const sanitizeNestedFlat = (flat) => {
  if (!flat || typeof flat !== 'object' || !(flat.flatNumber || flat._id)) return flat
  return {
    id: flat._id?.toString?.() || flat.id,
    flatNumber: flat.flatNumber,
    wing: flat.wing
      ? {
          id: flat.wing._id?.toString?.() || flat.wing.id,
          name: flat.wing.name,
          code: flat.wing.code,
        }
      : flat.wing,
    floor: flat.floor
      ? {
          id: flat.floor._id?.toString?.() || flat.floor.id,
          floorNumber: flat.floor.floorNumber,
          name: flat.floor.name,
        }
      : flat.floor,
  }
}

const sanitizeNestedMember = (member) => {
  if (!member || typeof member !== 'object' || !(member.firstName || member._id)) return member
  return {
    id: member._id?.toString?.() || member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    email: member.email,
  }
}

const sanitizeNestedUser = (user) => {
  if (!user || typeof user !== 'object' || !(user.firstName || user.email || user._id)) return user
  return {
    id: user._id?.toString?.() || user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  }
}

export const sanitizeVisitor = (visitor) => {
  const doc = visitor.toJSON ? visitor.toJSON() : visitor

  let flat = doc.flat
  if (flat && typeof flat === 'object' && (flat.flatNumber || flat._id)) {
    flat = {
      id: flat._id?.toString?.() || flat.id,
      flatNumber: flat.flatNumber,
      wing: flat.wing
        ? {
            id: flat.wing._id?.toString?.() || flat.wing.id,
            name: flat.wing.name,
            code: flat.wing.code,
          }
        : flat.wing,
    }
  }

  let hostMember = doc.hostMember
  if (hostMember && typeof hostMember === 'object' && (hostMember.firstName || hostMember._id)) {
    hostMember = {
      id: hostMember._id?.toString?.() || hostMember.id,
      firstName: hostMember.firstName,
      lastName: hostMember.lastName,
      phone: hostMember.phone,
    }
  }

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat,
    hostMember,
    name: doc.name,
    phone: doc.phone,
    purpose: doc.purpose,
    vehicleNumber: doc.vehicleNumber,
    expectedAt: doc.expectedAt,
    entryAt: doc.entryAt,
    exitAt: doc.exitAt,
    status: doc.status,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeComplaint = (complaint) => {
  const doc = complaint.toJSON ? complaint.toJSON() : complaint

  let flat = doc.flat
  if (flat && typeof flat === 'object' && (flat.flatNumber || flat._id)) {
    flat = {
      id: flat._id?.toString?.() || flat.id,
      flatNumber: flat.flatNumber,
      wing: flat.wing
        ? {
            id: flat.wing._id?.toString?.() || flat.wing.id,
            name: flat.wing.name,
            code: flat.wing.code,
          }
        : flat.wing,
    }
  }

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat,
    ticketNumber: doc.ticketNumber,
    category: doc.category,
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    status: doc.status,
    resolutionNotes: doc.resolutionNotes,
    resolvedAt: doc.resolvedAt,
    closedAt: doc.closedAt,
    raisedByMember: doc.raisedByMember,
    raisedByUser: doc.raisedByUser,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeMaintenance = (item) => {
  const doc = item.toJSON ? item.toJSON() : item
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat: sanitizeNestedFlat(doc.flat),
    workOrderNumber: doc.workOrderNumber,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    priority: doc.priority,
    status: doc.status,
    scheduledAt: doc.scheduledAt,
    completedAt: doc.completedAt,
    estimatedCost: doc.estimatedCost,
    actualCost: doc.actualCost,
    assignedStaff: doc.assignedStaff,
    raisedBy: sanitizeNestedUser(doc.raisedBy),
    relatedComplaint: doc.relatedComplaint,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeInvoice = (invoice) => {
  const doc = invoice.toJSON ? invoice.toJSON() : invoice
  const totalAmount = doc.totalAmount || 0
  const amountPaid = doc.amountPaid || 0
  const balanceDue =
    doc.balanceDue !== undefined ? doc.balanceDue : Math.max(0, totalAmount - amountPaid)

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat: sanitizeNestedFlat(doc.flat),
    member: sanitizeNestedMember(doc.member),
    invoiceNumber: doc.invoiceNumber,
    type: doc.type,
    items: doc.items || [],
    subtotal: doc.subtotal,
    taxAmount: doc.taxAmount,
    totalAmount,
    amountPaid,
    balanceDue,
    currency: doc.currency,
    periodStart: doc.periodStart,
    periodEnd: doc.periodEnd,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    status: doc.status,
    notes: doc.notes,
    createdBy: sanitizeNestedUser(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizePayment = (payment) => {
  const doc = payment.toJSON ? payment.toJSON() : payment
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    invoice: doc.invoice,
    flat: sanitizeNestedFlat(doc.flat),
    member: sanitizeNestedMember(doc.member),
    paymentNumber: doc.paymentNumber,
    amount: doc.amount,
    method: doc.method,
    transactionId: doc.transactionId,
    status: doc.status,
    paidAt: doc.paidAt,
    notes: doc.notes,
    recordedBy: sanitizeNestedUser(doc.recordedBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeNotice = (notice) => {
  const doc = notice.toJSON ? notice.toJSON() : notice
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    title: doc.title,
    content: doc.content,
    priority: doc.priority,
    status: doc.status,
    audience: doc.audience,
    wing: doc.wing,
    floor: doc.floor,
    flat: sanitizeNestedFlat(doc.flat),
    publishAt: doc.publishAt,
    expiresAt: doc.expiresAt,
    isPinned: doc.isPinned,
    createdBy: sanitizeNestedUser(doc.createdBy),
    event: doc.event,
    documents: doc.documents,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeEvent = (event) => {
  const doc = event.toJSON ? event.toJSON() : event
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    startAt: doc.startAt,
    endAt: doc.endAt,
    status: doc.status,
    maxAttendees: doc.maxAttendees,
    attendees: doc.attendees || [],
    attendeeCount: Array.isArray(doc.attendees) ? doc.attendees.length : 0,
    coverImageUrl: doc.coverImageUrl,
    createdBy: sanitizeNestedUser(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeDocument = (document, { downloadBase = '/society/documents' } = {}) => {
  const doc = document.toJSON ? document.toJSON() : document
  const id = doc._id?.toString?.() || doc.id
  return {
    id,
    society: doc.society,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    downloadUrl: `${downloadBase}/${id}/download`,
    storageKey: doc.storageKey,
    mimeType: doc.mimeType,
    size: doc.size,
    visibility: doc.visibility,
    wing: doc.wing,
    flat: sanitizeNestedFlat(doc.flat),
    uploadedBy: sanitizeNestedUser(doc.uploadedBy),
    uploadedForMember: sanitizeNestedMember(doc.uploadedForMember),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeParking = (parking) => {
  const doc = parking.toJSON ? parking.toJSON() : parking

  let assignedVehicle = doc.assignedVehicle
  if (assignedVehicle && typeof assignedVehicle === 'object' && (assignedVehicle.vehicleNumber || assignedVehicle._id)) {
    assignedVehicle = {
      id: assignedVehicle._id?.toString?.() || assignedVehicle.id,
      vehicleNumber: assignedVehicle.vehicleNumber,
      type: assignedVehicle.type,
      make: assignedVehicle.make,
      model: assignedVehicle.model,
      color: assignedVehicle.color,
    }
  }

  let wing = doc.wing
  if (wing && typeof wing === 'object' && (wing.name || wing._id)) {
    wing = {
      id: wing._id?.toString?.() || wing.id,
      name: wing.name,
      code: wing.code,
    }
  }

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    slotNumber: doc.slotNumber,
    wing,
    type: doc.type,
    status: doc.status,
    assignedFlat: sanitizeNestedFlat(doc.assignedFlat),
    assignedVehicle,
    notes: doc.notes,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeVehicle = (vehicle) => {
  const doc = vehicle.toJSON ? vehicle.toJSON() : vehicle

  let parking = doc.parking
  if (parking && typeof parking === 'object' && (parking.slotNumber || parking._id)) {
    parking = {
      id: parking._id?.toString?.() || parking.id,
      slotNumber: parking.slotNumber,
      type: parking.type,
      status: parking.status,
    }
  }

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat: sanitizeNestedFlat(doc.flat),
    member: sanitizeNestedMember(doc.member),
    parking,
    vehicleNumber: doc.vehicleNumber,
    type: doc.type,
    make: doc.make,
    model: doc.model,
    color: doc.color,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const sanitizeNotification = (notification) => {
  const doc = notification.toJSON ? notification.toJSON() : notification
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    user: doc.user,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    data: doc.data || {},
    entityType: doc.entityType,
    entityId: doc.entityId,
    channels: doc.channels || [],
    deliveries: doc.deliveries || [],
    isRead: doc.isRead,
    readAt: doc.readAt,
    createdBy: sanitizeNestedUser(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
