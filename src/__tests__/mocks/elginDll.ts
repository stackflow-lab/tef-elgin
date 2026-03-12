import { vi } from 'vitest'
import type { Mock } from 'vitest'
import type { ElginDll } from '../../loader.js'

// Tipo para overrides que aceita tanto funções mock quanto KoffiFunction
export type MockableElginDll = {
  [K in keyof ElginDll]: ElginDll[K] extends (...args: any[]) => any
    ? Mock<(...args: Parameters<ElginDll[K]>) => ReturnType<ElginDll[K]>> | ElginDll[K]
    : ElginDll[K]
}

// Respostas padrão reutilizáveis
export const responses = {
  iniciarOk: () => JSON.stringify({ tef: { retorno: '1', sequencial: '10' } }),
  iniciarFail: () => JSON.stringify({ tef: { retorno: '2' } }),

  transacaoOkSemConfirmacao: () =>
    JSON.stringify({ tef: { retorno: '1', sequencial: '11' } }),

  transacaoOkComConfirmacao: () =>
    JSON.stringify({
      tef: {
        retorno: '0',
        sequencial: '11',
        comprovanteDiferenciadoLoja: 'COMPROVANTE LOJA',
        comprovanteDiferenciadoPortador: 'COMPROVANTE CLIENTE',
      },
    }),

  transacaoErro: () => JSON.stringify({ tef: { retorno: '99' } }),

  coletaTexto: (seq = '1') =>
    JSON.stringify({
      tef: {
        automacao_coleta_retorno: '0',
        automacao_coleta_sequencial: seq,
        automacao_coleta_tipo: 'N',
        automacao_coleta_opcao: '',
        automacao_coleta_mascara: '##.##',
        mensagemResultado: 'Digite o CPF',
      },
    }),

  coletaOpcoes: (seq = '1') =>
    JSON.stringify({
      tef: {
        automacao_coleta_retorno: '0',
        automacao_coleta_sequencial: seq,
        automacao_coleta_tipo: 'A',
        automacao_coleta_opcao: 'Debito;Credito;Voucher',
        mensagemResultado: 'Selecione o tipo de cartão',
      },
    }),

  pixComQrCode: () =>
    JSON.stringify({
      tef: {
        automacao_coleta_retorno: '0',
        automacao_coleta_sequencial: '1',
        mensagemResultado: 'Aguarde o QR Code PIX',
        qrCode: '00020126580014BR.GOV.BCB.PIX',
      },
    }),

  finalizarOk: () => JSON.stringify({ tef: { retorno: '1' } }),
  confirmarOk: () => JSON.stringify({ tef: { retorno: '1' } }),
}

export function createMockDll(overrides?: Partial<MockableElginDll>): ElginDll {
  return ({
    GetProdutoTef: vi.fn().mockReturnValue(0),
    GetClientTCP: vi.fn().mockReturnValue(''),
    SetClientTCP: vi.fn().mockReturnValue(''),
    ConfigurarDadosPDV: vi.fn().mockReturnValue(''),
    IniciarOperacaoTEF: vi.fn().mockReturnValue(responses.iniciarOk()),
    RecuperarOperacaoTEF: vi.fn().mockReturnValue(''),
    RealizarPagamentoTEF: vi.fn().mockReturnValue(responses.transacaoOkSemConfirmacao()),
    RealizarPixTEF: vi.fn().mockReturnValue(responses.transacaoOkSemConfirmacao()),
    RealizarAdmTEF: vi.fn().mockReturnValue(responses.transacaoOkSemConfirmacao()),
    ConfirmarOperacaoTEF: vi.fn().mockReturnValue(responses.confirmarOk()),
    FinalizarOperacaoTEF: vi.fn().mockReturnValue(responses.finalizarOk()),
    unload: vi.fn(),
    ...overrides,
  }) as unknown as ElginDll
}

// Helper para obter um mock tipado corretamente
export function getMock<T extends (...args: any[]) => any>(fn: T): Mock<T> {
  return fn as unknown as Mock<T>
}
