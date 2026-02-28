const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createTicketValidation,
  updateTicketValidation,
  createTicketMessageValidation,
  uuidParamValidation
} = require('../middleware/validation.middleware');

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// GET /api/tickets/my - Kullanıcının kendi talepleri
router.get('/my', ticketController.getMyTickets);

// GET /api/tickets - Tüm talepler (Admin/Staff)
router.get('/', authorize('ADMIN', 'STAFF'), ticketController.getAllTickets);

// GET /api/tickets/:id - Talep detayı
router.get('/:id', uuidParamValidation('id'), ticketController.getTicketById);

// POST /api/tickets - Yeni talep oluştur
router.post('/', createTicketValidation, ticketController.createTicket);

// PUT /api/tickets/:id - Talep güncelle
router.put('/:id', uuidParamValidation('id'), updateTicketValidation, ticketController.updateTicket);

// POST /api/tickets/:id/messages - Mesaj ekle
router.post('/:id/messages', uuidParamValidation('id'), createTicketMessageValidation, ticketController.addMessage);

// DELETE /api/tickets/:id - Talep sil (Admin/Staff)
router.delete('/:id', uuidParamValidation('id'), authorize('ADMIN', 'STAFF'), ticketController.deleteTicket);

module.exports = router;
