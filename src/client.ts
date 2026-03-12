import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import type { ElginDll } from './loader.js'
import { PaymentApi } from './payment.js'
import { AdminApi } from './admin.js'
import type {
  PdvConfig,
  TefResponse,
  CardType,
  AdminOp,
  TefClientEvents,
  ApprovedEvent,
  PrintEvent,
  QrCodeEvent,
} from './types.js'

const CARD_TYPE_CODE: Record<CardType, number> = {
  ask: 0,
  credit: 1,
  debit: 2,
  voucher: 3,
  fleet: 4,
  'private-label': 5,
}

const ADMIN_OP_CODE: Record<AdminOp, number> = {
  ask: 0,
  cancel: 1,
  pending: 2,
  reprint: 3,
}

type OperationType = 'payment' | 'pix' | 'admin'

type CollectResolve = (value: { info: string; cancel: boolean }) => void

type WorkerResponse = 
  | { type: 'loaded' }
  | { type: 'configured' }
  | { type: 'result'; data: string }
  | { type: 'unloaded' }
  | { type: 'error'; error: string }

/**
 * Resolve o caminho do worker de forma compatível com CJS e ESM.
 * - ESM / tsx: import.meta.url está disponível
 * - CJS (tsup build): import.meta.url é string vazia, usa __dirname
 */
function getWorkerPath(): string {
  const metaUrl = import.meta.url
  const dir = metaUrl
    ? dirname(fileURLToPath(metaUrl))
    : __dirname

  // Dev mode (tsx): worker.ts existe ao lado do source
  const tsWorker = join(dir, 'worker.ts')
  if (existsSync(tsWorker)) return tsWorker

  // Produção: worker.mjs no dist/
  return join(dir, 'worker.mjs')
}

export class Client extends EventEmitter<TefClientEvents> {
  private worker: Worker | null = null
  private mockDll: ElginDll | null = null // Para testes
  private operationType: OperationType = 'payment'
  private cardType: CardType = 'ask'
  private adminOp: AdminOp = 'ask'
  private collectResolver: CollectResolve | null = null
  private _debugEnabled = false
  private workerPromiseResolve: ((value: string) => void) | null = null
  private workerPromiseReject: ((reason: any) => void) | null = null

  /** Payment operations - use methods like payment.pix(), payment.credit(), etc. */
  public readonly payment: PaymentApi

  /** Administrative operations - use methods like admin.cancel(), admin.pending(), etc. */
  public readonly admin: AdminApi

  constructor(dllPathOrInstance?: string | ElginDll) {
    super()
    
    // Se receber um mock da DLL (para testes), usa ele diretamente
    if (typeof dllPathOrInstance === 'object' && dllPathOrInstance !== null) {
      this.mockDll = dllPathOrInstance
    } else {
      // Cria Worker Thread com resolução CJS/ESM compatível
      this.worker = new Worker(getWorkerPath())
      
      this.worker.on('message', (response: WorkerResponse) => {
        if (response.type === 'result') {
          this.workerPromiseResolve?.(response.data)
        } else if (response.type === 'error') {
          this.workerPromiseReject?.(new Error(response.error))
        } else if (response.type === 'loaded' || response.type === 'configured' || response.type === 'unloaded') {
          this.workerPromiseResolve?.('')
        }
      })
      
      this.worker.on('error', (error) => {
        this.workerPromiseReject?.(error)
      })
      
      // Carrega a DLL no worker
      this._sendToWorker({ type: 'load', dllPath: typeof dllPathOrInstance === 'string' ? dllPathOrInstance : undefined })
    }

    this.payment = new PaymentApi(this)
    this.admin = new AdminApi(this)
  }

  /**
   * Creates a new Client instance
   * @param dllPath - Optional path to the DLL (defaults to C:\Elgin\TEF\E1_Tef01.dll)
   */
  static instance(dllPath?: string): Client {
    return new Client(dllPath)
  }

  // Debug

  /**
   * Enables debug logging to see all DLL calls, responses, and events
   */
  enableDebug(): void {
    this._debugEnabled = true
    this._log('🐛 Debug mode enabled')
  }

  /**
   * Disables debug logging
   */
  disableDebug(): void {
    this._log('🐛 Debug mode disabled')
    this._debugEnabled = false
  }

