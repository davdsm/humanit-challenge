const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadSingleDocument } = require('../middleware/upload');
const {
  postClient,
  getClients,
  getClient,
  putClient,
  deleteClientHandler,
  getTrashedClients,
  restoreClientHandler,
  permanentlyDeleteClientHandler,
} = require('../controllers/client.controller');
const documentController = require('../controllers/document.controller');

const router = Router();

router.use(requireAuth);

router.post('/:clientId/documents', uploadSingleDocument, documentController.postUpload);
router.get('/:clientId/documents/:documentId/download', documentController.getDownload);
router.patch('/:clientId/documents/:documentId', documentController.patch);
router.delete('/:clientId/documents/:documentId', documentController.deleteDoc);
router.get('/documents/trash', documentController.listTrashed);
router.post('/documents/:documentId/restore', documentController.restore);
router.delete('/documents/:documentId/permanent', documentController.permanentlyDelete);

router.post('/', postClient);
router.get('/trash', getTrashedClients);
router.get('/', getClients);
router.post('/:clientId/restore', restoreClientHandler);
router.delete('/:clientId/permanent', permanentlyDeleteClientHandler);
router.get('/:id', getClient);
router.put('/:id', putClient);
router.delete('/:id', deleteClientHandler);

module.exports = router;
