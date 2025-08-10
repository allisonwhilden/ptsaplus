/**
 * Privacy & Compliance Types
 * FERPA/COPPA compliant data structures
 */

export interface PrivacySettings {
  id: string;
  userId: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showChildren: boolean;
  directoryVisible: boolean;
  allowPhotoSharing: boolean;
  allowDataSharing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'coppa_parental'
  | 'photo_sharing'
  | 'data_sharing'
  | 'email_communications'
  | 'directory_inclusion'
  | 'ai_features';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  parentUserId?: string;
  consentVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: Date;
}

export interface ChildAccount {
  id: string;
  childUserId: string;
  parentUserId: string;
  birthDate: Date;
  parentalConsentGiven: boolean;
  consentDate?: Date;
  restrictions: {
    aiFeatures: boolean;
    dataSharing: boolean;
    [key: string]: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type DataRequestType = 'export' | 'deletion' | 'rectification';
export type DataRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DataExportRequest {
  id: string;
  userId: string;
  requestType: DataRequestType;
  status: DataRequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  exportUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

// Privacy validation schemas
export interface PrivacyValidation {
  isAdult: boolean;
  hasParentalConsent: boolean;
  canUseAIFeatures: boolean;
  canShareData: boolean;
  requiredConsents: ConsentType[];
  missingConsents: ConsentType[];
}

// Audit action types
export enum AuditAction {
  // User actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  
  // Privacy actions
  PRIVACY_SETTINGS_UPDATE = 'privacy.settings.update',
  CONSENT_GRANTED = 'consent.granted',
  CONSENT_REVOKED = 'consent.revoked',
  DATA_EXPORT_REQUESTED = 'data.export.requested',
  DATA_EXPORT_COMPLETED = 'data.export.completed',
  DATA_DELETION_REQUESTED = 'data.deletion.requested',
  DATA_DELETION_COMPLETED = 'data.deletion.completed',
  
  // Member actions
  MEMBER_VIEW = 'member.view',
  MEMBER_UPDATE = 'member.update',
  MEMBER_DELETE = 'member.delete',
  
  // Payment actions
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  
  // Event actions
  EVENT_CREATED = 'event.created',
  EVENT_UPDATED = 'event.updated',
  EVENT_DELETED = 'event.deleted',
  EVENT_RSVP = 'event.rsvp',
  EVENT_VOLUNTEER = 'event.volunteer',
  
  // Admin actions
  ADMIN_ACCESS = 'admin.access',
  ADMIN_EXPORT = 'admin.export',
  ADMIN_ROLE_CHANGE = 'admin.role.change',
}

// Privacy field visibility helpers
export interface FieldVisibility {
  email: boolean;
  phone: boolean;
  address: boolean;
  children: boolean;
  [key: string]: boolean;
}

export function getFieldVisibility(
  settings: PrivacySettings | null,
  viewerRole?: string
): FieldVisibility {
  // Admins and board members can see all fields
  if (viewerRole === 'admin' || viewerRole === 'board') {
    return {
      email: true,
      phone: true,
      address: true,
      children: true,
    };
  }

  // Default to most restrictive if no settings
  if (!settings) {
    return {
      email: false,
      phone: false,
      address: false,
      children: false,
    };
  }

  return {
    email: settings.showEmail,
    phone: settings.showPhone,
    address: settings.showAddress,
    children: settings.showChildren,
  };
}

// COPPA age check helper
export function isUnderCOPPAAge(birthDate: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 < 13;
  }
  
  return age < 13;
}

// Required consents based on user type
export function getRequiredConsents(isChild: boolean, features: string[] = []): ConsentType[] {
  const base: ConsentType[] = ['terms_of_service', 'privacy_policy'];
  
  if (isChild) {
    base.push('coppa_parental');
  }
  
  if (features.includes('ai')) {
    base.push('ai_features');
  }
  
  if (features.includes('photos')) {
    base.push('photo_sharing');
  }
  
  return base;
}