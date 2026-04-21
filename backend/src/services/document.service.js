const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../middleware/error');
const config = require('../config');

const ALLOWED_EXT = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.docx']);

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function extractExtFromStorageKey(storageKey) {
  const ext = path.extname(storageKey || '').toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : '.bin';
}

function formatDateFolder(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sanitizeClientFolderName(client) {
  const fullName = `${client?.firstName || ''} ${client?.lastName || ''}`.trim();
  const base = (fullName || client?.id || 'unknown-client').toLowerCase();
  return base
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'unknown-client';
}

function uploadStorageKey(client, documentId, ext, date = new Date()) {
  return path.join(sanitizeClientFolderName(client), formatDateFolder(date), `${documentId}${ext}`).replace(/\\/g, '/');
}

function trashStorageKey(client, documentId, ext, date = new Date()) {
  return path
    .join(sanitizeClientFolderName(client), formatDateFolder(date), `${documentId}-${Date.now()}${ext}`)
    .replace(/\\/g, '/');
}

async function removeEmptyParentDirs(rootDir, filePath) {
  const root = path.resolve(rootDir);
  let current = path.resolve(path.dirname(filePath));

  while (current.startsWith(root) && current !== root) {
    try {
      await fsp.rmdir(current);
      current = path.dirname(current);
    } catch (e) {
      if (e.code === 'ENOENT') {
        current = path.dirname(current);
        continue;
      }
      if (e.code === 'ENOTEMPTY' || e.code === 'EEXIST') {
        break;
      }
      throw e;
    }
  }
}

function sanitizeOriginalName(name) {
  if (!name || typeof name !== 'string') return 'upload.bin';
  const base = path.basename(name).replace(/[\x00-\x1f\x7f]/g, '');
  return base.slice(0, 200) || 'upload.bin';
}

function isMimeConsistentWithExt(mimetype, ext) {
  if (ALLOWED_MIMES.has(mimetype)) return true;
  if (mimetype === 'application/octet-stream') return ALLOWED_EXT.has(ext);
  return false;
}

async function assertClientExists(clientId) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new HttpError(404, 'Client not found', { code: 'NOT_FOUND' });
  }
  if (client.status === 'DELETED') {
    throw new HttpError(409, 'Client is in trash', { code: 'CLIENT_IN_TRASH' });
  }
  return client;
}

async function createDocumentFromUpload({
  clientId,
  buffer,
  originalName,
  mimeType,
  description,
  expirationDate,
}) {
  const client = await assertClientExists(clientId);

  if (!buffer || !buffer.length) {
    throw new HttpError(400, 'Empty file', { code: 'VALIDATION_ERROR' });
  }

  const safeName = sanitizeOriginalName(originalName);
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new HttpError(400, 'File extension not allowed', { code: 'VALIDATION_ERROR' });
  }
  if (!isMimeConsistentWithExt(mimeType, ext)) {
    throw new HttpError(400, 'Unsupported or inconsistent file type', { code: 'VALIDATION_ERROR' });
  }

  const exp = new Date(expirationDate);
  if (Number.isNaN(exp.getTime())) {
    throw new HttpError(400, 'Invalid expirationDate', { code: 'VALIDATION_ERROR' });
  }

  const id = crypto.randomUUID();
  const relativeKey = uploadStorageKey(client, id, ext, new Date());
  const absDir = path.dirname(path.join(config.uploadDir, relativeKey));
  const absPath = path.join(config.uploadDir, relativeKey);

  const desc =
    description === undefined || description === null || description === ''
      ? null
      : String(description).trim().slice(0, 2000) || null;

  await fsp.mkdir(absDir, { recursive: true });

  const doc = await prisma.document.create({
    data: {
      originalName: safeName,
      storageKey: relativeKey,
      mimeType,
      sizeBytes: buffer.length,
      description: desc,
      expirationDate: exp,
      status: 'ACTIVE',
      clientId,
    },
  });

  try {
    await fsp.writeFile(absPath, buffer, { mode: 0o600 });
  } catch (e) {
    await prisma.document.delete({ where: { id: doc.id } }).catch(() => {});
    throw e;
  }

  return doc;
}

async function findDocumentOr404(clientId, documentId) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, clientId, status: 'ACTIVE' },
  });
  if (!doc) {
    throw new HttpError(404, 'Document not found', { code: 'NOT_FOUND' });
  }
  return doc;
}

async function findTrashedDocumentOr404(documentId) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, status: 'DELETED' },
  });
  if (!doc) {
    throw new HttpError(404, 'Trashed document not found', { code: 'NOT_FOUND' });
  }
  return doc;
}

