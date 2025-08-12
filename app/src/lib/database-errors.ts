/**
 * PostgreSQL Error Code Documentation
 * Common error codes we handle in the communication system
 */

/**
 * PostgreSQL error codes reference
 * Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const POSTGRES_ERROR_CODES = {
  // Class 00 - Successful Completion
  SUCCESSFUL_COMPLETION: '00000',
  
  // Class 02 - No Data
  NO_DATA: '02000',
  NO_ADDITIONAL_RESULT_SETS: '02001',
  
  // Class 08 - Connection Exception
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_FAILURE: '08006',
  CONNECTION_DOES_NOT_EXIST: '08003',
  
  // Class 22 - Data Exception
  DATA_EXCEPTION: '22000',
  STRING_DATA_RIGHT_TRUNCATION: '22001',
  NULL_VALUE_NOT_ALLOWED: '22004',
  INVALID_DATETIME_FORMAT: '22007',
  DIVISION_BY_ZERO: '22012',
  VALUE_TOO_LONG: '22026',
  
  // Class 23 - Integrity Constraint Violation
  INTEGRITY_CONSTRAINT_VIOLATION: '23000',
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  
  // Class 42 - Syntax Error or Access Rule Violation
  SYNTAX_ERROR: '42601',
  INSUFFICIENT_PRIVILEGE: '42501',
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',
  DUPLICATE_TABLE: '42P07',
  
  // Class 53 - Insufficient Resources
  INSUFFICIENT_RESOURCES: '53000',
  DISK_FULL: '53100',
  OUT_OF_MEMORY: '53200',
  TOO_MANY_CONNECTIONS: '53300',
  
  // Class 57 - Operator Intervention
  OPERATOR_INTERVENTION: '57000',
  QUERY_CANCELED: '57014',
  ADMIN_SHUTDOWN: '57P01',
  
  // PostgREST specific codes
  PGRST_NO_ROWS_FOUND: 'PGRST116', // No rows found (404)
  PGRST_MULTIPLE_ROWS: 'PGRST202', // Multiple rows when single expected
  PGRST_PERMISSION_DENIED: 'PGRST301', // RLS policy violation
} as const

/**
 * User-friendly error messages for common database errors
 */
export function getDatabaseErrorMessage(code: string): string {
  switch (code) {
    // Connection errors
    case POSTGRES_ERROR_CODES.CONNECTION_FAILURE:
    case POSTGRES_ERROR_CODES.CONNECTION_EXCEPTION:
      return 'Database connection failed. Please try again later.'
    
    // Data validation errors
    case POSTGRES_ERROR_CODES.STRING_DATA_RIGHT_TRUNCATION:
    case POSTGRES_ERROR_CODES.VALUE_TOO_LONG:
      return 'One or more values are too long. Please shorten your input.'
    
    case POSTGRES_ERROR_CODES.NULL_VALUE_NOT_ALLOWED:
    case POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION:
      return 'Required information is missing. Please fill in all required fields.'
    
    case POSTGRES_ERROR_CODES.INVALID_DATETIME_FORMAT:
      return 'Invalid date or time format. Please check your input.'
    
    // Constraint violations
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return 'Referenced item does not exist or has been deleted.'
    
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
      return 'This item already exists. Please use a different value.'
    
    case POSTGRES_ERROR_CODES.CHECK_VIOLATION:
      return 'The provided value does not meet validation requirements.'
    
    // Permission errors
    case POSTGRES_ERROR_CODES.INSUFFICIENT_PRIVILEGE:
    case POSTGRES_ERROR_CODES.PGRST_PERMISSION_DENIED:
      return 'You do not have permission to perform this action.'
    
    // Resource errors
    case POSTGRES_ERROR_CODES.DISK_FULL:
    case POSTGRES_ERROR_CODES.OUT_OF_MEMORY:
    case POSTGRES_ERROR_CODES.INSUFFICIENT_RESOURCES:
      return 'System resources temporarily unavailable. Please try again later.'
    
    case POSTGRES_ERROR_CODES.TOO_MANY_CONNECTIONS:
      return 'Too many users connected. Please try again in a few moments.'
    
    // Query errors
    case POSTGRES_ERROR_CODES.QUERY_CANCELED:
      return 'Operation took too long and was cancelled. Please try again.'
    
    // PostgREST specific
    case POSTGRES_ERROR_CODES.PGRST_NO_ROWS_FOUND:
      return 'The requested item was not found.'
    
    case POSTGRES_ERROR_CODES.PGRST_MULTIPLE_ROWS:
      return 'Multiple items found when only one was expected.'
    
    // Default fallback
    default:
      return 'An unexpected database error occurred. Please try again.'
  }
}

/**
 * Check if an error is a specific PostgreSQL error
 */
export function isPostgresError(error: any, code: string): boolean {
  return error?.code === code
}

/**
 * Check if error is a "not found" error
 */
export function isNotFoundError(error: any): boolean {
  return error?.code === POSTGRES_ERROR_CODES.PGRST_NO_ROWS_FOUND
}

/**
 * Check if error is a permission/authorization error
 */
export function isPermissionError(error: any): boolean {
  return error?.code === POSTGRES_ERROR_CODES.INSUFFICIENT_PRIVILEGE ||
         error?.code === POSTGRES_ERROR_CODES.PGRST_PERMISSION_DENIED
}

/**
 * Check if error is a constraint violation
 */
export function isConstraintError(error: any): boolean {
  const code = error?.code
  return code?.startsWith('23') // All constraint violations start with 23
}

/**
 * Extract safe error information for logging
 * This ensures we don't leak sensitive information
 */
export function getSafeErrorInfo(error: any): {
  code?: string
  type?: string
  safe_message: string
} {
  const code = error?.code
  const safe_message = code ? getDatabaseErrorMessage(code) : 'An error occurred'
  
  return {
    code,
    type: error?.name || 'DatabaseError',
    safe_message,
  }
}