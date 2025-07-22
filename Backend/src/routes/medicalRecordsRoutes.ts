import express from 'express';
import * as medicalRecordsController from '../controllers/medicalRecordsController';
import MedicalRecordSyncController from '../controllers/medicalRecordSyncController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Tạo medical record (Doctor/Staff/Manager/Admin)
router.post('/', 
  verifyToken, 
  roleMiddleware(['doctor', 'staff', 'manager', 'admin']), 
  medicalRecordsController.createMedicalRecord
);

// Cập nhật medical record (Doctor/Staff/Manager/Admin)  
router.put('/:id',
  verifyToken,
  roleMiddleware(['doctor', 'staff', 'manager', 'admin']),
  medicalRecordsController.updateMedicalRecord
);

// Lấy chi tiết medical record (Doctor/Staff/Customer)
router.get('/:id',
  verifyToken,
  medicalRecordsController.getMedicalRecordById
);

// Doctor xem medical records do mình tạo
router.get('/my/records',
  verifyToken,
  roleMiddleware(['doctor']),
  medicalRecordsController.getMyMedicalRecords
);

// Staff xem tất cả medical records
router.get('/staff/all',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  medicalRecordsController.getAllMedicalRecords
);

// User xem medical records của profiles thuộc về mình
router.get('/profile/:profileId',
  verifyToken,
  roleMiddleware(['customer']),
  medicalRecordsController.getMedicalRecordsByProfile
);

// Doctor tìm kiếm medical records do mình tạo
router.get('/my/search',
  verifyToken,
  roleMiddleware(['doctor']),
  medicalRecordsController.searchMyMedicalRecords
);

// Staff tìm kiếm trong tất cả medical records
router.get('/staff/search',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  medicalRecordsController.searchAllMedicalRecords
);

// ✅ Add new route for checking medical record existence
router.get('/check/:appointmentId', medicalRecordsController.checkMedicalRecordByAppointment);

// Add new route for getting medical records by appointmentId
router.get('/appointment/:appointmentId', medicalRecordsController.getMedicalRecordsByAppointment);

// ===== MEDICAL RECORD SYNC ROUTES =====

// POST /api/medical-records/sync/:appointmentId - Đồng bộ một appointment thành medical record
router.post('/sync/:appointmentId',
  verifyToken,
  roleMiddleware(['doctor', 'staff', 'manager', 'admin']),
  MedicalRecordSyncController.syncSingleAppointment
);

// POST /api/medical-records/sync/bulk - Đồng bộ tất cả appointments "Hoàn thành kết quả"
router.post('/sync/bulk',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  MedicalRecordSyncController.syncAllCompletedAppointments
);

// GET /api/medical-records/sync/status/:appointmentId - Kiểm tra trạng thái sync
router.get('/sync/status/:appointmentId',
  verifyToken,
  roleMiddleware(['doctor', 'staff', 'manager', 'admin']),
  MedicalRecordSyncController.checkSyncStatus
);

// GET /api/medical-records/sync/pending - Lấy danh sách appointments cần sync
router.get('/sync/pending',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  MedicalRecordSyncController.getPendingSyncAppointments
);

export default router;