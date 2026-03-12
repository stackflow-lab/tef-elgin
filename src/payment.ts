import type { Client } from './client.js'

/**
 * Payment operations API — provides dedicated methods for each payment type
 */
export class PaymentApi {
  constructor(private client: Client) {}

  /**
   * PIX payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async pix(amount: number): Promise<void> {
    return this.client._executePix(amount.toFixed(2))
  }

  /**
   * Credit card payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async credit(amount: number): Promise<void> {
    return this.client._executePayment('credit', amount.toFixed(2))
  }

  /**
   * Debit card payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async debit(amount: number): Promise<void> {
    return this.client._executePayment('debit', amount.toFixed(2))
  }

  /**
   * Voucher card payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async voucher(amount: number): Promise<void> {
    return this.client._executePayment('voucher', amount.toFixed(2))
  }

  /**
   * Fleet card payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async fleet(amount: number): Promise<void> {
    return this.client._executePayment('fleet', amount.toFixed(2))
  }

  /**
   * Private label card payment
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async privateLabel(amount: number): Promise<void> {
    return this.client._executePayment('private-label', amount.toFixed(2))
  }

  /**
   * Ask user which card type to use
   * @param amount - Amount as number (e.g., 10.50 or 10)
   */
  async ask(amount: number): Promise<void> {
    return this.client._executePayment('ask', amount.toFixed(2))
  }
}
