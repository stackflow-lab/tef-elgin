import { describe, it, expect, vi } from 'vitest'
import { Client } from '../client.js'
import { createMockDll, responses, getMock } from './mocks/elginDll.js'
import type { MockableElginDll } from './mocks/elginDll.js'

function createClient(overrides?: Partial<MockableElginDll>) {
  const dll = createMockDll(overrides)
  const client = new Client(dll)
  return { client, dll }
}

// ─── Coleta de texto ──────────────────────────────────────────────────────────

describe('loop de coleta: texto livre', () => {
  it('emite collect:text e display com o texto da DLL', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaTexto('1'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const onMessage = vi.fn()
    const onCollectText = vi.fn()
    client.on('display', onMessage)
    client.on('collect:text', onCollectText)

    const payPromise = client.payment.debit('10.00')
    await vi.waitFor(() => onCollectText.mock.calls.length > 0)

    expect(onMessage).toHaveBeenCalledWith('Digite o CPF')
    expect(onCollectText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'N', mask: '##.##' }),
    )

    client.respond('12345678900')
    await payPromise
  })

  it('envia automacao_coleta_informacao com o valor respondido', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaTexto('1'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const payPromise = client.payment.debit('10.00')
    await vi.waitFor(
      () => getMock(dll.RealizarPagamentoTEF).mock.calls.length >= 1,
    )

    client.respond('99988877766')
    await payPromise

    const secondCall = getMock(dll.RealizarPagamentoTEF).mock.calls[1]
    const payload = JSON.parse(secondCall[1])
    expect(payload.automacao_coleta_informacao).toBe('99988877766')
    expect(secondCall[2]).toBe(false)
  })

  it('envia automacao_coleta_sequencial ecoado da resposta da DLL', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaTexto('42'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const payPromise = client.payment.debit('10.00')
    await vi.waitFor(
      () => getMock(dll.RealizarPagamentoTEF).mock.calls.length >= 1,
    )

    client.respond('valor')
    await payPromise

    const secondCall = getMock(dll.RealizarPagamentoTEF).mock.calls[1]
    const payload = JSON.parse(secondCall[1])
    expect(payload.automacao_coleta_sequencial).toBe('42')
  })
})

// ─── Coleta de opções ─────────────────────────────────────────────────────────

describe('loop de coleta: seleção de opções', () => {
  it('emite collect:options com o array de opções parseado', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaOpcoes('1'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const onCollectOptions = vi.fn()
    client.on('collect:options', onCollectOptions)

    const payPromise = client.payment.ask('10.00')
    await vi.waitFor(() => onCollectOptions.mock.calls.length > 0)

    expect(onCollectOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        options: ['Debito', 'Credito', 'Voucher'],
        message: 'Selecione o tipo de cartão',
      }),
    )

    client.respond('1')
    await payPromise
  })

  it('envia o valor da opção selecionada (não o índice)', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaOpcoes('1'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const payPromise = client.payment.ask('10.00')
    await vi.waitFor(
      () => getMock(dll.RealizarPagamentoTEF).mock.calls.length >= 1,
    )

    client.respond('1') // índice 1 = "Credito"
    await payPromise

    const secondCall = getMock(dll.RealizarPagamentoTEF).mock.calls[1]
    const payload = JSON.parse(secondCall[1])
    expect(payload.automacao_coleta_informacao).toBe('Credito')
  })
})

// ─── Cancelamento ─────────────────────────────────────────────────────────────

describe('loop de coleta: cancelamento', () => {
  it('envia automacao_coleta_retorno=9 ao chamar cancel()', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaTexto('1'))
        .mockReturnValueOnce(responses.transacaoErro()),
    })
    client.on('error', () => {})

    const payPromise = client.payment.debit('10.00')
    await vi.waitFor(
      () => getMock(dll.RealizarPagamentoTEF).mock.calls.length >= 1,
    )

    client.cancel()
    await payPromise

    const secondCall = getMock(dll.RealizarPagamentoTEF).mock.calls[1]
    const payload = JSON.parse(secondCall[1])
    expect(payload.automacao_coleta_retorno).toBe('9')
  })

  it('múltiplas coletas em sequência: cada respond() avança uma etapa', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn()
        .mockReturnValueOnce(responses.coletaTexto('1'))
        .mockReturnValueOnce(responses.coletaOpcoes('2'))
        .mockReturnValueOnce(responses.transacaoOkSemConfirmacao()),
    })

    const collectTextCalls: unknown[] = []
    const collectOptionsCalls: unknown[] = []
    client.on('collect:text', (d) => {
      collectTextCalls.push(d)
      // Responde automaticamente após a emissão
      setImmediate(() => client.respond('123'))
    })
    client.on('collect:options', (d) => {
      collectOptionsCalls.push(d)
      // Responde automaticamente após a emissão
      setImmediate(() => client.respond('0'))
    })

    await client.payment.ask('10.00')

    expect(collectTextCalls).toHaveLength(1)
    expect(collectOptionsCalls).toHaveLength(1)
    expect(dll.RealizarPagamentoTEF).toHaveBeenCalledTimes(3)
  })
})
