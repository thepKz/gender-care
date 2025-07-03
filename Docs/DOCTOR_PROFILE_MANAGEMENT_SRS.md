# Software Requirements Specification (SRS)

## Doctor Profile Management System

### Document Information

- **Project**: Gender Healthcare Platform
- **Module**: Doctor Profile Management
- **Version**: 1.0
- **Date**: 2025-01-15
- **Author**: Development Team
- **Review Status**: Draft

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for the Doctor Profile Management System within the Gender Healthcare Platform. The system allows doctors to manage their personal information with a two-tier approval process for professional credentials.

### 1.2 Scope

The Doctor Profile Management System provides:

- Personal information management for doctors
- Professional credential management with approval workflow
- Image upload and management via Cloudinary
- Password management functionality
- Manager approval workflow for professional information

### 1.3 Definitions and Acronyms

- **SRS**: Software Requirements Specification
- **UI**: User Interface
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **Manager**: User with administrative privileges to approve doctor profile changes

---

## 2. Overall Description

### 2.1 Product Perspective

The Doctor Profile Management System is a core module of the Gender Healthcare Platform, integrated with:

- User Authentication System
- Role-Based Access Control
- Image Management Service (Cloudinary)
- Notification System
- Audit Trail System

### 2.2 Product Functions

1. **Basic Information Management**

   - View and edit personal details
   - Password management
   - Immediate updates for basic information

2. **Professional Information Management**

   - Manage medical credentials
   - Update specialization and experience
   - Approval workflow for professional changes

3. **Image Management**

   - Avatar upload and management
   - Certificate image upload
   - Cloudinary integration

4. **Approval Workflow**
   - Submit professional information for review
   - Manager approval/rejection process
   - Status tracking and notifications

### 2.3 User Classes

1. **Doctor**: Primary user who manages their profile
2. **Manager**: Administrative user who approves professional information changes
3. **System Administrator**: Technical user with full system access

---

## 3. Database Design

### 3.1 Users Table Structure

```sql
Table Users {
  _id ObjectId [pk]
  email String [unique]
  password String [hashed]
  fullName String
  phone String
  avatar String [cloudinary_url]
  gender String
  address String
  year DateTime
  role String [enum: 'doctor', 'manager', 'admin']
  isActive Boolean
  createdAt DateTime
  updatedAt DateTime
}
```

### 3.2 Doctors Table Structure

```sql
Table Doctors {
  _id ObjectId [pk]
  userId ObjectId [ref: Users._id]
  bio String
  rating Number [default: 0]
  image String [cloudinary_url]
  specialization String
  education String
  certificate String
  experiences JSON

  -- Approval workflow fields
  pendingChanges JSON [nullable]
  approvalStatus String [enum: 'approved', 'pending', 'rejected']
  lastApprovedBy ObjectId [ref: Users._id, nullable]
  lastApprovedAt DateTime [nullable]
  rejectionReason String [nullable]

  createdAt DateTime
  updatedAt DateTime
}
```

### 3.3 Profile Change Requests Table

```sql
Table ProfileChangeRequests {
  _id ObjectId [pk]
  doctorId ObjectId [ref: Doctors._id]
  requestedBy ObjectId [ref: Users._id]
  changeType String [enum: 'bio', 'specialization', 'education', 'certificate', 'image', 'experiences']
  currentValue JSON
  proposedValue JSON
  status String [enum: 'pending', 'approved', 'rejected']
  reviewedBy ObjectId [ref: Users._id, nullable]
  reviewedAt DateTime [nullable]
  reviewComments String [nullable]
  submittedAt DateTime
  createdAt DateTime
  updatedAt DateTime
}
```

---

## 4. Functional Requirements

### 4.1 Basic Information Management

#### 4.1.1 FR-BIM-001: View Personal Information

- **Description**: Doctor can view their basic personal information
- **Priority**: High
- **Inputs**: User authentication token
- **Processing**: Retrieve user data from Users table
- **Outputs**: Display personal information form
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Personal information is displayed correctly

#### 4.1.2 FR-BIM-002: Edit Basic Information

- **Description**: Doctor can edit basic personal information with immediate effect
- **Priority**: High
- **Inputs**:
  - Full name
  - Phone number
  - Gender
  - Address
  - Birth year
