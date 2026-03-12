/**
 * Exemplo de uso da nova API direcionada
 *
 * Executar com:
 *   npm run playground:new
 */
import * as readline from 'node:readline'
import { Client } from '../src/index.js'

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ─── Configuração ────────────────────────────────────────────────────────────

  const client = Client.instance()

  // Enable debug to see all DLL interactions
  client.enableDebug()

  await client.configure('127.0.0.1', 60906, {
    pinpadText: 'LOJA TESTE',
    version: 'v1.0.0',
    storeName: 'Elgin Teste',
    storeCode: '01',
    terminalId: 'T0001',
  })

  // ─── Event handlers ──────────────────────────────────────────────────────────

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  function ask(question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve))
  }

  client.on('display', (msg) => console.log(`\n[TEF] ${msg}`))
  client.on('waiting', (msg) => console.log(`[AGUARDE] ${msg}`))

  client.on('collect:text', async ({ message, type, mask }) => {
    const value = await ask(
      `${message} [tipo: ${type}${mask ? `, máscara: ${mask}` : ''}]: `,
    )
    if (value === '') {
      client.cancel()
    } else {
      client.respond(value)
    }
  })

    client.on('collect:options', async ({ message, options }) => {
    console.log(`\n${message}`)
    options.forEach((opt, i) => console.log(`  [${i}] ${opt}`))
    const value = await ask('Selecione (índice): ')
    if (value === '') {
      client.cancel()
    } else {
      client.respond(value)
    }
  })

  client.on('qrcode', ({ data }) => {
    console.log('\n[QR CODE]')
    console.log(data)
  })

  client.on('print', ({ store, customer }) => {
    if (store) {
      console.log('\n--- COMPROVANTE LOJA ---')
      console.log(store)
    }
    if (customer) {
      console.log('\n--- COMPROVANTE CLIENTE ---')
      console.log(customer)
    }
  })

  client.on('approved', ({ sequenceId, needsConfirmation, authorizationCode, cardBrand, maskedPan, nsu, totalAmount }) => {
    console.log(`\n✓ APROVADO - Sequencial: ${sequenceId}`)
    if (authorizationCode) console.log(`  Autorização: ${authorizationCode}`)
    if (cardBrand) console.log(`  Bandeira: ${cardBrand}`)
    if (maskedPan) console.log(`  Cartão: ${maskedPan}`)
    if (nsu) console.log(`  NSU: ${nsu}`)
    if (totalAmount) console.log(`  Valor: R$ ${(Number(totalAmount) / 100).toFixed(2)}`)
    if (needsConfirmation) {
      console.log('  (Confirmação será feita automaticamente)')
    }
  })

  client.on('declined', (code, message) => {
    console.error(`\n✗ NEGADO [${code}]: ${message}`)
  })

  client.on('error', (code, message) => {
    console.error(`\n✗ ERRO [${code}]: ${message}`)
  })

  client.on('finished', () => {
    console.log('\n✓ Operação finalizada\n')
    showMenu()
  })

  // ─── Menu ────────────────────────────────────────────────────────────────────

  function separator(label: string) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(` ${label}`)
    console.log('─'.repeat(60))
  }

  async function showMenu() {
    separator('MENU PRINCIPAL')
    console.log('  === PAGAMENTOS ===')
    console.log('  [1] PIX')
    console.log('  [2] Cartão (perguntar tipo)')
    console.log('  [3] Crédito')
    console.log('  [4] Débito')
    console.log('')
    console.log('  === ADMINISTRATIVO ===')
    console.log('  [5] Cancelamento')
    console.log('  [6] Pendências')
    console.log('  [7] Reimpressão')
    console.log('')
    console.log('  [0] Sair\n')

    const choice = await ask('  Selecione: ')

    switch (choice) {
      case '1': {
        const amount = await ask('  Valor do PIX: ')
        await client.payment.pix(amount)
        break
      }
      case '2': {
        const amount = await ask('  Valor da venda: ')
        await client.payment.ask(amount)
        break
      }
      case '3': {
        const amount = await ask('  Valor: ')
        await client.payment.credit(amount)
        break
      }
      case '4': {
        const amount = await ask('  Valor: ')
        await client.payment.debit(amount)
        break
      }
      case '5': {
        await client.admin.cancel()
        break
      }
      case '6': {
        await client.admin.pending()
        break
      }
      case '7': {
        await client.admin.reprint()
        break
      }
      case '0': {
        console.log('\n👋 Até logo!\n')
        client.unload()
        rl.close()
        process.exit(0)
      }
      default: {
        console.log('\n⚠️  Opção inválida')
        showMenu()
      }
    }
  }

  // ─── Start ───────────────────────────────────────────────────────────────────

  console.log('\n⚠️  Nova API — requer E1_Tef01.dll em C:\\Elgin\\TEF\\')
  console.log('   Pressione Enter em branco para cancelar uma coleta.\n')

  showMenu()
}

// ─── Run ───────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
