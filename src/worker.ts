/**
 * Worker thread que executa todas as chamadas à DLL nativa
 * Isso evita bloquear a thread principal do Node.js
 *
 * Este arquivo é auto-contido (não importa módulos locais) para funcionar
 * tanto em desenvolvimento (tsx) quanto compilado (tsup).
 */
import { parentPort } from 'node:worker_threads'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import koffi from 'koffi'

const DEFAULT_DLL_PATH = join('C:', 'Elgin', 'TEF', 'E1_Tef01.dll')

function loadDll(dllPath: string = DEFAULT_DLL_PATH) {
  if (!existsSync(dllPath)) {
    throw new Error(`DLL não encontrada: ${dllPath}`)
  }
  const lib = koffi.load(dllPath)
  return {
    GetProdutoTef: lib.func('__stdcall', 'GetProdutoTef', 'int', []),
    GetClientTCP: lib.func('__stdcall', 'GetClientTCP', 'string', []),
    SetClientTCP: lib.func('__stdcall', 'SetClientTCP', 'string', ['string', 'int']),
    ConfigurarDadosPDV: lib.func('__stdcall', 'ConfigurarDadosPDV', 'string', ['string', 'string', 'string', 'string', 'string']),
    IniciarOperacaoTEF: lib.func('__stdcall', 'IniciarOperacaoTEF', 'string', ['string']),
    RecuperarOperacaoTEF: lib.func('__stdcall', 'RecuperarOperacaoTEF', 'string', ['string']),
    RealizarPagamentoTEF: lib.func('__stdcall', 'RealizarPagamentoTEF', 'string', ['int', 'string', 'bool']),
    RealizarPixTEF: lib.func('__stdcall', 'RealizarPixTEF', 'string', ['string', 'bool']),
    RealizarAdmTEF: lib.func('__stdcall', 'RealizarAdmTEF', 'string', ['int', 'string', 'bool']),
    ConfirmarOperacaoTEF: lib.func('__stdcall', 'ConfirmarOperacaoTEF', 'string', ['int', 'int']),
    FinalizarOperacaoTEF: lib.func('__stdcall', 'FinalizarOperacaoTEF', 'string', ['int']),
    unload: () => lib.unload(),
  }
}

type Dll = ReturnType<typeof loadDll>

type WorkerMessage = 
  | { type: 'load'; dllPath?: string }
  | { type: 'configure'; ip: string; port: number; pdv: { pinpadText: string; version: string; storeName: string; storeCode: string; terminalId: string } }
  | { type: 'IniciarOperacaoTEF'; payload: string }
  | { type: 'RealizarPagamentoTEF'; code: number; payload: string; isNew: boolean }
  | { type: 'RealizarPixTEF'; payload: string; isNew: boolean }
  | { type: 'RealizarAdmTEF'; code: number; payload: string; isNew: boolean }
  | { type: 'ConfirmarOperacaoTEF'; sequenceId: number; action: number }
  | { type: 'FinalizarOperacaoTEF'; id: number }
  | { type: 'unload' }

type WorkerResponse = 
  | { type: 'loaded' }
  | { type: 'configured' }
  | { type: 'result'; data: string }
  | { type: 'unloaded' }
  | { type: 'error'; error: string }

let dll: Dll | null = null

if (!parentPort) {
  throw new Error('Este arquivo deve ser executado como Worker Thread')
}

parentPort.on('message', (message: WorkerMessage) => {
  try {
    switch (message.type) {
      case 'load': {
        dll = loadDll(message.dllPath)
        parentPort!.postMessage({ type: 'loaded' } as WorkerResponse)
        break
      }

      case 'configure': {
        if (!dll) throw new Error('DLL não carregada')
        dll.SetClientTCP(message.ip, message.port)
        dll.ConfigurarDadosPDV(
          message.pdv.pinpadText,
          message.pdv.version,
          message.pdv.storeName,
          message.pdv.storeCode,
          message.pdv.terminalId,
        )
        parentPort!.postMessage({ type: 'configured' } as WorkerResponse)
        break
      }

      case 'IniciarOperacaoTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.IniciarOperacaoTEF(message.payload)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'RealizarPagamentoTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.RealizarPagamentoTEF(message.code, message.payload, message.isNew)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'RealizarPixTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.RealizarPixTEF(message.payload, message.isNew)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'RealizarAdmTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.RealizarAdmTEF(message.code, message.payload, message.isNew)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'ConfirmarOperacaoTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.ConfirmarOperacaoTEF(message.sequenceId, message.action)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'FinalizarOperacaoTEF': {
        if (!dll) throw new Error('DLL não carregada')
        const result = dll.FinalizarOperacaoTEF(message.id)
        parentPort!.postMessage({ type: 'result', data: result } as WorkerResponse)
        break
      }

      case 'unload': {
        if (dll) {
          dll.unload()
          dll = null
        }
        parentPort!.postMessage({ type: 'unloaded' } as WorkerResponse)
        break
      }

      default: {
        throw new Error(`Tipo de mensagem desconhecido: ${(message as any).type}`)
      }
    }
  } catch (error) {
    parentPort!.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : String(error) 
    } as WorkerResponse)
  }
})
