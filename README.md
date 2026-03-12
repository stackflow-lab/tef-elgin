# Elgin TEF SDK

> SDK Node.js para integração com Elgin TEF - Terminal de pagamentos eletrônicos

[![npm version](https://img.shields.io/npm/v/@stackflow-lab/elgin-sdk.svg)](https://www.npmjs.com/package/@stackflow-lab/elgin-sdk)
[![License](https://img.shields.io/npm/l/@stackflow-lab/elgin-sdk.svg)](https://github.com/stackflow-lab/elgin-sdk/blob/main/LICENSE)

## 📋 Índice

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Início Rápido](#-início-rápido)
- [Uso](#-uso)
  - [Configuração](#configuração)
  - [Pagamentos](#pagamentos)
  - [Operações Administrativas](#operações-administrativas)
  - [Eventos](#eventos)
- [Debug](#-debug)
- [API Reference](#-api-reference)
- [Exemplos](#-exemplos)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Licença](#-licença)

## ✨ Características

- 🎯 **API Intuitiva** - Métodos direcionados como `payment.pix()`, `payment.credit()`
- 🔄 **Event-driven** - Arquitetura baseada em eventos para máximo controle
- 📦 **TypeScript** - Totalmente tipado para melhor experiência de desenvolvimento
- 🐛 **Debug Built-in** - Sistema de logs detalhados para desenvolvimento
- ✅ **Testado** - 100% de cobertura de testes
- 🚀 **Moderno** - ESM + CJS, Node.js 22+

## 📦 Requisitos

- **Node.js**: >= 22.0.0
- **Sistema Operacional**: Windows (requerido pela DLL da Elgin)
- **DLL Elgin TEF**: `E1_Tef01.dll` instalada em `C:\Elgin\TEF\`
- **Elgin TEF Client**: Servidor TEF rodando (padrão: `127.0.0.1:60906`)

## 🚀 Instalação

```bash
npm install @stackflow-lab/elgin-sdk
```

ou

```bash
yarn add @stackflow-lab/elgin-sdk
```

## ⚡ Início Rápido

```typescript
import { Client } from "@stackflow-lab/elgin-sdk";

// 1. Criar instância do cliente
const client = Client.instance();

// 2. Configurar conexão
client.configure("127.0.0.1", 60906, {
  pinpadText: "MINHA LOJA",
  version: "v1.0.0",
  storeName: "Minha Loja",
  storeCode: "01",
  terminalId: "T0001",
});

// 3. Configurar eventos
client.on("approved", ({ authorizationCode, nsu }) => {
  console.log(`Aprovado! NSU: ${nsu}`);
});

client.on("error", (code, message) => {
  console.error(`Erro [${code}]: ${message}`);
});

// 4. Realizar pagamento
await client.payment.pix("10.00");
```

## 📖 Uso

### Configuração

```typescript
import { Client } from "@stackflow-lab/elgin-sdk";

const client = Client.instance();

// Caminho customizado para a DLL (opcional)
// const client = Client.instance('D:\\MinhaDLL\\E1_Tef01.dll')

client.configure(ip, port, {
  pinpadText: "NOME LOJA", // Texto exibido no pinpad
  version: "v1.0.0", // Versão da aplicação
  storeName: "Nome Completo", // Nome do estabelecimento
  storeCode: "01", // Código da loja
  terminalId: "T0001", // ID do terminal/PDV
});
```

### Pagamentos

#### PIX

```typescript
await client.payment.pix("50.00");
```

#### Cartão de Crédito

```typescript
await client.payment.credit("100.00");
```

#### Cartão de Débito

```typescript
await client.payment.debit("75.50");
```

#### Perguntar Tipo de Cartão

```typescript
// O pinpad perguntará ao cliente qual tipo usar
await client.payment.ask("80.00");
```

#### Outros Tipos

```typescript
// Voucher (alimentação/refeição)
await client.payment.voucher("45.00");

// Frota
await client.payment.fleet("200.00");

// Private Label
await client.payment.privateLabel("150.00");
```

### Operações Administrativas

#### Cancelamento

```typescript
await client.admin.cancel();
```

#### Consultar Pendências

```typescript
await client.admin.pending();
```

#### Reimpressão

```typescript
await client.admin.reprint();
```

#### Perguntar Operação

```typescript
// O pinpad perguntará qual operação realizar
await client.admin.ask();
```

### Eventos

Configure handlers para os eventos da transação:

```typescript
// Mensagem informativa
client.on("display", (message) => {
  console.log(`[TEF] ${message}`);
});

// Aguardando processamento
client.on("waiting", (message) => {
  console.log(`[AGUARDE] ${message}`);
});

// Coletar texto do usuário
client.on("collect:text", async ({ message, type, mask }) => {
  const value = await getUserInput(message);
  client.respond(value);
  // ou client.cancel() para cancelar
});

// Coletar opção (menu)
client.on("collect:options", async ({ message, options }) => {
  const index = await getUserChoice(options);
  client.respond(String(index));
});

// QR Code PIX
client.on("qrcode", ({ data }) => {
  displayQRCode(data);
});

// Comprovantes
client.on("print", ({ store, customer }) => {
  printReceipt(store, customer);
});

// Transação aprovada
client.on(
  "approved",
  ({
    sequenceId,
    authorizationCode,
    cardBrand,
    maskedPan,
    nsu,
    totalAmount,
    transactionDateTime,
    // ... outros campos disponíveis
  }) => {
    console.log(`Aprovado!`);
    console.log(`NSU: ${nsu}`);
    console.log(`Autorização: ${authorizationCode}`);
    console.log(`Valor: R$ ${(Number(totalAmount) / 100).toFixed(2)}`);
  },
);

// Transação negada
client.on("declined", (code, message) => {
  console.error(`Negado [${code}]: ${message}`);
});

// Erro
client.on("error", (code, message) => {
  console.error(`Erro [${code}]: ${message}`);
});

// Operação finalizada
client.on("finished", () => {
  console.log("Operação concluída");
});
```

## 🐛 Debug

Ative o modo debug para ver todas as chamadas DLL e respostas:

```typescript
// Habilitar debug
client.enableDebug();

// Realizar operações...
await client.payment.pix("10.00");

// Desabilitar debug
client.disableDebug();
```

**Output de debug:**

```
[15:23:45.123] 🐛 Debug mode enabled
[15:23:45.124] 📡 Configuring client { ip: '127.0.0.1', port: 60906, ... }
[15:23:46.001] 🚀 Starting TEF session
[15:23:46.002] 💰 Starting PIX { amount: '10.00' }
[15:23:46.003] 📞 Calling pix TEF { payload: { ... }, isNew: true }
[15:23:46.150] 📥 DLL Response { tef: { ... } }
[15:23:46.151] 📝 Emitting collect:text { message: 'Digite o CPF', ... }
[15:23:50.234] 📤 User responded 12345678901
[15:23:55.678] ✅ Emitting approved { sequenceId: '123', ... }
```

Veja a [documentação completa de debug](docs/DEBUG.md) para mais detalhes.

## 📚 API Reference

### Client

#### Métodos Estáticos

- `Client.instance(dllPath?: string): Client` - Cria nova instância

#### Métodos de Configuração

- `configure(ip: string, port: number, config: PdvConfig): void` - Configura cliente
- `enableDebug(): void` - Ativa logs de debug
- `disableDebug(): void` - Desativa logs de debug

#### Métodos de Controle

- `respond(value: string): void` - Responde à coleta
- `cancel(): void` - Cancela operação em andamento
- `unload(): void` - Descarrega DLL

### PaymentApi (client.payment)

- `pix(amount: string): Promise<void>` - Pagamento PIX
- `credit(amount: string): Promise<void>` - Crédito
- `debit(amount: string): Promise<void>` - Débito
- `voucher(amount: string): Promise<void>` - Voucher
- `fleet(amount: string): Promise<void>` - Frota
- `privateLabel(amount: string): Promise<void>` - Private Label
- `ask(amount: string): Promise<void>` - Pergunta tipo de cartão

### AdminApi (client.admin)

- `cancel(): Promise<void>` - Cancelamento
- `pending(): Promise<void>` - Pendências
- `reprint(): Promise<void>` - Reimpressão
- `ask(): Promise<void>` - Pergunta operação

### Eventos

| Evento            | Parâmetros                        | Descrição                   |
| ----------------- | --------------------------------- | --------------------------- |
| `display`         | `(message: string)`               | Mensagem informativa        |
| `waiting`         | `(message: string)`               | Aguardando processamento    |
| `collect:text`    | `(data: CollectTextEvent)`        | Coletar texto do usuário    |
| `collect:options` | `(data: CollectOptionsEvent)`     | Coletar opção (menu)        |
| `qrcode`          | `(data: QrCodeEvent)`             | QR Code PIX disponível      |
| `print`           | `(data: PrintEvent)`              | Comprovantes para impressão |
| `approved`        | `(data: ApprovedEvent)`           | Transação aprovada          |
| `declined`        | `(code: string, message: string)` | Transação negada            |
| `error`           | `(code: string, message: string)` | Erro na operação            |
| `finished`        | `()`                              | Operação finalizada         |
| `confirmed`       | `()`                              | Transação confirmada        |

### Tipos

#### PdvConfig

```typescript
interface PdvConfig {
  pinpadText: string; // Texto no pinpad
  version: string; // Versão da aplicação
  storeName: string; // Nome do estabelecimento
  storeCode: string; // Código da loja
  terminalId: string; // ID do terminal
}
```

#### ApprovedEvent

```typescript
interface ApprovedEvent {
  sequenceId: string;
  needsConfirmation: boolean;
  acquirerDocument?: string;
  authorizationCode?: string;
  transactionDateTime?: string;
  paymentMethod?: string;
  merchantId?: string;
  terminalId?: string;
  message?: string;
  cardBrand?: string;
  merchantName?: string;
  provider?: string;
  nsu?: string;
  maskedPan?: string;
  result?: string;
  service?: string;
  cardType?: string;
  transaction?: string;
  uniqueId?: string;
  totalAmount?: string;
}
```

Veja todos os tipos em [src/types.ts](src/types.ts).

## 💡 Exemplos

### Exemplo Completo: Sistema de Pagamento

```typescript
import * as readline from "node:readline";
import { Client } from "@stackflow-lab/elgin-sdk";

const client = Client.instance();

// Configurar
client.configure("127.0.0.1", 60906, {
  pinpadText: "LOJA EXEMPLO",
  version: "v1.0.0",
  storeName: "Loja Exemplo Ltda",
  storeCode: "001",
  terminalId: "PDV01",
});

// Interface readline para coletar dados
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Eventos
client.on("display", (msg) => console.log(`\n[TEF] ${msg}`));
client.on("waiting", (msg) => console.log(`[AGUARDE] ${msg}`));

client.on("collect:text", async ({ message, type, mask }) => {
  const value = await ask(`${message}: `);
  if (value) {
    client.respond(value);
  } else {
    client.cancel();
  }
});

client.on("collect:options", async ({ message, options }) => {
  console.log(`\n${message}`);
  options.forEach((opt, i) => console.log(`  [${i}] ${opt}`));
  const value = await ask("Escolha: ");
  client.respond(value);
});

client.on("qrcode", ({ data }) => {
  console.log("\n[QR CODE GERADO]");
  // Aqui você pode gerar e exibir o QR Code
});

client.on("print", ({ store, customer }) => {
  console.log("\n--- COMPROVANTE LOJA ---");
  console.log(store);
  console.log("\n--- COMPROVANTE CLIENTE ---");
  console.log(customer);
});

client.on(
  "approved",
  ({ sequenceId, authorizationCode, cardBrand, nsu, totalAmount }) => {
    console.log("\n✅ TRANSAÇÃO APROVADA");
    console.log(`Sequencial: ${sequenceId}`);
    console.log(`Autorização: ${authorizationCode}`);
    console.log(`Bandeira: ${cardBrand}`);
    console.log(`NSU: ${nsu}`);
    console.log(`Valor: R$ ${(Number(totalAmount) / 100).toFixed(2)}`);
  },
);

client.on("declined", (code, message) => {
  console.error(`\n❌ TRANSAÇÃO NEGADA [${code}]: ${message}`);
});

client.on("error", (code, message) => {
  console.error(`\n⚠️ ERRO [${code}]: ${message}`);
});

client.on("finished", async () => {
  console.log("\n✓ Operação finalizada\n");
  rl.close();
});

// Executar
async function main() {
  const value = await ask("Valor da venda: R$ ");
  await client.payment.credit(value);
}

main().catch(console.error);
```

Veja mais exemplos em [playground/](playground/).

## ⚠️ Tratamento de Erros

### Erros Comuns

**DLL não encontrada:**

```
Error: Could not find module 'C:\Elgin\TEF\E1_Tef01.dll'
```

**Solução:** Instale o Elgin TEF Client

**Servidor não disponível:**

```
Erro [-1]: Falha ao iniciar operação TEF
```

**Solução:** Verifique se o Elgin TEF Client está rodando

**Operação não implementada:**

```
Erro [-1]: Not implemented
```

**Solução:** Operação não disponível no provedor TEF atual

### Boas Práticas

```typescript
// Sempre trate erros
client.on("error", (code, message) => {
  logger.error(`TEF Error [${code}]: ${message}`);
  // Notificar usuário
  // Reverter operações se necessário
});

// Sempre trate negações
client.on("declined", (code, message) => {
  logger.warn(`TEF Declined [${code}]: ${message}`);
  // Informar usuário
  // Permitir nova tentativa
});

// Sempre finalize corretamente
process.on("SIGINT", () => {
  client.unload();
  process.exit(0);
});
```

## 📝 Licença

MIT © [stackflow-lab](https://github.com/stackflow-lab)

---

## 🔗 Links Úteis

- [Documentação Elgin TEF](https://elgindevelopercommunity.github.io/group__t2.html)
- [Changelog](CHANGELOG.md)
- [Guia de Debug](docs/DEBUG.md)
- [API Detalhada](docs/NEW_API.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) primeiro.

## 💬 Suporte

- 📧 Email: suporte@stackflow-lab.com
- 🐛 Issues: [GitHub Issues](https://github.com/stackflow-lab/elgin-sdk/issues)
- 📖 Docs: [Documentação Completa](https://github.com/stackflow-lab/elgin-sdk/tree/main/docs)

---

**Desenvolvido com ❤️ pela [stackflow-lab](https://stackflow-lab.com)**
