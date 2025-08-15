// Mock for @react-email/render
export const render = jest.fn(async (component, options) => {
  if (options?.plainText) {
    return 'Test email plain text content'
  }
  return '<html><body>Test email HTML content</body></html>'
})