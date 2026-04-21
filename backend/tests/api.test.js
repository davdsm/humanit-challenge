const request = require('supertest');
const bcrypt = require('bcryptjs');
const path = require('path');
const fsp = require('fs/promises');
const { createApp } = require('../src/app');
const config = require('../src/config');
const { prisma } = require('../src/lib/prisma');

const app = createApp();

const SEED_EMAIL = 'tester@example.com';
const SEED_PASSWORD = 'test-password';

const minimalPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n',
  'utf8',
);

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { passwordHash },
    create: { email: SEED_EMAIL, passwordHash },
  });
});

async function fileExists(absPath) {
  try {
    await fsp.access(absPath);
    return true;
  } catch {
    return false;
  }
}

describe('API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/openapi.json returns spec', async () => {
    const res = await request(app).get('/api/openapi.json').expect(200);
    expect(res.body.openapi).toBeDefined();
  });

  it('GET /api/docs serves Swagger UI', async () => {
    const res = await request(app).get('/api/docs/').expect(200);
    expect(res.text).toContain('swagger');
  });

  it('POST /api/auth/login sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_EMAIL, password: SEED_PASSWORD })
      .expect(200);
    expect(res.body.user.email).toBe(SEED_EMAIL);
    const cookie = res.headers['set-cookie'];
    expect(cookie).toBeDefined();
    expect(cookie.some((c) => c.startsWith('sid='))).toBe(true);
  });

  it('POST /api/auth/logout clears session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/clients').expect(401);
  });

  it('POST /api/auth/login rejects fake credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@example.com', password: 'wrong-password' })
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login rejects malformed payload', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/clients requires auth', async () => {
    await request(app).get('/api/clients').expect(401);
  });

  it('POST /api/clients creates client without embedded documents', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const payload = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      taxIdentifier: `TAX-${Date.now()}`,
      email: `ada-${Date.now()}@example.com`,
      phoneNumber: '+15550001111',
    };

    const res = await agent.post('/api/clients').send(payload).expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.documents).toEqual([]);
  });

  it('POST /api/clients/:id/documents uploads a file', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Doc',
        lastName: 'Upload',
        taxIdentifier: `TAX-UP-${Date.now()}`,
        email: `doc-up-${Date.now()}@example.com`,
        phoneNumber: '+15550001112',
      })
      .expect(201);

    const exp = new Date('2030-01-15T00:00:00.000Z').toISOString();
    const res = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', exp)
      .field('description', 'License scan')
      .attach('file', minimalPdf, { filename: 'license.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.originalName).toBe('license.pdf');
    expect(res.body.mimeType).toBe('application/pdf');
    expect(res.body.sizeBytes).toBeGreaterThan(0);
  });

  it('POST /api/clients/:id/documents rejects unsupported extension', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Bad',
        lastName: 'Ext',
        taxIdentifier: `TAX-EXT-${Date.now()}`,
        email: `bad-ext-${Date.now()}@example.com`,
        phoneNumber: '+15550007777',
      })
      .expect(201);

    const res = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2030-05-15T00:00:00.000Z').toISOString())
      .attach('file', Buffer.from('hello world', 'utf8'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/clients/:id/documents rejects oversized files', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Big',
        lastName: 'File',
        taxIdentifier: `TAX-BIG-${Date.now()}`,
        email: `big-file-${Date.now()}@example.com`,
        phoneNumber: '+15550008888',
      })
      .expect(201);

    const tooLargePdf = Buffer.alloc(10 * 1024 * 1024 + 1, 0x20);
    const res = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2030-06-01T00:00:00.000Z').toISOString())
      .attach('file', tooLargePdf, { filename: 'oversize.pdf', contentType: 'application/pdf' })
      .expect(413);

    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('POST /api/clients/:id/documents requires file field', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'No',
        lastName: 'File',
        taxIdentifier: `TAX-NOF-${Date.now()}`,
        email: `no-file-${Date.now()}@example.com`,
        phoneNumber: '+15550009999',
      })
      .expect(201);

    const res = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2030-07-01T00:00:00.000Z').toISOString())
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET document download returns bytes', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Dl',
        lastName: 'Test',
        taxIdentifier: `TAX-DL-${Date.now()}`,
        email: `dl-${Date.now()}@example.com`,
        phoneNumber: '+15550001113',
      })
      .expect(201);

    const exp = new Date('2031-02-01T00:00:00.000Z').toISOString();
    const doc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', exp)
      .attach('file', minimalPdf, { filename: 'a.pdf', contentType: 'application/pdf' })
      .expect(201);

    const res = await agent
      .get(`/api/clients/${created.body.id}/documents/${doc.body.id}/download`)
      .buffer(true)
      .expect(200);

    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(10);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('GET /api/clients lists clients', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const tax = `TAX-LIST-${Date.now()}`;
    await agent
      .post('/api/clients')
      .send({
        firstName: 'List',
        lastName: 'Test',
        taxIdentifier: tax,
        email: `list-${Date.now()}@example.com`,
        phoneNumber: '+15550002222',
      })
      .expect(201);

    const res = await agent.get('/api/clients').expect(200);
    expect(res.body.items.some((c) => c.taxIdentifier === tax)).toBe(true);
  });

  it('GET /api/clients/:id returns client', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Get',
        lastName: 'One',
        taxIdentifier: `TAX-GET-${Date.now()}`,
        email: `get-${Date.now()}@example.com`,
        phoneNumber: '+15550003333',
      })
      .expect(201);

    const res = await agent.get(`/api/clients/${created.body.id}`).expect(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('PUT /api/clients/:id updates profile without replacing documents via body', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Put',
        lastName: 'Before',
        taxIdentifier: `TAX-PUT-${Date.now()}`,
        email: `put-${Date.now()}@example.com`,
        phoneNumber: '+15550004444',
      })
      .expect(201);

    await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2028-01-01T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'keep.pdf', contentType: 'application/pdf' })
      .expect(201);

    const newEmail = `put-updated-${Date.now()}@example.com`;
    const res = await agent
      .put(`/api/clients/${created.body.id}`)
      .send({
        firstName: 'Put',
        lastName: 'After',
        taxIdentifier: created.body.taxIdentifier,
        email: newEmail,
        phoneNumber: '+15550005555',
      })
      .expect(200);

    expect(res.body.email).toBe(newEmail);
    expect(res.body.documents).toHaveLength(1);
  });

  it('PATCH /api/clients/:id/documents/:docId updates metadata', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Patch',
        lastName: 'Meta',
        taxIdentifier: `TAX-PATCH-${Date.now()}`,
        email: `patch-${Date.now()}@example.com`,
        phoneNumber: '+15550006660',
      })
      .expect(201);

    const doc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2029-05-05T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'p.pdf', contentType: 'application/pdf' })
      .expect(201);

    const res = await agent
      .patch(`/api/clients/${created.body.id}/documents/${doc.body.id}`)
      .send({
        description: 'Updated note',
        expirationDate: new Date('2032-08-08T00:00:00.000Z').toISOString(),
      })
      .expect(200);

    expect(res.body.description).toBe('Updated note');
  });

  it('PATCH /api/clients/:id/documents/:docId rejects invalid metadata', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Patch',
        lastName: 'Invalid',
        taxIdentifier: `TAX-PINV-${Date.now()}`,
        email: `patch-invalid-${Date.now()}@example.com`,
        phoneNumber: '+15550100000',
      })
      .expect(201);

    const doc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2030-01-01T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'meta.pdf', contentType: 'application/pdf' })
      .expect(201);

    const res = await agent
      .patch(`/api/clients/${created.body.id}/documents/${doc.body.id}`)
      .send({ expirationDate: 'definitely-not-a-date' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('DELETE /api/clients/:id/documents/:docId removes document', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Rm',
        lastName: 'Doc',
        taxIdentifier: `TAX-RMD-${Date.now()}`,
        email: `rmd-${Date.now()}@example.com`,
        phoneNumber: '+15550006661',
      })
      .expect(201);

    const doc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2029-05-05T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'r.pdf', contentType: 'application/pdf' })
      .expect(201);

    const originalStorage = await prisma.document.findUnique({
      where: { id: doc.body.id },
      select: { storageKey: true },
    });
    const originalPath = path.join(config.uploadDir, originalStorage.storageKey);
    expect(await fileExists(originalPath)).toBe(true);

    await agent.delete(`/api/clients/${created.body.id}/documents/${doc.body.id}`).expect(204);

    const deletedDoc = await prisma.document.findUnique({
      where: { id: doc.body.id },
      select: { storageKey: true, status: true, deletedAt: true },
    });
    expect(deletedDoc.status).toBe('DELETED');
    expect(deletedDoc.deletedAt).toBeTruthy();
    expect(await fileExists(originalPath)).toBe(false);
    expect(await fileExists(path.join(config.trashDir, deletedDoc.storageKey))).toBe(true);

    const client = await agent.get(`/api/clients/${created.body.id}`).expect(200);
    expect(client.body.documents).toHaveLength(0);
  });

  it('DELETE /api/clients/:id soft-deletes client and permanent delete purges files', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: SEED_EMAIL, password: SEED_PASSWORD }).expect(200);

    const created = await agent
      .post('/api/clients')
      .send({
        firstName: 'Del',
        lastName: 'Test',
        taxIdentifier: `TAX-DEL-${Date.now()}`,
        email: `del-${Date.now()}@example.com`,
        phoneNumber: '+15550006666',
      })
      .expect(201);

    const activeDoc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2029-06-06T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'active.pdf', contentType: 'application/pdf' })
      .expect(201);

    const softDeletedDoc = await agent
      .post(`/api/clients/${created.body.id}/documents`)
      .field('expirationDate', new Date('2029-07-07T00:00:00.000Z').toISOString())
      .attach('file', minimalPdf, { filename: 'trash-me.pdf', contentType: 'application/pdf' })
      .expect(201);
    await agent.delete(`/api/clients/${created.body.id}/documents/${softDeletedDoc.body.id}`).expect(204);

    const deletedBeforeClientDelete = await prisma.document.findUnique({
      where: { id: softDeletedDoc.body.id },
      select: { storageKey: true, status: true },
    });
    expect(deletedBeforeClientDelete.status).toBe('DELETED');

    const deletedAbsPath = path.join(config.trashDir, deletedBeforeClientDelete.storageKey);
    expect(await fileExists(deletedAbsPath)).toBe(true);

    await agent.delete(`/api/clients/${created.body.id}`).expect(204);
    await agent.get(`/api/clients/${created.body.id}`).expect(404);

    const trashedClientList = await agent.get('/api/clients/trash').expect(200);
    expect(trashedClientList.body.items.some((c) => c.id === created.body.id)).toBe(true);

    const activeAfterSoftDelete = await prisma.document.findUnique({
      where: { id: activeDoc.body.id },
      select: { storageKey: true, status: true },
    });
    const softDeletedAfterSoftDelete = await prisma.document.findUnique({
      where: { id: softDeletedDoc.body.id },
      select: { storageKey: true, status: true },
    });
    expect(activeAfterSoftDelete.status).toBe('DELETED');
    expect(softDeletedAfterSoftDelete.status).toBe('DELETED');

    const activeTrashPath = path.join(config.trashDir, activeAfterSoftDelete.storageKey);
    const deletedTrashPath = path.join(config.trashDir, softDeletedAfterSoftDelete.storageKey);
    expect(await fileExists(activeTrashPath)).toBe(true);
    expect(await fileExists(deletedTrashPath)).toBe(true);

    await agent.delete(`/api/clients/${created.body.id}/permanent`).expect(204);
    expect(await fileExists(activeTrashPath)).toBe(false);
    expect(await fileExists(deletedTrashPath)).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
