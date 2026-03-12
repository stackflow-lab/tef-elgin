import { describe, it, expect, vi } from 'vitest'
import { Client } from '../client.js'
import { createMockDll, responses, getMock } from './mocks/elginDll.js'
import type { MockableElginDll } from './mocks/elginDll.js'

function createClient(overrides?: Partial<MockableElginDll>) {
  const dll = createMockDll(overrides)
  const client = new Client(dll)
  return { client, dll }
}

// ─── configure ───────────────────────────────────────────────────────────────

describe('configure()', () => {
  it('chama SetClientTCP com ip e porta corretos', async () => {
    const { client, dll } = createClient()

    await client.configure('127.0.0.1', 60906, {
      pinpadText: 'PDV',
      version: 'v1.0',
      storeName: 'Loja',
      storeCode: '01',
      terminalId: 'T001',
    })

    expect(dll.SetClientTCP).toHaveBeenCalledWith('127.0.0.1', 60906)
  })

  it('chama ConfigurarDadosPDV com todos os campos', async () => {
    const { client, dll } = createClient()

    const pdv = {
      pinpadText: 'PDV Teste',
      version: 'v2.0.0',
      storeName: 'Mercado',
      storeCode: '02',
      terminalId: 'T999',
    }
    await client.configure('localhost', 9000, pdv)

    expect(dll.ConfigurarDadosPDV).toHaveBeenCalledWith(
      pdv.pinpadText,
      pdv.version,
      pdv.storeName,
      pdv.storeCode,
      pdv.terminalId,
    )
  })
})

// ─── pay() ────────────────────────────────────────────────────────────────────

describe('pay()', () => {
  it('emite approved sem confirmação (retorno=1)', async () => {
    const { client } = createClient()
    const onApproved = vi.fn()
    const onFinished = vi.fn()
    client.on('approved', onApproved)
    client.on('finished', onFinished)

    await client.payment.debit('50.00')

    expect(onApproved).toHaveBeenCalledOnce()
    expect(onApproved.mock.calls[0][0]).toMatchObject({ needsConfirmation: false })
    expect(onFinished).toHaveBeenCalledOnce()
  })

  it('emite approved com confirmação (retorno=0) e chama ConfirmarOperacaoTEF', async () => {
    const { client, dll } = createClient({
      RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoOkComConfirmacao()),
    })

    const onApproved = vi.fn()
    const onPrint = vi.fn()
    const onConfirmed = vi.fn()
    client.on('approved', onApproved)
    client.on('print', onPrint)
    client.on('confirmed', onConfirmed)

    await client.payment.credit('100.00')

    expect(onApproved.mock.calls[0][0]).toMatchObject({ needsConfirmation: true })
    expect(onPrint.mock.calls[0][0]).toMatchObject({
      store: 'COMPROVANTE LOJA',
      customer: 'COMPROVANTE CLIENTE',
    })
    expect(dll.ConfirmarOperacaoTEF).toHaveBeenCalledWith(11, 1)
    expect(onConfirmed).toHaveBeenCalledOnce()
  })

  it('chama RealizarPagamentoTEF com novaTransacao=true na primeira chamada', async () => {
    const { client, dll } = createClient()

    await client.payment.debit('25.00')

    expect(dll.RealizarPagamentoTEF).toHaveBeenCalledWith(
      2,
      expect.stringContaining('"valorTotal"'),
      true,
    )
  })

  it('usa o valor em centavos (remove não-dígitos)', async () => {
    const { client, dll } = createClient()

    await client.payment.ask('R$ 99,90')

    const callArg = JSON.parse(
      getMock(dll.RealizarPagamentoTEF).mock.calls[0][1],
    )
    expect(callArg.valorTotal).toBe('9990')
  })

  it('chama FinalizarOperacaoTEF ao final', async () => {
    const { client, dll } = createClient()

    await client.payment.debit('10.00')

    expect(dll.FinalizarOperacaoTEF).toHaveBeenCalledWith(1)
  })

  it('emite declined quando retorno indica recusa', async () => {
    const { client } = createClient({
      RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoErro()),
    })

    const onDeclined = vi.fn()
    client.on('declined', onDeclined)

    await client.payment.credit('10.00')

    expect(onDeclined).toHaveBeenCalledOnce()
    expect(onDeclined.mock.calls[0][0]).toBe('99')
  })
})

// ─── pix() ────────────────────────────────────────────────────────────────────

describe('pix()', () => {
  it('chama RealizarPixTEF (não RealizarPagamentoTEF)', async () => {
    const { client, dll } = createClient()

    await client.payment.pix('30.00')

    expect(dll.RealizarPixTEF).toHaveBeenCalledOnce()
    expect(dll.RealizarPagamentoTEF).not.toHaveBeenCalled()
  })

  it('emite approved ao completar', async () => {
    const { client } = createClient()
    const onApproved = vi.fn()
    client.on('approved', onApproved)

    await client.payment.pix('30.00')

    expect(onApproved).toHaveBeenCalledOnce()
  })

  it('emite qrcode quando a resposta contém QR Code', async () => {
    const { client } = createClient({
      RealizarPixTEF: vi.fn()
        .mockReturnValueOnce(responses.pixComQrCode())
        .mockReturnValue(responses.transacaoOkSemConfirmacao()),
    })

    const onQrCode = vi.fn()
    const onWaiting = vi.fn()
    client.on('qrcode', onQrCode)
    client.on('waiting', onWaiting)

    await client.payment.pix('50.00')

    expect(onWaiting).toHaveBeenCalledOnce()
    expect(onQrCode).toHaveBeenCalledOnce()
    expect(onQrCode.mock.calls[0][0]).toMatchObject({ data: '00020126580014BR.GOV.BCB.PIX' })
  })
})

// ─── adm() ────────────────────────────────────────────────────────────────────

describe('adm()', () => {
  it('chama RealizarAdmTEF com o código de operação correto', async () => {
    const { client, dll } = createClient()

    await client.admin.cancel()

    expect(dll.RealizarAdmTEF).toHaveBeenCalledWith(1, expect.any(String), true)
    expect(dll.RealizarPagamentoTEF).not.toHaveBeenCalled()
    expect(dll.RealizarPixTEF).not.toHaveBeenCalled()
  })
})