  private _log(message: string, data?: unknown): void {
    if (!this._debugEnabled) return
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
    if (data !== undefined) {
      console.log(`[${timestamp}] ${message}`, data)
    } else {
      console.log(`[${timestamp}] ${message}`)
    }
  }

  // Worker communication

  private _sendToWorker(message: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.mockDll) {
        // Modo teste: executa sincronamente com mock
        try {
          let result = ''
          switch (message.type) {
            case 'load':
            case 'configured':
            case 'unload':
              result = ''
              break
            case 'IniciarOperacaoTEF':
              result = this.mockDll.IniciarOperacaoTEF(message.payload)
              break
            case 'RealizarPagamentoTEF':
              result = this.mockDll.RealizarPagamentoTEF(message.code, message.payload, message.isNew)
              break
            case 'RealizarPixTEF':
              result = this.mockDll.RealizarPixTEF(message.payload, message.isNew)
              break
            case 'RealizarAdmTEF':
              result = this.mockDll.RealizarAdmTEF(message.code, message.payload, message.isNew)
              break
            case 'ConfirmarOperacaoTEF':
              result = this.mockDll.ConfirmarOperacaoTEF(message.sequenceId, message.action)
              break
            case 'FinalizarOperacaoTEF':
              result = this.mockDll.FinalizarOperacaoTEF(message.id)
              break
            case 'configure':
              this.mockDll.SetClientTCP(message.ip, message.port)
              this.mockDll.ConfigurarDadosPDV(
                message.pdv.pinpadText,
                message.pdv.version,
                message.pdv.storeName,
                message.pdv.storeCode,
                message.pdv.terminalId,
              )
              result = ''
              break
          }
          resolve(result)
        } catch (error) {
          reject(error)
        }
      } else if (this.worker) {
        // Modo produção: envia para worker
        this.workerPromiseResolve = resolve
        this.workerPromiseReject = reject
        this.worker.postMessage(message)
      } else {
        reject(new Error('Worker não inicializado'))
      }
    })
  }

  // Configuration

  async configure(ip: string, port: number, pdv: PdvConfig): Promise<void> {
    this._log('📡 Configuring client', { ip, port, pdv })
    await this._sendToWorker({
      type: 'configure',
      ip,
      port,
      pdv,
    })
  }

  // User response

  /** @internal */
  async _executePayment(card: CardType, amount: string): Promise<void> {
    this._log('💳 Starting payment', { card, amount })
    this.operationType = 'payment'
    this.cardType = card
    await this._run(amount)
  }

  /** @internal */
  async _executePix(amount: string): Promise<void> {
    this._log('💰 Starting PIX', { amount })
    this.operationType = 'pix'
    await this._run(amount)
  }

  /** @internal */
  async _executeAdmin(op: AdminOp): Promise<void> {
    this._log('🔧 Starting admin operation', { op })
    this.operationType = 'admin'
    this.adminOp = op
    await this._run('')
  }

  // User response

  /** Sends the user's input to the pending collect request */
  input(info: string): void {
    this._log('📤 User input', info)
    this.collectResolver?.({ info, cancel: false })
    this.collectResolver = null
  }

  /** Cancels the pending collect request */
  cancel(): void {
    this._log('🚫 User cancelled')
    this.collectResolver?.({ info: '0', cancel: true })
    this.collectResolver = null
  }

  unload(): void {
    if (this.worker) {
      this._sendToWorker({ type: 'unload' }).then(() => {
        this.worker?.terminate()
        this.worker = null
      })
    } else if (this.mockDll) {
      this.mockDll.unload()
    }
  }

  // Internal flow

  private async _run(amount: string): Promise<void> {
    // 1) Start session
    this._log('🚀 Starting TEF session')
    const raw = await this._sendToWorker({ type: 'IniciarOperacaoTEF', payload: '{}' })
    const startResp = this._parse(raw)
    this._log('📥 IniciarOperacaoTEF response', startResp)
    
    if (!startResp.tef) {
      this._log('⚠️  IniciarOperacaoTEF error', { codigo: startResp.codigo, mensagem: startResp.mensagem })
      console.error('\n❌ Erro ao iniciar operação TEF:')
      console.error(JSON.stringify(startResp, null, 2))
      this.emit('error', String(startResp.codigo ?? '-1'), startResp.mensagem ?? 'Falha ao iniciar operação TEF')
      await this._finalize()
      return
    }
    
    if (startResp.tef.retorno !== '1') {
      this.emit('error', startResp.tef.retorno ?? '-1', 'Falha ao iniciar operação TEF')
      await this._finalize()
      return
    }

    // 2) Increment sequence number
    const seq = this._nextSeq(startResp.tef.sequencial ?? '0')
    this._log('🔢 Sequence number', seq)
    const payload: Record<string, unknown> = { sequencial: seq }
    if (amount) payload.valorTotal = amount.replace(/\D/g, '')

    // 3) Start transaction
    let resp = await this._callTransaction(payload, true)

    // Check for DLL-level errors
    if (!resp.tef) {
      this._log('⚠️  DLL error response', { codigo: resp.codigo, mensagem: resp.mensagem })
      console.error('\n❌ Erro da DLL:')
      console.error(JSON.stringify(resp, null, 2))
      this.emit('error', String(resp.codigo ?? '-1'), resp.mensagem ?? 'Erro na DLL')
      await this._finalize()
      return
    }

    // 4) Collect loop
    resp = await this._collectLoop(resp)

    // Safety check after collect loop
    if (!resp.tef) {
      this._log('⚠️  Response missing tef after collect loop')
      console.error('\n❌ Resposta inválida após coleta:')
      console.error(JSON.stringify(resp, null, 2))
      this.emit('error', '-1', 'Resposta inválida da DLL')
      await this._finalize()
      return
    }

    // 5) Check result
    const retorno = resp.tef.retorno ?? ''
    this._log('🏁 Transaction result', { retorno })
    if (retorno === '0' || retorno === '1') {
      const store = (resp.tef.comprovanteDiferenciadoLoja as string) ?? ''
      const customer = (resp.tef.comprovanteDiferenciadoPortador as string) ?? ''

      if (store || customer) {
        const printEvent: PrintEvent = { store, customer }
        this._log('🖨️  Emitting print', { storeLines: store.split('\n').length, customerLines: customer.split('\n').length })
        this.emit('print', printEvent)
      }

      const event: ApprovedEvent = {
        sequenceId: resp.tef.sequencial ?? seq,
        needsConfirmation: retorno === '0',
        // Transaction details
        acquirerDocument: resp.tef.cnpjCredenciadora as string | undefined,
        authorizationCode: resp.tef.codigoAutorizacao as string | undefined,
        transactionDateTime: resp.tef.dataHoraTransacao as string | undefined,
        paymentMethod: resp.tef.formaPagamento as string | undefined,
        merchantId: resp.tef.identificadorEstabelecimento as string | undefined,
        terminalId: resp.tef.identificadorPontoCaptura as string | undefined,
        message: resp.tef.mensagemResultado as string | undefined,
        cardBrand: resp.tef.nomeBandeira as string | undefined,
        merchantName: resp.tef.nomeEstabelecimento as string | undefined,
        provider: resp.tef.nomeProvedor as string | undefined,
        nsu: resp.tef.nsuTerminal as string | undefined,
        maskedPan: resp.tef.panMascarado as string | undefined,
        result: resp.tef.resultadoTransacao as string | undefined,
        service: resp.tef.servico as string | undefined,
        cardType: resp.tef.tipoCartao as string | undefined,
        transaction: resp.tef.transacao as string | undefined,
        uniqueId: resp.tef.uniqueID as string | undefined,
        totalAmount: resp.tef.valorTotal as string | undefined,
      }
      this._log('✅ Emitting approved', event)
      this.emit('approved', event)

      if (retorno === '0') {
        await this._confirm(Number(event.sequenceId))
      }
    } else {
      this._log('❌ Emitting declined', { retorno })
      this.emit('declined', retorno, 'Transação recusada')
    }

    // 6) End session
    await this._finalize()
  }

  private async _collectLoop(resp: TefResponse): Promise<TefResponse> {
    // Safety check: ensure tef object exists
    if (!resp.tef) {
      this._log('⚠️  Response missing tef object', resp)
      console.error('\n⚠️  Resposta sem objeto tef:')
      console.error(JSON.stringify(resp, null, 2))
      return resp
    }

    if (resp.tef.retorno !== undefined && resp.tef.retorno !== '') {
      return resp
    }

    const collectStatus = resp.tef.automacao_coleta_retorno ?? ''
    if (collectStatus !== '0') {
      return resp
    }

    const message = (resp.tef.mensagemResultado as string) ?? ''
    const type = resp.tef.automacao_coleta_tipo ?? ''
    const option = resp.tef.automacao_coleta_opcao ?? ''
    const mask = resp.tef.automacao_coleta_mascara as string | undefined
    const collectSeq = resp.tef.automacao_coleta_sequencial ?? ''

    let info = ''
    let shouldCancel = false

    if (type && !option) {
      // Free-text collect
      this._log('📝 Emitting collect:text', { message, type, mask })
      this.emit('display', message)
      this.emit('collect:text', { message, type, mask })
      const result = await this._waitCollect()
      info = result.info
      shouldCancel = result.cancel
    } else if (type && option) {
      // Option list collect
      const options = option.split(';').filter(Boolean)
      this._log('🔘 Emitting collect:options', { message, options })
      this.emit('display', message)
      this.emit('collect:options', { message, options })
      const result = await this._waitCollect()
      info = options[Number(result.info)] ?? result.info
      shouldCancel = result.cancel
    } else {
      // Informational message — continue automatically
      this._log('⏳ Emitting waiting', message)
      this.emit('waiting', message)

      const qrData = this._extractQrCode(resp.tef)
      if (qrData) {
        const qrEvent: QrCodeEvent = { data: qrData }
        this._log('📱 Emitting qrcode', { dataLength: qrData.length })
        this.emit('qrcode', qrEvent)
      }
    }

    const payload: Record<string, unknown> = {
      automacao_coleta_retorno: shouldCancel ? '9' : '0',
      automacao_coleta_sequencial: collectSeq,
      automacao_coleta_informacao: info,
    }

    const next = await this._callTransaction(payload, false)
    return this._collectLoop(next)
  }

  private async _callTransaction(
    payload: Record<string, unknown>,
    isNew: boolean,
  ): Promise<TefResponse> {
    const json = JSON.stringify(payload)
    this._log(`📞 Calling ${this.operationType} TEF`, { payload, isNew })
    let raw: string

    if (this.operationType === 'pix') {
      raw = await this._sendToWorker({
        type: 'RealizarPixTEF',
        payload: json,
        isNew,
      })
    } else if (this.operationType === 'admin') {
      raw = await this._sendToWorker({
        type: 'RealizarAdmTEF',
        code: ADMIN_OP_CODE[this.adminOp],
        payload: json,
        isNew,
      })
    } else {
      raw = await this._sendToWorker({
        type: 'RealizarPagamentoTEF',
        code: CARD_TYPE_CODE[this.cardType],
        payload: json,
        isNew,
      })
    }

    const response = this._parse(raw)
    this._log('📥 DLL Response', response)
    return response
  }

  private async _confirm(sequenceId: number): Promise<void> {
    this._log('✔️  Confirming transaction', { sequenceId })
    await this._sendToWorker({
      type: 'ConfirmarOperacaoTEF',
      sequenceId,
      action: 1,
    })
    this.emit('confirmed')
  }

  private async _finalize(): Promise<void> {
    this._log('🏁 Finalizing operation')
    await this._sendToWorker({
      type: 'FinalizarOperacaoTEF',
      id: 1,
    })
    this.emit('finished')
  }

  private _waitCollect(): Promise<{ info: string; cancel: boolean }> {
    return new Promise((resolve) => {
      this.collectResolver = resolve
    })
  }

  private _parse(raw: string): TefResponse {
    try {
      return JSON.parse(raw) as TefResponse
    } catch {
      return { codigo: -1, mensagem: 'Erro ao parsear resposta da DLL' }
    }
  }

  private _nextSeq(current: string): string {
    const n = Number(current)
    return isNaN(n) ? '1' : String(n + 1)
  }

  private _extractQrCode(tef: TefResponse['tef']): string | undefined {
    if (!tef) return undefined
    return (tef.qrCode ?? tef.QRCode ?? tef.pixQrCode ?? tef.codigoPix) as string | undefined
  }
}
