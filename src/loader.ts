import koffi from 'koffi'
import { join } from 'node:path'

const DEFAULT_DLL_PATH = join('C:', 'Elgin', 'TEF', 'E1_Tef01.dll')

export function loadElginDll(dllPath: string = DEFAULT_DLL_PATH) {
  const lib = koffi.load(dllPath)

  // Todas as funções usam __stdcall e retornam ponteiro para string ANSI (char*)
  // que koffi converte automaticamente para string JS com o tipo 'string'
  return {
    GetProdutoTef: lib.func('__stdcall', 'GetProdutoTef', 'int', []),

    GetClientTCP: lib.func('__stdcall', 'GetClientTCP', 'string', []),

    SetClientTCP: lib.func('__stdcall', 'SetClientTCP', 'string', [
      'string', // ip
      'int',    // porta
    ]),

    ConfigurarDadosPDV: lib.func('__stdcall', 'ConfigurarDadosPDV', 'string', [
      'string', // textoPinpad
      'string', // versaoAC
      'string', // nomeEstabelecimento
      'string', // loja
      'string', // identificadorPontoCaptura
    ]),

    IniciarOperacaoTEF: lib.func('__stdcall', 'IniciarOperacaoTEF', 'string', [
      'string', // dadosCaptura (JSON)
    ]),

    RecuperarOperacaoTEF: lib.func('__stdcall', 'RecuperarOperacaoTEF', 'string', [
      'string', // dadosCaptura (JSON)
    ]),

    RealizarPagamentoTEF: lib.func('__stdcall', 'RealizarPagamentoTEF', 'string', [
      'int',    // codigoOperacao (0=perguntar,1=crédito,2=débito,3=voucher,4=frota,5=privatelabel)
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    RealizarPixTEF: lib.func('__stdcall', 'RealizarPixTEF', 'string', [
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    RealizarAdmTEF: lib.func('__stdcall', 'RealizarAdmTEF', 'string', [
      'int',    // codigoOperacao (0=perguntar,1=cancelamento,2=pendências,3=reimpressão)
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    ConfirmarOperacaoTEF: lib.func('__stdcall', 'ConfirmarOperacaoTEF', 'string', [
      'int', // id (sequencial)
      'int', // acao (1=confirmar)
    ]),

    FinalizarOperacaoTEF: lib.func('__stdcall', 'FinalizarOperacaoTEF', 'string', [
      'int', // id (1 = a API resolve o sequencial)
    ]),

    unload: () => lib.unload(),
  }
}

export type ElginDll = ReturnType<typeof loadElginDll>
