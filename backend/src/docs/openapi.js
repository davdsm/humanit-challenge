/** OpenAPI 3 document for Swagger UI */
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Humanit Clients API',
    version: '1.0.0',
    description:
      'REST API for clients, file-backed documents (multipart upload), and cookie-based session auth.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sid',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          originalName: { type: 'string' },
          mimeType: { type: 'string' },
          sizeBytes: { type: 'integer' },
          description: { type: 'string', nullable: true },
          expirationDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['ACTIVE', 'DELETED'] },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          clientId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          taxIdentifier: { type: 'string' },
          email: { type: 'string' },
          phoneNumber: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'DELETED'] },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          documents: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ClientInput: {
        type: 'object',
        required: ['firstName', 'lastName', 'taxIdentifier', 'email', 'phoneNumber'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          taxIdentifier: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
        },
      },
      DocumentPatchInput: {
        type: 'object',
        properties: {
          expirationDate: { type: 'string', format: 'date-time' },
          description: { type: 'string', nullable: true },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      ClientListResponse: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { '200': { description: 'Logged in' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout',
        responses: { '204': { description: 'Logged out' } },
      },
    },
    '/clients': {
      get: {
        summary: 'List clients',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientListResponse' } } } } },
      },
      post: {
        summary: 'Create client',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/clients/trash': {
      get: {
        summary: 'List trashed clients',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientListResponse' } } } } },
      },
    },
    '/clients/{clientId}/documents': {
      post: {
        summary: 'Upload a document file for a client',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'expirationDate'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  expirationDate: { type: 'string', description: 'ISO date or datetime' },
                  description: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } } },
      },
    },
    '/clients/documents/trash': {
      get: {
        summary: 'List trashed documents',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/clients/{clientId}/documents/{documentId}/download': {
      get: {
        summary: 'Download stored document bytes',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'File stream' } },
      },
    },
    '/clients/{clientId}/documents/{documentId}': {
      patch: {
        summary: 'Update document metadata (no file replacement)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DocumentPatchInput' } } },
        },
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } } },
      },
      delete: {
        summary: 'Soft-delete a document and move file to trash',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '204': { description: 'Deleted' } },
      },
    },
    '/clients/documents/{documentId}/restore': {
      post: {
        summary: 'Restore trashed document to active list',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Restored', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } } },
      },
    },
    '/clients/documents/{documentId}/permanent': {
      delete: {
        summary: 'Permanently delete trashed document and its file',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Permanently deleted' } },
      },
    },
    '/clients/{id}': {
      get: {
        summary: 'Get client',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      put: {
        summary: 'Update client profile (documents managed via /documents routes)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } },
        },
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        summary: 'Delete client',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' } },
      },
    },
    '/clients/{clientId}/restore': {
      post: {
        summary: 'Restore trashed client (and its documents)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Restored', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } } },
      },
    },
    '/clients/{clientId}/permanent': {
      delete: {
        summary: 'Permanently delete trashed client and files',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Permanently deleted' } },
      },
    },
  },
};
