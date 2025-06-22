# IV.4. Class Diagrams

## Gender Healthcare Service Management System - Class Diagrams Overview (Real Implementation)

This section presents 20 class diagrams for the main features of the Gender Healthcare Service Management system. Each diagram has been verified against actual code implementation to ensure accuracy and reflects only the classes that exist in the codebase.

## Class Diagrams List

### 🔐 **Authentication & User Management (4 diagrams)**

#### **IV.4.1. User Authentication System**
- **File**: `Classes/01_user_authentication.pu`
- **Description**: Simple JWT-based authentication system
- **Real Classes**: User, AuthToken, OtpCode, LoginHistory
- **Key Features**: Basic login/logout, JWT tokens, OTP verification, login tracking
- **Implementation**: MongoDB with basic auth middleware

#### **IV.4.2. User Profile Management**  
- **File**: `Classes/02_user_profile.pu`
- **Description**: Basic user profile and contact information management
- **Real Classes**: User, UserProfiles, ContactInfo
- **Key Features**: Profile CRUD operations, contact information management
- **Implementation**: Simple profile system with reference to User model

#### **IV.4.3. Role-Based Access Control**
- **File**: `Classes/03_role_access_control.pu`
- **Description**: Simple role-based access control with enum roles
- **Real Classes**: User (with role field), AuthToken, LoginHistory, SystemLogs
- **Key Features**: Basic role checking using User.role enum
- **Implementation**: Simple role field in User model, no separate Role/Permission tables

#### **IV.4.4. Login History Tracking**
- **File**: `Classes/04_login_history.pu`
- **Description**: Basic login activity tracking
- **Real Classes**: LoginHistory, User, SystemLogs
- **Key Features**: Login/logout tracking, basic audit trail
- **Implementation**: Simple login history with user reference

---

### 👩‍⚕️ **Healthcare Management (5 diagrams)**

#### **IV.4.5. Doctor Management System**
- **File**: `Classes/05_doctor_management.pu`
- **Description**: Doctor information and schedule management
- **Real Classes**: Doctor, DoctorSchedule, User
- **Key Features**: Doctor profiles, schedule management, specialization
- **Implementation**: Doctor model with schedule references

#### **IV.4.6. Medical Records Management**
- **File**: `Classes/06_medical_records.pu`
- **Description**: Basic medical records system
- **Real Classes**: MedicalRecords, User, UserProfiles
- **Key Features**: Medical record creation, basic health data storage
- **Implementation**: Simple medical records with user/profile references

#### **IV.4.7. Medication & Reminders**
- **File**: `Classes/07_medication_reminders.pu`
- **Description**: Medication tracking and reminder system
- **Real Classes**: Medicines, MedicationReminders, User, UserProfiles
- **Key Features**: Medicine catalog, medication reminders, embedded medicines
- **Implementation**: Medication reminders with embedded medicine references

#### **IV.4.8. Doctor Q&A System**
- **File**: `Classes/08_doctor_qa.pu`
- **Description**: Simple Q&A consultation system
- **Real Classes**: DoctorQA, Doctor, User
- **Key Features**: Question submission, doctor consultation scheduling
- **Implementation**: Single DoctorQA model for consultation requests

#### **IV.4.9. Healthcare Services**
- **File**: `Classes/09_healthcare_services.pu`
- **Description**: Basic healthcare services and packages
- **Real Classes**: Service, ServicePackages
- **Key Features**: Service catalog, package management, pricing
- **Implementation**: Simple services with package options

---

### 📅 **Appointment & Booking (3 diagrams)**

#### **IV.4.10. Appointment Management**
- **File**: `Classes/10_appointment_management.pu`
- **Description**: Basic appointment booking system
- **Real Classes**: Appointments, User, UserProfiles, Doctor, Service, ServicePackages
- **Key Features**: Appointment booking, status tracking, service/package references
- **Implementation**: Single Appointments model with references to services and packages

#### **IV.4.11. Meeting Management**
- **File**: `Classes/11_meeting_management.pu`
- **Description**: Simple online consultation meeting system
- **Real Classes**: Meeting, DoctorQA, Doctor, User
- **Key Features**: Google Meet integration, meeting scheduling for consultations
- **Implementation**: Meeting model linked to DoctorQA for online consultations

#### **IV.4.12. Appointment Tests**
- **File**: `Classes/12_appointment_tests.pu`
- **Description**: Basic test management for appointments
- **Real Classes**: AppointmentTests, Appointments
- **Key Features**: Test creation, pricing, preparation guidelines
- **Implementation**: Simple test model linked to appointments

---

### 🔬 **STI Testing System (3 diagrams)**

#### **IV.4.13. Test Management**
- **File**: `Classes/13_test_management.pu`
- **Description**: Test categories and results management
- **Real Classes**: TestCategories, TestResults, TestResultItems
- **Key Features**: Test categorization, result recording, item management
- **Implementation**: Basic test system with categories and results

