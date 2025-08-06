/**
 * Auth mocking utilities for tests
 * 
 * Provides properly typed mock objects for Clerk auth
 */

export function createMockAuth(userId: string | null = null): any {
  if (userId) {
    // Return authenticated user mock
    return {
      userId,
      sessionClaims: {},
      sessionId: 'mock-session-id',
      sessionStatus: 'active' as const,
      actor: null,
      tokenType: 'session_token' as const,
      getToken: jest.fn().mockResolvedValue('mock-token'),
      has: jest.fn().mockReturnValue(true),
      debug: jest.fn(),
      isAuthenticated: true as const,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: [],
      factorVerificationAge: 0,
      redirectToSignIn: jest.fn(),
      redirectToSignUp: jest.fn(),
      protect: jest.fn(),
    };
  } else {
    // Return unauthenticated user mock
    return {
      userId: null,
      sessionClaims: null,
      sessionId: null,
      sessionStatus: 'signed_out' as const,
      actor: null,
      tokenType: null,
      getToken: jest.fn().mockResolvedValue(null),
      has: jest.fn().mockReturnValue(false),
      debug: jest.fn(),
      isAuthenticated: false as const,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: [],
      factorVerificationAge: null,
      redirectToSignIn: jest.fn(),
      redirectToSignUp: jest.fn(),
      protect: jest.fn(),
    };
  }
}

export function mockAuth(userId: string | null = null) {
  const authMock = createMockAuth(userId);
  
  // Mock the auth function from @clerk/nextjs/server
  jest.mock('@clerk/nextjs/server', () => ({
    auth: jest.fn().mockResolvedValue(authMock),
  }));
  
  return authMock;
}