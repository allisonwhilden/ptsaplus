# Privacy & Compliance Implementation Guide

## Overview

The PTSA+ platform implements comprehensive privacy controls and compliance features to protect sensitive educational and personal data. This guide covers the implementation details, compliance requirements, and operational procedures for maintaining privacy standards.

## Compliance Standards

### FERPA (Family Educational Rights and Privacy Act)
- **Scope**: Protects educational records and student information
- **Implementation**:
  - Role-based access control (admins and board members have elevated access)
  - Comprehensive audit logging of all data access
  - Field-level privacy controls for member directory
  - Secure data export for parents/guardians

### COPPA (Children's Online Privacy Protection Act)
- **Scope**: Protects children under 13 years old
- **Implementation**:
  - Parental consent verification system with 4 FTC-approved methods:
    1. Credit card verification ($0.50 charge/refund)
    2. Knowledge-based authentication (KBA)
    3. Government ID upload
    4. Signed consent form
  - Automatic age-out processing when children turn 13
  - Restricted features for child accounts
  - Parental control over child data

### GDPR (General Data Protection Regulation)
- **Scope**: EU data protection (future-proofing)
- **Implementation**:
  - Right to Access: Data export functionality
  - Right to Erasure: Account deletion with anonymization
  - Right to Rectification: Profile editing capabilities
  - Data Portability: JSON/CSV export formats
  - Consent management with version tracking

### CCPA (California Consumer Privacy Act)
- **Scope**: California resident privacy rights
- **Implementation**:
  - Data collection transparency
  - Opt-out mechanisms for data sharing
  - Data deletion requests
  - No discrimination for exercising rights

## Technical Implementation

### Database Schema

#### Core Privacy Tables
1. **privacy_settings**
   - User-specific visibility preferences
   - Field-level control (email, phone, address, etc.)
   - Directory visibility toggle

2. **consent_records**
   - Immutable audit trail of all consents
   - Tracks consent type, version, and timestamp
   - Parent-child consent relationships

3. **audit_logs**
   - Comprehensive activity logging
   - Tracks user actions, resource access, and changes
   - IP address and user agent capture
   - 3-year retention policy

4. **child_accounts**
   - COPPA compliance for users under 13
   - Parental relationship tracking
   - Age-based restrictions
   - Automatic age-out processing

5. **policy_versions**
   - Privacy policy and terms versioning
   - Tracks changes requiring reconsent
   - Effective date management

6. **data_export_requests**
   - GDPR/CCPA request tracking
   - Export status and expiration
   - Deletion request management

### Security Features

#### Encryption
- **Algorithm**: AES-256-GCM
- **Implementation**: Field-level encryption for PII
- **Key Management**:
  - Separate keys for PII, financial, and health data
  - Key rotation support
  - PBKDF2 key derivation

#### Rate Limiting
- **Data Export**: 3 requests per 24 hours
- **Account Deletion**: 1 request per 24 hours
- **Consent Updates**: 10 per hour
- **COPPA Verification**: 5 attempts per hour
- **Privacy Settings**: 10 updates per minute

#### Row-Level Security (RLS)
- Secure user identification functions
- Role-based access policies
- Privacy-aware views for data access
- JWT integration for session management

### API Endpoints

#### Privacy Settings
- `GET /api/privacy/settings` - Retrieve user's privacy preferences
- `PUT /api/privacy/settings` - Update privacy preferences

#### Consent Management
- `GET /api/privacy/consent` - Get consent history
- `POST /api/privacy/consent` - Record new consent

#### COPPA Compliance
- `POST /api/privacy/coppa/verify-parent` - Parental verification
- `GET /api/privacy/coppa/verify-parent` - Check verification status

#### Data Rights
- `POST /api/privacy/export` - Request data export
- `GET /api/privacy/export/[id]` - Download exported data
- `POST /api/privacy/delete` - Request account deletion

