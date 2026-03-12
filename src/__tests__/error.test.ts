import { describe, it, expect, vi } from 'vitest'
import { Client } from '../client.js'
import { createMockDll, responses } from './mocks/elginDll.js'
import type { MockableElginDll } from './mocks/elginDll.js'

function createClient(overrides?: Partial<MockableElginDll>) {
  const dll = createMockDll(overrides)
  const client = new Client(dll)
  return { client, dll }
}

// ─── Falha na inicialização ───────────────────────────────────────────────────

describe('error handling: IniciarOperacaoTEF', () => {
  it('emite error quando IniciarOperacaoTEF retorna código diferente de 1', async () => {
    const { client } = createClient({
      IniciarOperacaoTEF: vi.fn().mockReturnValue(responses.iniciarFail()),
    })

    const onError = vi.fn()
    client.on('error', onError)

    await client.payment.debit(10)

    expect(onError).toHaveBeenCalledWith('2', 'Falha ao iniciar operação TEF')
  })

  it('chama FinalizarOperacaoTEF mesmo após falha na inicialização', async () => {
    const { client, dll } = createClient({
      IniciarOperacaoTEF: vi.fn().mockReturnValue(responses.iniciarFail()),
    })
    client.on('error', () => {})

    await client.payment.debit(10)

    expect(dll.FinalizarOperacaoTEF).toHaveBeenCalledWith(1)
  })
})

// ─── Falha na transação ───────────────────────────────────────────────────────

describe('error handling: transação', () => {
  it('emite declined quando retorno da transação não é 0 nem 1', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoErro()),
    })

    const onDeclined = vi.fn()
    client.on('declined', onDeclined)

    await client.payment.debit(10)

    expect(onDeclined).toHaveBeenCalledWith('99', 'Transação recusada')
  })

  it('não emite approved quando há recusa', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoErro()),
    })

    const onApproved = vi.fn()
    client.on('approved', onApproved)

    await client.payment.debit(10)

    expect(onApproved).not.toHaveBeenCalled()
  })

  it('emite finished mesmo após erro na transação', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoErro()),
    })
    client.on('error', () => {})

    const onFinished = vi.fn()
    client.on('finished', onFinished)

    await client.payment.debit(10)

    expect(onFinished).toHaveBeenCalledOnce()
  })
})

// ─── JSON inválido ────────────────────────────────────────────────────────────

describe('error handling: resposta inválida da DLL', () => {
  it('emite error quando DLL retorna JSON inválido', async () => {
    const { client } = createClient({
      IniciarOperacaoTEF: vi.fn().mockReturnValue('NOT_JSON'),
    })

    const onError = vi.fn()
    client.on('error', onError)

    await client.payment.debit(10)

    expect(onError).toHaveBeenCalledWith('-1', 'Erro ao parsear resposta da DLL')
  })
})

// ─── unload ───────────────────────────────────────────────────────────────────

describe('unload()', () => {
  it('chama dll.unload()', () => {
    const { client, dll } = createClient()

    client.unload()

    expect(dll.unload).toHaveBeenCalledOnce()
  })
})