- **Processing**:
  - Validate input data
  - Update Users table directly
  - No approval required
- **Outputs**: Success/error message
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Basic information is updated immediately

#### 4.1.3 FR-BIM-003: Avatar Upload

- **Description**: Doctor can upload and update their avatar image
- **Priority**: Medium
- **Inputs**: Image file (JPG, PNG, max 5MB)
- **Processing**:
  - Validate file format and size
  - Upload to Cloudinary
  - Update avatar URL in Users table
- **Outputs**: New avatar displayed
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Avatar is updated and displayed

### 4.2 Professional Information Management

#### 4.2.1 FR-PIM-001: View Professional Information

- **Description**: Doctor can view their professional information and approval status
- **Priority**: High
- **Inputs**: User authentication token
- **Processing**: Retrieve data from Doctors table
- **Outputs**: Display professional information with status indicators
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Professional information and status are displayed

#### 4.2.2 FR-PIM-002: Submit Professional Information Changes

- **Description**: Doctor can submit changes to professional information for approval
- **Priority**: High
- **Inputs**:
  - Bio/Introduction
  - Specialization
  - Education background
  - Certificate information
  - Experience details (JSON)
- **Processing**:
  - Validate input data
  - Create ProfileChangeRequest record
  - Set status to 'pending'
  - Send notification to managers
- **Outputs**: Confirmation message with request ID
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Change request is created and pending approval

#### 4.2.3 FR-PIM-003: Certificate Image Upload

- **Description**: Doctor can upload certificate images
- **Priority**: Medium
- **Inputs**: Certificate image files
- **Processing**:
  - Upload images to Cloudinary
  - Create change request for image URLs
  - Require manager approval
- **Outputs**: Upload confirmation and pending status
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Certificate images are uploaded and pending approval

### 4.3 Password Management

#### 4.3.1 FR-PM-001: Change Password

- **Description**: Doctor can change their account password
- **Priority**: High
- **Inputs**:
  - Current password
  - New password
  - Confirm new password
- **Processing**:
  - Verify current password
  - Validate new password strength
  - Hash and update password
- **Outputs**: Success/error message
- **Preconditions**: User is authenticated as doctor
- **Postconditions**: Password is updated securely

### 4.4 Approval Workflow

#### 4.4.1 FR-AW-001: Manager Review Interface

- **Description**: Managers can review pending profile change requests
- **Priority**: High
- **Inputs**: Change request ID
- **Processing**: Display current vs proposed values
- **Outputs**: Review interface with approve/reject options
- **Preconditions**: User is authenticated as manager
- **Postconditions**: Change request details are displayed for review

#### 4.4.2 FR-AW-002: Approve Changes

- **Description**: Manager can approve professional information changes
- **Priority**: High
- **Inputs**:
  - Change request ID
  - Approval comments (optional)
- **Processing**:
  - Update Doctors table with approved changes
  - Update request status to 'approved'
  - Send notification to doctor
- **Outputs**: Approval confirmation
- **Preconditions**: User is authenticated as manager
- **Postconditions**: Changes are applied and doctor is notified

#### 4.4.3 FR-AW-003: Reject Changes

- **Description**: Manager can reject professional information changes
- **Priority**: High
- **Inputs**:
  - Change request ID
  - Rejection reason (required)
- **Processing**:
  - Update request status to 'rejected'
  - Store rejection reason
  - Send notification to doctor
- **Outputs**: Rejection confirmation
- **Preconditions**: User is authenticated as manager
- **Postconditions**: Request is rejected and doctor is notified with reason

---

## 5. User Interface Requirements

### 5.1 Doctor Profile Dashboard

#### 5.1.1 Personal Information Section

- **Layout**: Two-column layout
- **Left Column**: Avatar and basic info display
- **Right Column**: Editable form fields
- **Actions**: Edit, Save, Cancel buttons
- **Visual Indicators**:
  - Immediate update indicator for basic info
  - Pending approval badge for professional info

#### 5.1.2 Professional Information Section

- **Layout**: Tabbed interface
- **Tabs**: Bio, Specialization, Education, Certificates, Experience
- **Status Display**: Color-coded status badges
  - Green: Approved
  - Yellow: Pending Review
  - Red: Rejected
- **Actions**: Edit, Submit for Review, View History

