/**
 * Testes E2E — requerem dispositivo real com E1_Tef01.dll em C:\Elgin\TEF\
 *
 * Executar com:
 *   npm run test:e2e
 *
 * Durante a execução, o terminal pausa nas etapas de coleta e aguarda
 * entrada do usuário via stdin.
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import * as readline from 'node:readline'
import { Client } from '../../client.js'
import type { CollectTextEvent, CollectOptionsEvent } from '../../types.js'

// ─── Configuração do PDV ──────────────────────────────────────────────────────

const PDV_CONFIG = {
  ip: '127.0.0.1',
  port: 60906,
  pdv: {
    pinpadText: 'TEF E2E',
    version: 'v1.0.0',
    storeName: 'Elgin Teste',
    storeCode: '01',
    terminalId: 'T0001',
  },
}

// ─── Helpers de stdin ─────────────────────────────────────────────────────────

function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

function separator(label: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(` ${label}`)
  console.log('─'.repeat(60))
}

// ─── Factory do cliente com stdin interativo ──────────────────────────────────

function createE2EClient(rl: readline.Interface): Client {
  const client = Client.instance()

  client.configure(PDV_CONFIG.ip, PDV_CONFIG.port, PDV_CONFIG.pdv)

  client.on('message', (msg) => {
    if (msg) console.log(`\n  [TEF] ${msg}`)
  })

  client.on('collect:text', ({ message, type, mask }: CollectTextEvent) => {
    // A resposta é coletada no handler — o evento já foi emitido antes do await
    // O client ficará aguardando o respond() que virá do ask() abaixo
    void ask(
      rl,
      `  → ${message} [tipo: ${type}${mask ? `, máscara: ${mask}` : ''}]: `,
    ).then((value) => {
      if (value === '') {
        client.cancel()
      } else {
        client.respond(value)
      }
    })
  })

  client.on('collect:options', ({ message, options }: CollectOptionsEvent) => {
    console.log(`\n  → ${message}`)
    options.forEach((opt, i) => console.log(`     [${i}] ${opt}`))

    void ask(rl, '  Selecione (índice): ').then((value) => {
      if (value === '') {
        client.cancel()
      } else {
        client.respond(value)
      }
    })
  })

  client.on('approved', ({ sequenceId, needsConfirmation }) => {
    console.log('\n  ✓ TRANSAÇÃO APROVADA')
    console.log(`  Sequencial: ${sequenceId}`)
    console.log(`  Confirmação necessária: ${needsConfirmation}`)
  })

  client.on('print', ({ store, customer }) => {
    if (store) {
      console.log('\n  --- COMPROVANTE LOJA ---')
      console.log(store)
    }
    if (customer) {
      console.log('\n  --- COMPROVANTE CLIENTE ---')
      console.log(customer)
    }
  })

  client.on('confirmed', () => {
    console.log('  ✓ Operação confirmada')
  })

  client.on('error', (code, message) => {
    console.error(`\n  ✗ ERRO [${code}]: ${message}`)
  })

  client.on('finished', () => {
    console.log('  ✓ Sessão finalizada')
  })

  return client
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('E2E — dispositivo real', () => {
  let rl: readline.Interface
  let client: Client

  beforeAll(() => {
    rl = createReadline()
    console.log('\n⚠️  Testes E2E — requerem E1_Tef01.dll em C:\\Elgin\\TEF\\')
    console.log('   Pressione Enter em branco para cancelar uma coleta.\n')
  })

  afterAll(() => {
    client?.unload()
    rl.close()
  })

  beforeEach(() => {
    client = createE2EClient(rl)
  })

  it('payment.credit() — fluxo completo de pagamento com cartão', async () => {
    separator('PAGAMENTO COM CARTÃO')

    const valor = await ask(rl, '  Valor da venda (ex: 1.00): ')

    await client.payment.credit(valor)
  }, 120_000) // 2 min timeout para interação humana

  it('payment.pix() — fluxo completo de pagamento PIX', async () => {
    separator('PAGAMENTO PIX')

    const valor = await ask(rl, '  Valor do PIX (ex: 1.00): ')

    await client.payment.pix(valor)
  }, 120_000)

  it('admin.ask() — menu administrativo', async () => {
    separator('ADMINISTRATIVO')

    await client.admin.ask()
  }, 120_000)
})
