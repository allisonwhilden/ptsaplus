/**
 * Field-Level Encryption for Sensitive Data
 * Implements AES-256-GCM encryption for PII fields
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

// Get encryption key from environment or generate one
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return key;
};

// Get separate key for different data types (key rotation support)
const getKeyForDataType = (dataType: 'pii' | 'financial' | 'health'): string => {
  const baseKey = getEncryptionKey();
  const typeKeys = {
    pii: process.env.PII_ENCRYPTION_KEY || baseKey,
    financial: process.env.FINANCIAL_ENCRYPTION_KEY || baseKey,
    health: process.env.HEALTH_ENCRYPTION_KEY || baseKey,
  };
  return typeKeys[dataType];
};

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data
 */
export function encryptField(
  plaintext: string,
  dataType: 'pii' | 'financial' | 'health' = 'pii'
): string {
  try {
    if (!plaintext) return plaintext;

    const password = getKeyForDataType(dataType);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);
    
    // Return base64 encoded string
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptField(
  encryptedData: string,
  dataType: 'pii' | 'financial' | 'health' = 'pii'
): string {
  try {
    if (!encryptedData) return encryptedData;

    const password = getKeyForDataType(dataType);
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data for searching (one-way)
 */
export function hashField(data: string): string {
  if (!data) return data;
  
  const salt = process.env.HASH_SALT || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

/**
 * Encrypt an entire object's sensitive fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: Array<keyof T>,
  dataType: 'pii' | 'financial' | 'health' = 'pii'
): T {
  const encrypted = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptField(encrypted[field] as string, dataType) as T[keyof T];
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an entire object's sensitive fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: Array<keyof T>,
  dataType: 'pii' | 'financial' | 'health' = 'pii'
): T {
  const decrypted = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decryptField(decrypted[field] as string, dataType) as T[keyof T];
      } catch (error) {
        // If decryption fails, field might not be encrypted
        console.warn(`Failed to decrypt field ${String(field)}`);
      }
    }
  }
  
  return decrypted;
}

/**
 * Tokenize sensitive data for display (show last 4 digits, etc.)
 */
export function tokenizeField(
  data: string,
  type: 'ssn' | 'phone' | 'email' | 'credit_card'
): string {
  if (!data) return data;
  
  switch (type) {
    case 'ssn':
      // Show last 4 digits: ***-**-1234
      return data.length >= 4 ? `***-**-${data.slice(-4)}` : '***-**-****';
      
    case 'phone':
      // Show area code and last 4: (555) ***-1234
      if (data.length >= 10) {
        return `(${data.slice(0, 3)}) ***-${data.slice(-4)}`;
      }
      return '(***) ***-****';
      
    case 'email':
      // Show first letter and domain: j****@example.com
      const [localPart, domain] = data.split('@');
      if (localPart && domain) {
        return `${localPart[0]}****@${domain}`;
      }
      return '****@****';
      
    case 'credit_card':
      // Show last 4 digits: **** **** **** 1234
      return data.length >= 4 ? `**** **** **** ${data.slice(-4)}` : '**** **** **** ****';
      
    default:
      return '****';
  }
}

/**
 * Generate encryption key for initial setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rotate encryption keys
 */
export async function rotateEncryptionKeys(
  oldKey: string,
  newKey: string,
  reencryptCallback: (oldData: string, newData: string) => Promise<void>
): Promise<void> {
  // This would be implemented to:
  // 1. Decrypt all data with old key
  // 2. Re-encrypt with new key
  // 3. Update database records
  // 4. Mark old key as deprecated
  
  // Implementation would depend on your database structure
  console.log('Key rotation initiated');
}

/**
 * Middleware to automatically encrypt/decrypt fields in API requests/responses
 */
export function encryptionMiddleware(
  fieldsConfig: Record<string, 'pii' | 'financial' | 'health'>
) {
  return {
    request: (data: any) => {
      for (const [field, dataType] of Object.entries(fieldsConfig)) {
        if (data[field]) {
          data[field] = encryptField(data[field], dataType);
        }
      }
      return data;
    },
    response: (data: any) => {
      for (const [field, dataType] of Object.entries(fieldsConfig)) {
        if (data[field]) {
          data[field] = decryptField(data[field], dataType);
        }
      }
      return data;
    }
  };
}

/**
 * Validate encryption key strength
 */
export function validateEncryptionKey(key: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (key.length < 32) {
    issues.push('Key must be at least 32 characters long');
  }
  
  if (!/[A-Z]/.test(key)) {
    issues.push('Key should contain uppercase letters');
  }
  
  if (!/[a-z]/.test(key)) {
    issues.push('Key should contain lowercase letters');
  }
  
  if (!/[0-9]/.test(key)) {
    issues.push('Key should contain numbers');
  }
  
  if (!/[^A-Za-z0-9]/.test(key)) {
    issues.push('Key should contain special characters');
  }
  
  // Check for common patterns
  if (/(.)\1{3,}/.test(key)) {
    issues.push('Key contains repeating characters');
  }
  
  if (/^[A-Za-z]+$/.test(key) || /^[0-9]+$/.test(key)) {
    issues.push('Key should not be only letters or only numbers');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}