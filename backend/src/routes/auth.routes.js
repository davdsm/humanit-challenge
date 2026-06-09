const { Router } = require('express');
const { postLogin, postLogout } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/login', loginRateLimiter, postLogin);
router.post('/logout', postLogout);

module.exports = router;
