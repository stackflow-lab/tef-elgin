import type { Client } from './client.js'

/**
 * Payment operations API — provides dedicated methods for each payment type
 */
export class PaymentApi {
  constructor(private client: Client) {}

  /**
   * PIX payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async pix(amount: string): Promise<void> {
    return this.client._executePix(amount)
  }

  /**
   * Credit card payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async credit(amount: string): Promise<void> {
    return this.client._executePayment('credit', amount)
  }

  /**
   * Debit card payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async debit(amount: string): Promise<void> {
    return this.client._executePayment('debit', amount)
  }

  /**
   * Voucher card payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async voucher(amount: string): Promise<void> {
    return this.client._executePayment('voucher', amount)
  }

  /**
   * Fleet card payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async fleet(amount: string): Promise<void> {
    return this.client._executePayment('fleet', amount)
  }

  /**
   * Private label card payment
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async privateLabel(amount: string): Promise<void> {
    return this.client._executePayment('private-label', amount)
  }

  /**
   * Ask user which card type to use
   * @param amount - Amount in format "10.00" or "1000" (cents)
   */
  async ask(amount: string): Promise<void> {
    return this.client._executePayment('ask', amount)
  }
}
