const { ClientStatus, DocumentStatus } = require('@prisma/client');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../middleware/error');
const {
  unlinkAllFilesForClient,
  softDeleteActiveDocumentsForClient,
  finalizeTrashMoves,
  restoreAllDocumentsForClient,
} = require('./document.service');

function normalizeClientInput(body) {
  return {
    firstName: String(body.firstName ?? '').trim(),
    lastName: String(body.lastName ?? '').trim(),
    taxIdentifier: String(body.taxIdentifier ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    phoneNumber: String(body.phoneNumber ?? '').trim(),
  };
}

async function createClient(payload) {
  const data = normalizeClientInput(payload);

  try {
    return await prisma.client.create({
      data,
      include: { documents: { where: { status: DocumentStatus.ACTIVE } } },
    });
  } catch (e) {
    if (e.code === 'P2002') {
      throw new HttpError(409, 'Unique constraint violation', { code: 'CONFLICT' });
    }
    throw e;
  }
}

async function listClients({ page = 1, limit = 20 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await prisma.$transaction([
    prisma.client.findMany({
      where: { status: ClientStatus.ACTIVE },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { documents: { where: { status: DocumentStatus.ACTIVE } } },
    }),
    prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
  ]);

  return { items, page: Number(page) || 1, limit: take, total };
}

async function getClientById(id) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: { documents: { where: { status: DocumentStatus.ACTIVE } } },
  });
  if (!client || client.status === ClientStatus.DELETED) {
    throw new HttpError(404, 'Client not found', { code: 'NOT_FOUND' });
  }
  return client;
}

async function updateClient(id, payload) {
  const data = normalizeClientInput(payload);

  try {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing || existing.status === ClientStatus.DELETED) {
      throw new HttpError(404, 'Client not found', { code: 'NOT_FOUND' });
    }

    return await prisma.client.update({
      where: { id },
      data,
      include: { documents: { where: { status: DocumentStatus.ACTIVE } } },
    });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e.code === 'P2002') {
      throw new HttpError(409, 'Unique constraint violation', { code: 'CONFLICT' });
    }
    throw e;
  }
}

async function deleteClient(id) {
  let pendingMoves = [];

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.client.findUnique({ where: { id } });
      if (!existing || existing.status === ClientStatus.DELETED) {
        throw new HttpError(404, 'Client not found', { code: 'NOT_FOUND' });
      }

      pendingMoves = await softDeleteActiveDocumentsForClient(id, existing, { tx });

      await tx.client.update({
        where: { id },
        data: {
          status: ClientStatus.DELETED,
          deletedAt: new Date(),
        },
      });
    });

    await finalizeTrashMoves(pendingMoves);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e.code === 'P2025') {
      throw new HttpError(404, 'Client not found', { code: 'NOT_FOUND' });
    }
    throw e;
  }
}

async function listTrashedClients({ page = 1, limit = 20 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await prisma.$transaction([
    prisma.client.findMany({
      where: { status: ClientStatus.DELETED },
      skip,
      take,
      orderBy: { deletedAt: 'desc' },
      include: { documents: { where: { status: DocumentStatus.DELETED } } },
    }),
    prisma.client.count({ where: { status: ClientStatus.DELETED } }),
  ]);

  return { items, page: Number(page) || 1, limit: take, total };
}

async function restoreClient(id) {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing || existing.status !== ClientStatus.DELETED) {
    throw new HttpError(404, 'Trashed client not found', { code: 'NOT_FOUND' });
  }

  await prisma.client.update({
    where: { id },
    data: {
      status: ClientStatus.ACTIVE,
      deletedAt: null,
    },
  });

  await restoreAllDocumentsForClient(id);

  return prisma.client.findUniqueOrThrow({
    where: { id },
    include: { documents: { where: { status: DocumentStatus.ACTIVE } } },
  });
}

async function permanentlyDeleteClient(id) {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing || existing.status !== ClientStatus.DELETED) {
    throw new HttpError(404, 'Trashed client not found', { code: 'NOT_FOUND' });
  }

  await unlinkAllFilesForClient(id);
  await prisma.client.delete({ where: { id } });
  return { ok: true };
}

module.exports = {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
  listTrashedClients,
  restoreClient,
  permanentlyDeleteClient,
};
