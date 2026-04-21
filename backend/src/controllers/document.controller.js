const multer = require('multer');
const { z } = require('zod');
const config = require('../config');
const documentService = require('../services/document.service');
const { HttpError } = require('../middleware/error');

function documentValidity(expirationDate) {
  const expUtc = Date.UTC(
    expirationDate.getUTCFullYear(),
    expirationDate.getUTCMonth(),
    expirationDate.getUTCDate(),
  );
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysToExpire = Math.floor((expUtc - todayUtc) / 86400000);
  if (daysToExpire < 0) return { validityStatus: 'EXPIRED', isExpired: true, daysToExpire };
  if (daysToExpire <= 30) return { validityStatus: 'EXPIRING_SOON', isExpired: false, daysToExpire };
  return { validityStatus: 'VALID', isExpired: false, daysToExpire };
}

const uploadFieldsSchema = z.object({
  expirationDate: z.coerce.date(),
  description: z.string().max(2000).nullable().optional(),
});

const patchDocumentSchema = z.object({
  expirationDate: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  description: z.string().max(2000).optional().nullable(),
});

function serializeDocument(doc) {
  const validity = documentValidity(doc.expirationDate);
  return {
    id: doc.id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    description: doc.description,
    expirationDate: doc.expirationDate.toISOString(),
    status: doc.status,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    validityStatus: validity.validityStatus,
    isExpired: validity.isExpired,
    daysToExpire: validity.daysToExpire,
    clientId: doc.clientId,
    client: doc.client
      ? {
          id: doc.client.id,
          firstName: doc.client.firstName,
          lastName: doc.client.lastName,
          email: doc.client.email,
        }
      : undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function postUpload(req, res, next) {
  try {
    if (!req.file) {
      throw new HttpError(400, 'Missing file field "file"', { code: 'VALIDATION_ERROR', expose: true });
    }
    const parsed = uploadFieldsSchema.safeParse({
      expirationDate: req.body.expirationDate,
      description: req.body.description === '' ? null : req.body.description,
    });
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid form fields', { code: 'VALIDATION_ERROR', expose: true });
    }

    const doc = await documentService.createDocumentFromUpload({
      clientId: req.params.clientId,
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      description: parsed.data.description,
      expirationDate: parsed.data.expirationDate,
    });
    res.status(201).json(serializeDocument(doc));
  } catch (e) {
    if (e instanceof multer.MulterError) {
      if (e.code === 'LIMIT_FILE_SIZE') {
        const maxMb = Math.max(1, Math.round(config.maxUploadBytes / (1024 * 1024)));
        next(
          new HttpError(413, `File too large. Maximum allowed size is ${maxMb} MB.`, {
            code: 'PAYLOAD_TOO_LARGE',
          }),
        );
        return;
      }
    }
    next(e);
  }
}

async function getDownload(req, res, next) {
  try {
    const doc = await documentService.findDocumentOr404(req.params.clientId, req.params.documentId);
    documentService.sendDocumentFile(doc, res, next);
  } catch (e) {
    next(e);
  }
}

async function patch(req, res, next) {
  try {
    const body = patchDocumentSchema.parse(req.body);
    const doc = await documentService.updateDocumentMeta(req.params.clientId, req.params.documentId, body);
    res.json(serializeDocument(doc));
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new HttpError(400, 'Invalid request body', { code: 'VALIDATION_ERROR', expose: true }));
      return;
    }
    next(e);
  }
}

async function deleteDoc(req, res, next) {
  try {
    await documentService.deleteDocument(req.params.clientId, req.params.documentId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

async function listTrashed(req, res, next) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await documentService.listTrashedDocuments({ page, limit });
    res.json({
      ...result,
      items: result.items.map(serializeDocument),
    });
  } catch (e) {
    next(e);
  }
}

async function restore(req, res, next) {
  try {
    const doc = await documentService.restoreDocument(req.params.documentId);
    res.json(serializeDocument(doc));
  } catch (e) {
    next(e);
  }
}

async function permanentlyDelete(req, res, next) {
  try {
    await documentService.permanentlyDeleteDocument(req.params.documentId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  postUpload,
  getDownload,
  patch,
  deleteDoc,
  listTrashed,
  restore,
  permanentlyDelete,
  serializeDocument,
};
