// Mock for isows package to avoid ESM parsing issues in Jest
// This is a minimal mock that provides the WebSocket functionality needed by tests

class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 0);
  }
  
  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock send behavior
  }
  
  close(code, reason) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose({ type: 'close', code, reason });
      }
    }, 0);
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

// Export both named and default exports to cover different import styles
export { MockWebSocket as WebSocket };
export default { WebSocket: MockWebSocket };

// Also export as CommonJS for compatibility
module.exports = { WebSocket: MockWebSocket };
module.exports.WebSocket = MockWebSocket;
module.exports.default = { WebSocket: MockWebSocket };