const express = require('express');
const router = express.Router();
const { submitContact, getContacts, markTreated, deleteContact, exportCSV } = require('../controllers/contactsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

router.post('/', rateLimit(5, 15 * 60 * 1000), submitContact);
router.get('/', authMiddleware, adminMiddleware, getContacts);
router.patch('/:id/treated', authMiddleware, adminMiddleware, markTreated);
router.delete('/:id', authMiddleware, adminMiddleware, deleteContact);
router.get('/export/csv', authMiddleware, adminMiddleware, exportCSV);

module.exports = router;
