export const generateTicketNumber = () => `CMP-${Date.now().toString(36).toUpperCase()}`

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
