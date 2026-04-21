const { Router } = require('express');
const { postLogin, postLogout } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', postLogin);
router.post('/logout', postLogout);

module.exports = router;
