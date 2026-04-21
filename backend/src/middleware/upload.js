const multer = require('multer');
const config = require('../config');

const storage = multer.memoryStorage();

const uploadSingleDocument = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
}).single('file');

module.exports = {
  uploadSingleDocument,
};
