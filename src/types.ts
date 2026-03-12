export interface PdvConfig {
  pinpadText: string
  version: string
  storeName: string
  storeCode: string
  terminalId: string
}

// Internal interface - matches DLL parameter names
interface InternalPdvConfig {
  textoPinpad: string
  versaoAC: string
  nomeEstabelecimento: string
  loja: string
  identificadorPontoCaptura: string
}

/** Raw JSON returned by the DLL — field names are dictated by Elgin's protocol */
export interface TefResponse {
  codigo?: number
  mensagem?: string
  tef?: {
    retorno?: string
    sequencial?: string
    automacao_coleta_retorno?: string
    automacao_coleta_sequencial?: string
    automacao_coleta_tipo?: string
    automacao_coleta_opcao?: string
    automacao_coleta_mascara?: string
    mensagemResultado?: string
    comprovanteDiferenciadoLoja?: string
    comprovanteDiferenciadoPortador?: string
    [key: string]: unknown
  }
}

/** Card type for payment transactions */
export type CardType = 'ask' | 'credit' | 'debit' | 'voucher' | 'fleet' | 'private-label'

/** Administrative operation */
export type AdminOp = 'ask' | 'cancel' | 'pending' | 'reprint'

export interface CollectTextEvent {
  message: string
  type: string
  mask?: string
}

export interface CollectOptionsEvent {
  message: string
  options: string[]
}

export interface ApprovedEvent {
  sequenceId: string
  needsConfirmation: boolean
  // Transaction details
  acquirerDocument?: string          // cnpjCredenciadora
  authorizationCode?: string         // codigoAutorizacao
  transactionDateTime?: string       // dataHoraTransacao
  paymentMethod?: string            // formaPagamento
  merchantId?: string               // identificadorEstabelecimento
  terminalId?: string               // identificadorPontoCaptura
  message?: string                  // mensagemResultado
  cardBrand?: string                // nomeBandeira
  merchantName?: string             // nomeEstabelecimento
  provider?: string                 // nomeProvedor
  nsu?: string                      // nsuTerminal
  maskedPan?: string                // panMascarado
  result?: string                   // resultadoTransacao
  service?: string                  // servico
  cardType?: string                 // tipoCartao
  transaction?: string              // transacao
  uniqueId?: string                 // uniqueID
  totalAmount?: string              // valorTotal
}

export interface PrintEvent {
  store: string
  customer: string
}

export interface QrCodeEvent {
  data: string
}

export interface TefClientEvents {
  /** Status/display message from the device */
  display: [message: string]
  /** Informational message — no user input needed, client continues automatically */
  waiting: [message: string]
  /** Requests free-text input from the user */
  'collect:text': [data: CollectTextEvent]
  /** Requests option selection from the user */
  'collect:options': [data: CollectOptionsEvent]
  /** PIX QR Code available for display */
  qrcode: [data: QrCodeEvent]
  /** Receipt ready for printing */
  print: [data: PrintEvent]
  /** Transaction approved */
  approved: [data: ApprovedEvent]
  /** Transaction declined by the network/bank */
  declined: [code: string, message: string]
  /** Confirmation recorded */
  confirmed: []
  /** Session finished */
  finished: []
  /** Technical error (connection, DLL, etc.) */
  error: [code: string, message: string]
}