#### 5.1.3 Image Upload Interface

- **Avatar Upload**:
  - Drag-and-drop area
  - Preview functionality
  - Crop/resize tool
- **Certificate Upload**:
  - Multiple file support
  - Preview gallery
  - Approval status overlay

### 5.2 Manager Approval Interface

#### 5.2.1 Pending Requests Dashboard

- **Layout**: Table/card view of pending requests
- **Columns**: Doctor name, Change type, Submitted date, Priority
- **Filters**: By status, date range, change type
- **Actions**: Review, Bulk approve, Export

#### 5.2.2 Review Detail Page

- **Layout**: Side-by-side comparison
- **Left Side**: Current information
- **Right Side**: Proposed changes
- **Highlighting**: Changed fields highlighted
- **Actions**: Approve, Reject, Request clarification

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

- **Response Time**: Page loads within 2 seconds
- **Image Upload**: Complete within 30 seconds for files up to 5MB
- **Concurrent Users**: Support 100 concurrent doctor profile edits
- **Database Queries**: Response time under 500ms for profile data retrieval

### 6.2 Security Requirements

- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control
- **Data Encryption**: HTTPS for all communications
- **Password Security**: Bcrypt hashing with salt
- **File Upload Security**: File type validation, virus scanning
- **Audit Trail**: Log all profile changes with timestamps and user IDs

### 6.3 Usability Requirements

- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Responsive**: Support for tablets and mobile devices
- **Language**: Vietnamese primary, English secondary
- **Help System**: Contextual help and tooltips

### 6.4 Reliability Requirements

- **Availability**: 99.9% uptime
- **Data Backup**: Daily automated backups
- **Error Handling**: Graceful error handling with user-friendly messages
- **Data Integrity**: Transaction-based updates to prevent data corruption

---

## 7. System Integration

### 7.1 External Services

- **Cloudinary**: Image storage and optimization
- **Email Service**: Notification delivery
- **SMS Service**: Phone verification (future enhancement)

### 7.2 Internal APIs

- **User Management API**: Authentication and basic user data
- **Role Management API**: Permission checking
- **Notification API**: System notifications
- **Audit API**: Activity logging

---

## 8. Acceptance Criteria

### 8.1 Basic Information Management

- ✅ Doctor can view all personal information
- ✅ Doctor can edit basic information with immediate effect
- ✅ Doctor can upload and change avatar
- ✅ Doctor can change password securely

### 8.2 Professional Information Management

- ✅ Doctor can view professional information with approval status
- ✅ Doctor can submit professional information changes
- ⚠️ Changes require manager approval before taking effect (PARTIALLY IMPLEMENTED - direct update only)
- ⚠️ Doctor receives notifications about approval/rejection status (PENDING IMPLEMENTATION)
- ✅ Certificate image upload with preview and management

### 8.3 Approval Workflow

- ⚠️ Manager can view all pending change requests (PENDING IMPLEMENTATION)
- ⚠️ Manager can approve or reject changes with comments (PENDING IMPLEMENTATION)
- ⚠️ System maintains audit trail of all changes (PENDING IMPLEMENTATION)
- ⚠️ Notifications are sent to relevant parties (PENDING IMPLEMENTATION)

### 8.4 User Experience

- ✅ Interface is intuitive and responsive
- ✅ Clear visual indicators for different states
- ✅ Error messages are helpful and actionable
- ✅ Performance meets specified requirements
- ✅ Modern UI with Ant Design components
- ✅ Real-time feedback and statistics display
- ✅ Visual approval status indicators with color-coded badges
- ✅ Comprehensive certificate image management with preview

---

## 9. Implementation Notes & Progress

### 9.1 Completed Features (✅)

**Basic Information Management:**

- ✅ **Profile Viewing**: Complete profile display with user info, professional details, and statistics
- ✅ **Avatar Upload**: Drag-drop image upload with Cloudinary integration and preview
- ✅ **Password Management**: Secure password change modal with validation
- ✅ **Form Validation**: Comprehensive input validation with user-friendly error messages
- ✅ **Basic User Info Management**: Separate form for editing name, phone, gender, address

**Professional Information Management:**

