/**
 * Unit tests for utility functions
 */

import { escapeSqlLikePattern } from '@/lib/utils';

describe('escapeSqlLikePattern', () => {
  it('should escape percent wildcard', () => {
    expect(escapeSqlLikePattern('test%value')).toBe('test\\%value');
    expect(escapeSqlLikePattern('100%')).toBe('100\\%');
    expect(escapeSqlLikePattern('%%')).toBe('\\%\\%');
  });

  it('should escape underscore wildcard', () => {
    expect(escapeSqlLikePattern('test_value')).toBe('test\\_value');
    expect(escapeSqlLikePattern('user_id')).toBe('user\\_id');
    expect(escapeSqlLikePattern('__')).toBe('\\_\\_');
  });

  it('should escape backslash', () => {
    expect(escapeSqlLikePattern('test\\value')).toBe('test\\\\value');
    expect(escapeSqlLikePattern('C:\\Users')).toBe('C:\\\\Users');
    expect(escapeSqlLikePattern('\\\\')).toBe('\\\\\\\\');
  });

  it('should handle mixed special characters', () => {
    expect(escapeSqlLikePattern('test%_\\value')).toBe('test\\%\\_\\\\value');
    expect(escapeSqlLikePattern('_user%100\\path')).toBe('\\_user\\%100\\\\path');
  });

  it('should return unchanged string when no special characters', () => {
    expect(escapeSqlLikePattern('normal text')).toBe('normal text');
    expect(escapeSqlLikePattern('email@example.com')).toBe('email@example.com');
    expect(escapeSqlLikePattern('John Doe')).toBe('John Doe');
  });

  it('should handle empty string', () => {
    expect(escapeSqlLikePattern('')).toBe('');
  });

  it('should handle SQL injection attempts', () => {
    // Common SQL injection patterns
    expect(escapeSqlLikePattern("'; DROP TABLE users; --")).toBe("'; DROP TABLE users; --");
    expect(escapeSqlLikePattern("1' OR '1'='1")).toBe("1' OR '1'='1");
    
    // The function only escapes LIKE wildcards, not quotes
    // Quotes should be handled by parameterized queries at the database layer
    expect(escapeSqlLikePattern("admin' --")).toBe("admin' --");
  });

  it('should properly escape search patterns that could cause issues', () => {
    // User searching for literal percent sign (like "10% discount")
    expect(escapeSqlLikePattern('10% discount')).toBe('10\\% discount');
    
    // User searching for underscored values
    expect(escapeSqlLikePattern('user_name_field')).toBe('user\\_name\\_field');
    
    // File paths with backslashes
    expect(escapeSqlLikePattern('docs\\readme.txt')).toBe('docs\\\\readme.txt');
  });
});