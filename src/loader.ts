import koffi from 'koffi'
import { join } from 'node:path'

const DEFAULT_DLL_PATH = join('C:', 'Elgin', 'TEF', 'E1_Tef01.dll')

export function loadElginDll(dllPath: string = DEFAULT_DLL_PATH) {
  const lib = koffi.load(dllPath)

  // All functions use __stdcall and return pointer to ANSI string (char*)
  // which koffi automatically converts to JS string with type 'string'
  return {
    GetProdutoTef: lib.func('__stdcall', 'GetProdutoTef', 'int', []),

    GetClientTCP: lib.func('__stdcall', 'GetClientTCP', 'string', []),

    SetClientTCP: lib.func('__stdcall', 'SetClientTCP', 'string', [
      'string', // ip
      'int',    // port
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
      'int',    // codigoOperacao (0=ask,1=credit,2=debit,3=voucher,4=fleet,5=privatelabel)
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    RealizarPixTEF: lib.func('__stdcall', 'RealizarPixTEF', 'string', [
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    RealizarAdmTEF: lib.func('__stdcall', 'RealizarAdmTEF', 'string', [
      'int',    // codigoOperacao (0=ask,1=cancel,2=pending,3=reprint)
      'string', // dadosCaptura (JSON)
      'bool',   // novaTransacao
    ]),

    ConfirmarOperacaoTEF: lib.func('__stdcall', 'ConfirmarOperacaoTEF', 'string', [
      'int', // id (sequential)
      'int', // action (1=confirm)
    ]),

    FinalizarOperacaoTEF: lib.func('__stdcall', 'FinalizarOperacaoTEF', 'string', [
      'int', // id (1 = the API resolves the sequential)
    ]),

    unload: () => lib.unload(),
  }
}

export type ElginDll = ReturnType<typeof loadElginDll>
