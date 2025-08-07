/**
 * Common setup utilities for mocking Supabase responses in tests
 */

export function setupSupabaseMock(mockSupabase: any, data: any = null, error: any = null) {
  // Setup all methods to return the mock object for chaining
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.in.mockReturnValue(mockSupabase);
  mockSupabase.gte.mockReturnValue(mockSupabase);
  mockSupabase.lte.mockReturnValue(mockSupabase);
  mockSupabase.or.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue(mockSupabase);
  
  // Setup delete with proper chaining
  mockSupabase.delete.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  });
  
  // The final method in the chain that returns the actual data
  mockSupabase.range.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : 0 });
  
  // For single operations
  mockSupabase.single.mockResolvedValue({ data, error });
  
  return mockSupabase;
}