#### Admin Functions
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/audit-logs/export` - Export audit logs
- `GET /api/admin/data-requests` - View data requests
- `GET /api/admin/privacy-stats` - Privacy statistics

## Operational Procedures

### Data Retention Policies

| Data Type | Retention Period | Action After Period |
|-----------|-----------------|-------------------|
| Active Members | Indefinite | N/A |
| Inactive Members | 1 year after expiry | Anonymize |
| Event Registrations | 2 years | Delete |
| Volunteer Records | 3 years | Archive |
| Payment Records | 7 years | Required by law |
| Audit Logs | 3 years | Archive |
| Consent Records | 3 years | Archive |
| Session Data | 30 days | Delete |
| Export Files | 7 days | Delete |

### Automated Processes

1. **Daily (2 AM)**:
   - Run retention policies
   - Clean expired data
   - Process anonymization queue

2. **Weekly (Sunday 3 AM)**:
   - Check for COPPA age-outs
   - Generate compliance reports
   - Archive old audit logs

3. **Hourly**:
   - Clean temporary data
   - Process expired sessions
   - Check export file expiration

### COPPA Parental Verification Process

1. **Age Verification**:
   - Collect birth date during registration
   - Calculate age to determine COPPA applicability
   - Redirect to parental consent if under 13

2. **Parent Verification Methods**:
   - **Credit Card**: $0.50 charge with immediate refund
   - **Knowledge-Based**: Answer 3 of 5 questions correctly
   - **Government ID**: Upload and manual review (24-48 hours)
   - **Consent Form**: Print, sign, and upload (24-48 hours)

3. **Post-Verification**:
   - Create child account with restrictions
   - Link to parent account
   - Apply strictest privacy settings
   - Disable AI features and data sharing

4. **Age-Out Process**:
   - Automatic check when child turns 13
   - Convert to regular account
   - Notify parent and child
   - Archive child account record

### Data Export Process

1. **Request Initiation**:
   - User requests export via privacy settings
   - System validates rate limits
   - Creates export request record

2. **Data Collection**:
   - Profile information
   - Privacy settings
   - Consent history
   - Event registrations
   - Volunteer history
   - Payment history (sanitized)
   - Activity logs

3. **Export Generation**:
   - Compile data into JSON format
   - Encrypt if configured
   - Generate download link
   - Set 7-day expiration

4. **Delivery**:
   - Email notification with download link
   - Secure download via authenticated endpoint
   - Automatic cleanup after expiration

### Account Deletion Process

1. **Request Validation**:
   - Verify user identity
   - Check for pending obligations
   - Validate rate limits

2. **Data Anonymization**:
   - Replace PII with anonymized identifiers
   - Preserve non-PII for statistics
   - Maintain financial records (legal requirement)
   - Archive consent records

3. **Account Cleanup**:
   - Delete from authentication provider (Clerk)
   - Remove from active member lists
   - Cancel active subscriptions
   - Notify relevant parties

4. **Audit Trail**:
   - Log deletion request
   - Record anonymization details
   - Maintain compliance records

## Privacy Settings UI

### User Privacy Dashboard (`/settings/privacy`)
- **Privacy Tab**: Field visibility controls
- **Consent Tab**: Consent management and history
- **Your Data Tab**: Export and deletion options

### Admin Privacy Dashboard (`/admin/privacy`)
- **Audit Logs Tab**: Search and export audit trails
- **Data Requests Tab**: Monitor export/deletion requests
- **Compliance Tab**: System compliance status

## Deployment Checklist

### Pre-Deployment
- [ ] Generate encryption keys (32+ characters)
- [ ] Configure environment variables
- [ ] Run database migrations in order
- [ ] Update privacy policy and terms
- [ ] Configure automated job schedulers
- [ ] Test COPPA verification flows
- [ ] Verify rate limiting configuration

### Post-Deployment
- [ ] Verify encryption is working
- [ ] Test data export functionality
- [ ] Confirm audit logging
- [ ] Check retention automation
- [ ] Monitor rate limit effectiveness
- [ ] Review initial audit logs
- [ ] Train admins on privacy dashboard

## Monitoring & Alerts

### Key Metrics
- Consent completion rate
- COPPA verification success rate
- Data export request volume
- Deletion request frequency
- Audit log growth rate
- Encryption/decryption performance

### Alert Conditions
- Failed COPPA verifications > 10/hour
- Data export failures
- Encryption key issues
- Rate limit breaches
- Unusual audit patterns
- Retention job failures

## Best Practices

### For Developers
1. Always use encryption helpers for PII
2. Log all data access via audit system
3. Implement rate limiting on new endpoints
4. Test with child accounts (under 13)
5. Validate consent before data processing
6. Use privacy-aware database views

### For Administrators
1. Review audit logs weekly
2. Monitor COPPA verification queue
3. Process manual verifications within 48 hours
4. Keep privacy policy updated
5. Train new board members on privacy
6. Document all privacy incidents

### For Users
1. Review privacy settings regularly
2. Keep consent preferences current
3. Monitor children's accounts
4. Export data periodically
5. Report privacy concerns promptly

## Troubleshooting

### Common Issues

#### Encryption Errors
- **Symptom**: "Failed to decrypt data"
- **Cause**: Missing or incorrect encryption key
- **Solution**: Verify ENCRYPTION_KEY environment variable

#### COPPA Verification Failures
- **Symptom**: Parent verification not completing
- **Cause**: Payment processing or KBA issues
- **Solution**: Check Stripe configuration and logs

#### Data Export Timeouts
- **Symptom**: Export request stays "processing"
- **Cause**: Large data volume or system load
- **Solution**: Increase timeout or process async

#### Rate Limit Blocks
- **Symptom**: 429 errors on privacy endpoints
- **Solution**: Wait for reset or admin override

## Legal Compliance Notes

### Required Disclosures
- COPPA notice for parents
- FERPA rights explanation
- Data collection purposes
- Third-party sharing (if any)
- Retention periods
- User rights and choices

### Record Keeping
- Maintain consent records for 3 years
- Keep deletion requests for audit
- Document all privacy incidents
- Preserve parental verifications
- Archive policy versions

### Regular Reviews
- Annual privacy assessment
- Quarterly consent audit
- Monthly COPPA compliance check
- Weekly security review
- Daily monitoring of automated processes

## Contact & Support

For privacy-related issues or questions:
- **Technical Support**: Contact system administrator
- **Privacy Officer**: [Designated privacy officer]
- **Legal Counsel**: [Legal contact for privacy matters]
- **Emergency**: [24/7 incident response]

## Appendix

### Environment Variables
```bash
# Required for production
ENCRYPTION_KEY=          # Main encryption key
PII_ENCRYPTION_KEY=      # PII-specific key
FINANCIAL_ENCRYPTION_KEY= # Financial data key
HASH_SALT=               # Hashing salt
```

### Database Migration Order
1. `005_add_privacy_compliance_tables.sql`
2. `006_fix_rls_security_vulnerability.sql`
3. `007_add_consent_versioning.sql`

### Testing Credentials
- Test child account: Age 10 for COPPA testing
- Test parent account: For verification flows
- Test credit card: 4242 4242 4242 4242 (Stripe test mode)