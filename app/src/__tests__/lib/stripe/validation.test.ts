import {
  validatePaymentAmount,
  validateEmail,
  validateUserId,
  validatePaymentType,
  validatePaymentParams,
  PaymentValidationError,
} from '@/lib/stripe/validation';

describe('Payment Validation', () => {
  describe('validatePaymentAmount', () => {
    it('should accept valid membership amounts', () => {
      expect(() => validatePaymentAmount(1500, 'membership')).not.toThrow();
      expect(() => validatePaymentAmount(2500, 'membership')).not.toThrow();
      expect(() => validatePaymentAmount(5000, 'membership')).not.toThrow();
    });

    it('should accept valid donation amounts', () => {
      expect(() => validatePaymentAmount(100, 'donation')).not.toThrow();
      expect(() => validatePaymentAmount(50000, 'donation')).not.toThrow();
      expect(() => validatePaymentAmount(100000, 'donation')).not.toThrow();
    });

    it('should reject invalid amounts', () => {
      // Too small
      expect(() => validatePaymentAmount(50, 'membership')).toThrow(
        'Payment amount must be at least $1'
      );
      
      // Too large for membership
      expect(() => validatePaymentAmount(15000, 'membership')).toThrow(
        'Payment amount cannot exceed $100'
      );
      
      // Too large for donation
      expect(() => validatePaymentAmount(150000, 'donation')).toThrow(
        'Payment amount cannot exceed $1000'
      );
      
      // Non-integer
      expect(() => validatePaymentAmount(15.50, 'membership')).toThrow(
        'Invalid payment amount'
      );
      
      // Negative
      expect(() => validatePaymentAmount(-100, 'membership')).toThrow(
        'Invalid payment amount'
      );
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
      expect(() => validateEmail('user.name+tag@example.co.uk')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => validateEmail('invalid')).toThrow('Invalid email address');
      expect(() => validateEmail('invalid@')).toThrow('Invalid email address');
      expect(() => validateEmail('@example.com')).toThrow('Invalid email address');
      expect(() => validateEmail('test@')).toThrow('Invalid email address');
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user IDs', () => {
      expect(() => validateUserId('user_123')).not.toThrow();
      expect(() => validateUserId('clerk_user_abc123')).not.toThrow();
    });

    it('should reject invalid user IDs', () => {
      expect(() => validateUserId('')).toThrow('Invalid user ID');
      expect(() => validateUserId('   ')).toThrow('Invalid user ID');
      expect(() => validateUserId(null as any)).toThrow('Invalid user ID');
      expect(() => validateUserId(undefined as any)).toThrow('Invalid user ID');
    });
  });

  describe('validatePaymentType', () => {
    it('should accept valid payment types', () => {
      expect(validatePaymentType('membership')).toBe(true);
      expect(validatePaymentType('donation')).toBe(true);
    });

    it('should reject invalid payment types', () => {
      expect(() => validatePaymentType('subscription')).toThrow('Invalid payment type');
      expect(() => validatePaymentType('other')).toThrow('Invalid payment type');
      expect(() => validatePaymentType('')).toThrow('Invalid payment type');
    });
  });

  describe('validatePaymentParams', () => {
    const validParams = {
      amount: 1500,
      userId: 'user_123',
      userEmail: 'test@example.com',
      paymentType: 'membership',
    };

    it('should accept valid payment parameters', () => {
      const result = validatePaymentParams(validParams);
      expect(result).toEqual({ ...validParams, metadata: {} });
    });

    it('should accept valid parameters with metadata', () => {
      const paramsWithMetadata = {
        ...validParams,
        metadata: { customField: 'value' },
      };
      const result = validatePaymentParams(paramsWithMetadata);
      expect(result).toEqual(paramsWithMetadata);
    });

    it('should reject invalid parameters', () => {
      expect(() => validatePaymentParams(null)).toThrow('Invalid payment parameters');
      expect(() => validatePaymentParams({})).toThrow();
      expect(() => validatePaymentParams({ ...validParams, amount: 50 })).toThrow();
      expect(() => validatePaymentParams({ ...validParams, userEmail: 'invalid' })).toThrow();
      expect(() => validatePaymentParams({ ...validParams, userId: '' })).toThrow();
      expect(() => validatePaymentParams({ ...validParams, paymentType: 'invalid' })).toThrow();
    });
  });
});