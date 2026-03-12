const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const appointmentStaffController = require('../controllers/appointmentStaff.controller');
const appointmentServiceController = require('../controllers/appointmentService.controller');
const appointmentController = require('../controllers/appointment.controller');
const appointmentCustomerController = require('../controllers/appointmentCustomer.controller');
const appointmentSmsLogController = require('../controllers/appointmentSmsLog.controller');
const appointmentStatsController = require('../controllers/appointmentStats.controller');
const financeController = require('../controllers/finance.controller');
const customerPackageController = require('../controllers/customerPackage.controller');
const appointmentProductController = require('../controllers/appointmentProduct.controller');
const publicBookingController = require('../controllers/publicBooking.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uuidParamValidation } = require('../middleware/validation.middleware');

// Public routes (no auth)
router.get('/slug/:slug', businessController.getBusinessBySlug);
router.post('/slug/:slug/book', publicBookingController.createPublicBooking);

// Protected
router.use(authenticate);

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

// İstatistikler
router.get('/:id/stats', uuidParamValidation('id'), appointmentStatsController.getStats);

// Gelir/Gider ve Alacak
router.get('/:id/finance/summary', uuidParamValidation('id'), financeController.getFinanceSummary);
router.get('/:id/finance', uuidParamValidation('id'), financeController.getFinanceEntries);
router.post('/:id/finance', uuidParamValidation('id'), financeController.createFinanceEntry);
router.put('/:id/finance/:entryId', uuidParamValidation('id'), uuidParamValidation('entryId'), financeController.updateFinanceEntry);
router.delete('/:id/finance/:entryId', uuidParamValidation('id'), uuidParamValidation('entryId'), financeController.deleteFinanceEntry);
router.get('/:id/receivables', uuidParamValidation('id'), financeController.getReceivables);
router.post('/:id/receivables', uuidParamValidation('id'), financeController.createReceivable);
router.post('/:id/receivables/:receivableId/payments', uuidParamValidation('id'), uuidParamValidation('receivableId'), financeController.addReceivablePayment);
router.delete('/:id/receivables/:receivableId', uuidParamValidation('id'), uuidParamValidation('receivableId'), financeController.deleteReceivable);

// SMS Logları
router.get('/:id/sms-logs', uuidParamValidation('id'), appointmentSmsLogController.getSmsLogs);

// Ürünler
router.get('/:id/products/report', uuidParamValidation('id'), appointmentProductController.getSalesReport);
router.post('/:id/products/sales', uuidParamValidation('id'), appointmentProductController.recordSale);
router.get('/:id/products', uuidParamValidation('id'), appointmentProductController.getProducts);
router.post('/:id/products', uuidParamValidation('id'), appointmentProductController.createProduct);
router.put('/:id/products/:productId', uuidParamValidation('id'), uuidParamValidation('productId'), appointmentProductController.updateProduct);
router.delete('/:id/products/:productId', uuidParamValidation('id'), uuidParamValidation('productId'), appointmentProductController.deleteProduct);

// Paketler
router.get('/:id/packages/expiring', uuidParamValidation('id'), customerPackageController.getExpiringPackages);
router.get('/:id/packages/for-customer', uuidParamValidation('id'), customerPackageController.getPackagesForCustomer);
router.get('/:id/packages', uuidParamValidation('id'), customerPackageController.getPackages);
router.post('/:id/packages', uuidParamValidation('id'), customerPackageController.createPackage);
router.put('/:id/packages/:packageId', uuidParamValidation('id'), uuidParamValidation('packageId'), customerPackageController.updatePackage);
router.delete('/:id/packages/:packageId', uuidParamValidation('id'), uuidParamValidation('packageId'), customerPackageController.deletePackage);

// Müşteriler
router.get('/:id/customers', uuidParamValidation('id'), appointmentCustomerController.getCustomers);
router.get('/:id/customers/:customerId/detail', uuidParamValidation('id'), uuidParamValidation('customerId'), appointmentCustomerController.getCustomerDetail);
router.post('/:id/customers', uuidParamValidation('id'), appointmentCustomerController.createCustomer);

// Randevular
router.get('/:id/appointments', uuidParamValidation('id'), appointmentController.getAppointments);
router.get('/:id/slots', uuidParamValidation('id'), appointmentController.getAvailableSlots);
router.post('/:id/appointments', uuidParamValidation('id'), appointmentController.createAppointment);
router.put('/:id/appointments/:appointmentId', uuidParamValidation('id'), uuidParamValidation('appointmentId'), appointmentController.updateAppointment);
router.delete('/:id/appointments/:appointmentId', uuidParamValidation('id'), uuidParamValidation('appointmentId'), appointmentController.deleteAppointment);

module.exports = router;
