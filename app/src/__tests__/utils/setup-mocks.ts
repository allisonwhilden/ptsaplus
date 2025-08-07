/**
 * Common setup utilities for mocking Supabase responses in tests
 */

export function setupSupabaseMock(mockSupabase: any, data: any = null, error: any = null) {
  // Setup all methods to return the mock object for chaining
  if (mockSupabase.from) mockSupabase.from.mockReturnValue(mockSupabase);
  if (mockSupabase.select) mockSupabase.select.mockReturnValue(mockSupabase);
  if (mockSupabase.insert) mockSupabase.insert.mockReturnValue(mockSupabase);
  if (mockSupabase.update) mockSupabase.update.mockReturnValue(mockSupabase);
  if (mockSupabase.eq) mockSupabase.eq.mockReturnValue(mockSupabase);
  if (mockSupabase.in) mockSupabase.in.mockReturnValue(mockSupabase);
  if (mockSupabase.gte) mockSupabase.gte.mockReturnValue(mockSupabase);
  if (mockSupabase.lte) mockSupabase.lte.mockReturnValue(mockSupabase);
  if (mockSupabase.or) mockSupabase.or.mockReturnValue(mockSupabase);
  if (mockSupabase.order) mockSupabase.order.mockReturnValue(mockSupabase);
  if (mockSupabase.single) mockSupabase.single.mockReturnValue(mockSupabase);
  
  // Setup delete with proper chaining
  if (mockSupabase.delete) {
    mockSupabase.delete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data, error }),
    });
  }
  
  // The final method in the chain that returns the actual data
  if (mockSupabase.range) {
    mockSupabase.range.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : 0 });
  }
  
  // For single operations
  if (mockSupabase.single) {
    mockSupabase.single.mockResolvedValue({ data, error });
  }
  
  return mockSupabase;
}