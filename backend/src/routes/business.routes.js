const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const appointmentStaffController = require('../controllers/appointmentStaff.controller');
const appointmentServiceController = require('../controllers/appointmentService.controller');
const appointmentController = require('../controllers/appointment.controller');
const appointmentCustomerController = require('../controllers/appointmentCustomer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../middleware/validation.middleware');

// Sadece DefneRandevu projesinden erişim
const requireRandevuProject = (req, res, next) => {
  if (req.project !== 'defnerandevu') {
    return res.status(403).json({
      success: false,
      message: 'Bu API sadece DefneRandevu üzerinden erişilebilir'
    });
  }
  next();
};

// Public - slug ile işletme (randevu alma sayfası)
router.get('/slug/:slug', requireRandevuProject, businessController.getBusinessBySlug);

// Protected
router.use(authenticate);
router.use(requireRandevuProject);

router.get('/my', businessController.getMyBusinesses);
router.post('/', businessController.createBusiness);

// İşletme bazlı (id ile)
router.get('/:id', uuidParamValidation('id'), businessController.getBusinessById);
router.put('/:id', uuidParamValidation('id'), businessController.updateBusiness);
router.delete('/:id', uuidParamValidation('id'), businessController.deleteBusiness);

// Personel
router.get('/:id/staff', uuidParamValidation('id'), appointmentStaffController.getStaff);
router.post('/:id/staff', uuidParamValidation('id'), appointmentStaffController.createStaff);
router.put('/:id/staff/:staffId', uuidParamValidation('id'), uuidParamValidation('staffId'), appointmentStaffController.updateStaff);
router.delete('/:id/staff/:staffId', uuidParamValidation('id'), uuidParamValidation('staffId'), appointmentStaffController.deleteStaff);

// Hizmetler
router.get('/:id/services', uuidParamValidation('id'), appointmentServiceController.getServices);
router.post('/:id/services', uuidParamValidation('id'), appointmentServiceController.createService);
router.put('/:id/services/:serviceId', uuidParamValidation('id'), uuidParamValidation('serviceId'), appointmentServiceController.updateService);
router.delete('/:id/services/:serviceId', uuidParamValidation('id'), uuidParamValidation('serviceId'), appointmentServiceController.deleteService);

// Müşteriler
router.get('/:id/customers', uuidParamValidation('id'), appointmentCustomerController.getCustomers);
router.post('/:id/customers', uuidParamValidation('id'), appointmentCustomerController.createCustomer);

// Randevular
router.get('/:id/appointments', uuidParamValidation('id'), appointmentController.getAppointments);
router.post('/:id/appointments', uuidParamValidation('id'), appointmentController.createAppointment);
router.put('/:id/appointments/:appointmentId', uuidParamValidation('id'), uuidParamValidation('appointmentId'), appointmentController.updateAppointment);
router.delete('/:id/appointments/:appointmentId', uuidParamValidation('id'), uuidParamValidation('appointmentId'), appointmentController.deleteAppointment);

module.exports = router;