#### **IV.4.14. Laboratory Workflow**
- **File**: `Classes/14_laboratory_workflow.pu`
- **Description**: Basic laboratory process management
- **Real Classes**: TestResults, TestResultItems, TestCategories
- **Key Features**: Simple test processing workflow
- **Implementation**: Basic workflow using existing test models

#### **IV.4.15. Test Result Reporting**
- **File**: `Classes/15_test_result_reporting.pu`
- **Description**: Test result viewing and reporting
- **Real Classes**: TestResults, TestResultItems, User, UserProfiles
- **Key Features**: Result viewing, basic reporting
- **Implementation**: Simple result display with user access

---

### 📊 **Menstrual Cycle Tracking (2 diagrams)**

#### **IV.4.16. Cycle Tracking**
- **File**: `Classes/16_cycle_tracking.pu`
- **Description**: Basic menstrual cycle tracking
- **Real Classes**: MenstrualCycles, CycleSymptoms, User, UserProfiles
- **Key Features**: Cycle recording, symptom tracking, basic data
- **Implementation**: Simple cycle tracking with start/end dates and symptoms

#### **IV.4.17. Notification System**
- **File**: `Classes/17_notification_system.pu`
- **Description**: Simple notification system for medication reminders
- **Real Classes**: NotificationDays, MedicationReminders, User, UserProfiles, Medicines
- **Key Features**: Medication reminder notifications, status tracking
- **Implementation**: Notification system specifically for medication reminders only

---

### 💰 **Payment & Billing (2 diagrams)**

#### **IV.4.18. Payment Processing**
- **File**: `Classes/18_payment_processing.pu`
- **Description**: Payment processing with PayOS integration
- **Real Classes**: Payments, Bills, PaymentTracking, Appointments, User, UserProfiles
- **Key Features**: PayOS payment gateway, transaction tracking, billing
- **Implementation**: Complete payment system with Bills → Payments flow and PayOS tracking

#### **IV.4.19. Package Management**
- **File**: `Classes/19_package_management.pu`
- **Description**: Service package management and purchasing
- **Real Classes**: ServicePackages, PackagePurchases, User, UserProfiles, Bills
- **Key Features**: Package creation, purchase tracking, billing integration
- **Implementation**: Package system integrated with billing and payment processing

---

### 📝 **Content Management (1 diagram)**

#### **IV.4.20. Blog & Content System**
- **File**: `Classes/20_blog_content.pu`
- **Description**: Blog and educational content management
- **Real Classes**: BlogPosts, BlogCategories, PostCategories, User
- **Key Features**: Content creation, categorization, basic CMS
- **Implementation**: Simple blog system with categories and user authoring

---

## Important Implementation Notes

### **What Was Removed From Original Diagrams**
- **Complex RBAC**: Removed separate Role, Permission, UserRole tables - using simple role enum in User model
- **Advanced Features**: Removed hundreds of complex classes that don't exist in actual code
- **Over-Engineering**: Simplified to match actual implementation level
- **Fictional Enums**: Removed elaborate enum systems not present in code

### **What Exists in Real Code**
- **Simple Models**: Basic MongoDB models with essential fields only
- **Basic Relationships**: Simple references between models, no complex joins
- **Essential Features**: Core functionality without over-engineering
- **Working System**: All diagrams reflect actual working code

### **Class Diagram Conventions (Corrected)**

#### **UML Visibility Standards Applied**
- **+** Public methods only (business operations)
- **-** Private fields and internal methods (proper encapsulation)
- **#** Protected (inheritance-related)
- **~** Package (module-level access)

#### **Encapsulation Principles**
- All data fields are private (-) following OOP principles
- Public methods (+) provide controlled access to data
- Private helper methods (-) for internal validation and logic

### **Database Integration (Real Implementation)**
- MongoDB with Mongoose ODM
- ObjectId references for relationships
- Timestamps (createdAt, updatedAt) where needed
- Simple indexes for performance
- No complex normalization - document-based design

### **Validation & Security (Actual Implementation)**
- Basic input validation using Mongoose schemas
- JWT tokens for authentication
- Role-based middleware for authorization
- PayOS integration for secure payments

### **Performance Considerations (Real)**
- Mongoose population for related data
- Basic indexing on frequently queried fields
- Simple pagination where implemented
- Efficient query patterns for MongoDB

---

## Verification Status

✅ **All 20 diagrams verified against actual codebase**  
✅ **Removed fictional classes and relationships**  
✅ **Applied proper UML encapsulation principles**  
✅ **Diagrams now accurately reflect working system**

**Last Updated**: Không biết vì minthep đã xóa
**Verification Method**: Direct code inspection of Backend/src/models/ and related files