async function updateDocumentMeta(clientId, documentId, { expirationDate, description }) {
  await findDocumentOr404(clientId, documentId);

  const data = {};
  if (expirationDate !== undefined) {
    const d = new Date(expirationDate);
    if (Number.isNaN(d.getTime())) {
      throw new HttpError(400, 'Invalid expirationDate', { code: 'VALIDATION_ERROR' });
    }
    data.expirationDate = d;
  }
  if (description !== undefined) {
    data.description =
      description === null || description === '' ? null : String(description).trim().slice(0, 2000) || null;
  }

  if (!Object.keys(data).length) {
    return prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  }

  return prisma.document.update({
    where: { id: documentId },
    data,
  });
}

async function deleteDocument(clientId, documentId) {
  const doc = await findDocumentOr404(clientId, documentId);
  const client = await assertClientExists(clientId);
  const sourcePath = path.join(config.uploadDir, doc.storageKey);
  const ext = extractExtFromStorageKey(doc.storageKey);
  const trashRelativeKey = trashStorageKey(client, doc.id, ext, new Date());
  const targetPath = path.join(config.trashDir, trashRelativeKey);

  await fsp.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fsp.rename(sourcePath, targetPath);
    await removeEmptyParentDirs(config.uploadDir, sourcePath);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
      storageKey: trashRelativeKey,
    },
  });

  return { ok: true };
}

async function restoreDocument(documentId) {
  const doc = await findTrashedDocumentOr404(documentId);
  const client = await assertClientExists(doc.clientId);

  const ext = extractExtFromStorageKey(doc.storageKey);
  const nextStorageKey = uploadStorageKey(client, doc.id, ext, new Date());
  const sourcePath = path.join(config.trashDir, doc.storageKey);
  const targetPath = path.join(config.uploadDir, nextStorageKey);

  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await fsp.rename(sourcePath, targetPath);
    await removeEmptyParentDirs(config.trashDir, sourcePath);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }

  return prisma.document.update({
    where: { id: doc.id },
    data: {
      status: 'ACTIVE',
      deletedAt: null,
      storageKey: nextStorageKey,
    },
  });
}

async function permanentlyDeleteDocument(documentId) {
  const doc = await findTrashedDocumentOr404(documentId);
  const filePath = path.join(config.trashDir, doc.storageKey);
  await fsp.unlink(filePath).catch(() => {});
  await removeEmptyParentDirs(config.trashDir, filePath);
  await prisma.document.delete({ where: { id: doc.id } });
  return { ok: true };
}

async function listTrashedDocuments({ page = 1, limit = 20 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await prisma.$transaction([
    prisma.document.findMany({
      where: { status: 'DELETED' },
      skip,
      take,
      orderBy: { deletedAt: 'desc' },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.document.count({ where: { status: 'DELETED' } }),
  ]);

  return { items, page: Number(page) || 1, limit: take, total };
}

async function softDeleteActiveDocumentsForClient(clientId) {
  const docs = await prisma.document.findMany({
    where: { clientId, status: 'ACTIVE' },
    select: { id: true },
  });
  for (const d of docs) {
    await deleteDocument(clientId, d.id);
  }
}

async function restoreAllDocumentsForClient(clientId) {
  const docs = await prisma.document.findMany({
    where: { clientId, status: 'DELETED' },
    select: { id: true },
  });
  for (const d of docs) {
    await restoreDocument(d.id);
  }
}

function sendDocumentFile(doc, res, next) {
  const absPath = path.join(config.uploadDir, doc.storageKey);
  const stream = fs.createReadStream(absPath);
  stream.on('error', (err) => {
    if (err.code === 'ENOENT') {
      next(new HttpError(404, 'File missing on server', { code: 'NOT_FOUND' }));
      return;
    }
    next(err);
  });

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(doc.sizeBytes));
  const asciiName = doc.originalName.replace(/"/g, "'").replace(/[^\x20-\x7e]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"`);
  stream.pipe(res);
}

async function unlinkAllFilesForClient(clientId) {
  const docs = await prisma.document.findMany({
    where: { clientId },
    select: { storageKey: true, status: true },
  });
  await Promise.all(
    docs.map(async (d) => {
      const baseDir = d.status === 'DELETED' ? config.trashDir : config.uploadDir;
      const filePath = path.join(baseDir, d.storageKey);
      await fsp.unlink(filePath).catch(() => {});
      await removeEmptyParentDirs(baseDir, filePath);
    }),
  );
}

module.exports = {
  createDocumentFromUpload,
  updateDocumentMeta,
  deleteDocument,
  restoreDocument,
  permanentlyDeleteDocument,
  listTrashedDocuments,
  softDeleteActiveDocumentsForClient,
  restoreAllDocumentsForClient,
  findDocumentOr404,
  sendDocumentFile,
  unlinkAllFilesForClient,
};
