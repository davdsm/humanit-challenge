const {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
  listTrashedClients,
  restoreClient,
  permanentlyDeleteClient,
} = require('../services/client.service');
const { createClientSchema, updateClientSchema } = require('../validators/client.schemas');
const { HttpError } = require('../middleware/error');

function serializeDocument(d) {
  return {
    id: d.id,
    originalName: d.originalName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    description: d.description,
    expirationDate: d.expirationDate.toISOString(),
    status: d.status,
    deletedAt: d.deletedAt ? d.deletedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function serializeClient(client) {
  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    taxIdentifier: client.taxIdentifier,
    email: client.email,
    phoneNumber: client.phoneNumber,
    status: client.status,
    deletedAt: client.deletedAt ? client.deletedAt.toISOString() : null,
    documents: (client.documents || []).map(serializeDocument),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

async function postClient(req, res, next) {
  try {
    const parsed = createClientSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', { code: 'VALIDATION_ERROR', expose: true });
    }
    const client = await createClient(parsed.data);
    res.status(201).json(serializeClient(client));
  } catch (e) {
    next(e);
  }
}

async function getClients(req, res, next) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await listClients({ page, limit });
    res.json({
      ...result,
      items: result.items.map(serializeClient),
    });
  } catch (e) {
    next(e);
  }
}

async function getClient(req, res, next) {
  try {
    const client = await getClientById(req.params.id);
    res.json(serializeClient(client));
  } catch (e) {
    next(e);
  }
}

async function putClient(req, res, next) {
  try {
    const parsed = updateClientSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', { code: 'VALIDATION_ERROR', expose: true });
    }
    const client = await updateClient(req.params.id, parsed.data);
    res.json(serializeClient(client));
  } catch (e) {
    next(e);
  }
}

async function deleteClientHandler(req, res, next) {
  try {
    await deleteClient(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

async function getTrashedClients(req, res, next) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await listTrashedClients({ page, limit });
    res.json({
      ...result,
      items: result.items.map(serializeClient),
    });
  } catch (e) {
    next(e);
  }
}

async function restoreClientHandler(req, res, next) {
  try {
    const client = await restoreClient(req.params.clientId);
    res.json(serializeClient(client));
  } catch (e) {
    next(e);
  }
}

async function permanentlyDeleteClientHandler(req, res, next) {
  try {
    await permanentlyDeleteClient(req.params.clientId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  postClient,
  getClients,
  getClient,
  putClient,
  deleteClientHandler,
  getTrashedClients,
  restoreClientHandler,
  permanentlyDeleteClientHandler,
};
