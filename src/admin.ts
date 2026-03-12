import type { Client } from './client.js'

/**
 * Administrative operations API
 */
export class AdminApi {
  constructor(private client: Client) {}

  /**
   * Ask user which administrative operation to perform
   */
  async ask(): Promise<void> {
    return this.client._executeAdmin('ask')
  }

  /**
   * Cancel a previous transaction
   */
  async cancel(): Promise<void> {
    return this.client._executeAdmin('cancel')
  }

  /**
   * Check for pending transactions
   */
  async pending(): Promise<void> {
    return this.client._executeAdmin('pending')
  }

  /**
   * Reprint last receipt
   */
  async reprint(): Promise<void> {
    return this.client._executeAdmin('reprint')
  }
}