- ✅ **Bio Management**: Rich text area for doctor introduction with character limits
- ✅ **Specialization & Education**: Structured forms for professional details
- ✅ **Certificate Image Upload**: Multi-image upload with preview gallery and delete functionality
- ✅ **Experience Timeline**: Dynamic experience management with start/end years, workplace, and position
- ✅ **Professional Form Editing**: Separate edit mode with save/cancel functionality
- ✅ **Experience Calculation**: Auto-calculated total years of experience based on timeline

**User Experience Enhancements:**

- ✅ **Approval Status Indicators**: Color-coded badges showing approval status for each field
- ✅ **Responsive Design**: Mobile-friendly layout with Ant Design components
- ✅ **Loading States**: Proper loading indicators and error handling
- ✅ **Real-time Feedback**: Immediate success/error messages for user actions
- ✅ **Separation of Concerns**: Basic info and professional info in separate editable cards
- ✅ **Icon Integration**: Intuitive icons for better visual navigation
- ✅ **Enhanced Upload UI**: Beautiful drag-and-drop interface with visual feedback
- ✅ **Experience Cards**: Organized timeline cards with add/remove functionality

### 9.2 Pending Implementation (⚠️)

**Approval Workflow:**

- ⚠️ **Manager Dashboard**: Interface for managers to review pending changes
- ⚠️ **Database Integration**: ProfileChangeRequests table implementation
- ⚠️ **Notification System**: Email/in-app notifications for approval status changes
- ⚠️ **Audit Trail**: Complete logging of all profile changes and approvals

**Advanced Features:**

- ⚠️ **Bulk Operations**: Manager bulk approve/reject functionality
- ⚠️ **Version History**: Track changes over time with rollback capability
- ⚠️ **Advanced Validation**: External verification of medical credentials

### 9.3 Technical Implementation Details

**Frontend Architecture:**

- Built with React + TypeScript for type safety
- Ant Design for consistent UI components
- State management with React hooks
- Cloudinary integration for image storage

**API Integration:**

- RESTful API calls with error handling
- JWT authentication for secure operations
- File upload handling with validation
- Graceful fallback strategies for API failures

**Data Storage:**

- Certificate images stored as JSON array of URLs
- Backward compatibility with text-based certificates
- Approval status simulation with mock data structure

---

## 10. Testing Requirements

### 10.1 Unit Testing

- All API endpoints must have unit tests
- Minimum 80% code coverage
- Test both success and error scenarios

### 10.2 Integration Testing

- Test integration with Cloudinary
- Test email notification delivery
- Test database transaction integrity

### 10.3 User Acceptance Testing

- Doctor profile management workflows
- Manager approval workflows
- Error handling scenarios
- Performance under load

---

## 11. Future Enhancements

### 11.1 Phase 2 Features

- Bulk profile updates for managers
- Advanced image editing tools
- Professional certification verification
- Performance analytics dashboard

### 11.2 Phase 3 Features

- AI-powered profile suggestions
- Integration with medical licensing boards
- Peer review system
- Advanced reporting and analytics

---

## 12. Appendices

### 12.1 API Endpoints

```typescript
// Basic Information
GET /api/doctors/profile/me
PUT /api/doctors/profile/basic
POST /api/doctors/profile/avatar
PUT /api/users/password

// Professional Information
PUT /api/doctors/profile/professional
GET /api/doctors/profile/status
POST /api/doctors/profile/certificates

// Approval Workflow
GET /api/doctors/change-requests
POST /api/doctors/change-requests/:id/approve
POST /api/doctors/change-requests/:id/reject
```

### 12.2 Database Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_doctors_userId ON Doctors(userId);
CREATE INDEX idx_change_requests_doctorId ON ProfileChangeRequests(doctorId);
CREATE INDEX idx_change_requests_status ON ProfileChangeRequests(status);
CREATE INDEX idx_change_requests_submitted ON ProfileChangeRequests(submittedAt);
```

### 12.3 Error Codes

- `PROF_001`: Invalid input data
- `PROF_002`: Unauthorized access
- `PROF_003`: File upload failed
- `PROF_004`: Approval workflow error
- `PROF_005`: Database operation failed

---

**Document Control**

- **Created**: 2025-01-15
- **Last Modified**: 2025-01-15
- **Next Review**: 2025-02-15
- **Approved By**: [To be filled]
- **Status**: Draft
