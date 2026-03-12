# Guia de Contribuição

Obrigado por considerar contribuir com o Elgin TEF SDK! 🎉

## Como Contribuir

### Reportar Bugs

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/stackflowlab/elgin-sdk/issues)
2. Crie uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Versão do SDK e Node.js
   - Logs/screenshots se aplicável

### Sugerir Melhorias

1. Abra uma issue descrevendo:
   - O que você gostaria de adicionar/mudar
   - Por que isso seria útil
   - Como deveria funcionar

### Pull Requests

1. **Fork** o repositório
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/elgin-sdk.git`
3. **Crie uma branch**: `git checkout -b feature/minha-feature`
4. **Faça suas alterações**
5. **Adicione testes** para novas funcionalidades
6. **Execute os testes**: `npm test`
7. **Verifique o build**: `npm run build`
8. **Commit suas mudanças**: `git commit -m "feat: adiciona nova funcionalidade"`
9. **Push para o GitHub**: `git push origin feature/minha-feature`
10. **Abra um Pull Request**

## Desenvolvimento

### Setup

```bash
# Clonar repositório
git clone https://github.com/stackflowlab/elgin-sdk.git
cd elgin-sdk

# Instalar dependências
npm install

# Rodar testes
npm test

# Build
npm run build

# Playground
npm run playground
```

### Estrutura do Projeto

```
elgin-sdk/
├── src/
│   ├── index.ts           # Exports principais
│   ├── tef-client.ts      # Cliente principal
│   ├── payment-api.ts     # API de pagamentos
│   ├── admin-api.ts       # API administrativa
│   ├── loader.ts          # Carregador da DLL
│   ├── types.ts           # Definições de tipos
│   └── __tests__/         # Testes unitários
├── playground/            # Exemplos práticos
├── docs/                  # Documentação
└── dist/                  # Build output (gerado)
```

### Convenções de Código

- **TypeScript**: Todo código deve ser tipado
- **ESLint**: Seguir as regras do projeto
- **Commits**: Usar [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` - Nova funcionalidade
  - `fix:` - Correção de bug
  - `docs:` - Documentação
  - `test:` - Testes
  - `refactor:` - Refatoração
  - `chore:` - Tarefas de manutenção

### Testes

- Todos os PRs devem incluir testes
- Manter 100% de cobertura quando possível
- Executar `npm test` antes de commitar

```bash
# Testes unitários
npm test

# Testes em watch mode
npm run test:watch
```

### Debug

Use o modo debug para desenvolvimento:

```typescript
client.enableDebug();
```

Ou rode o exemplo de debug:

```bash
npm run playground:debug
```

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite feedback construtivo
- Foque no que é melhor para a comunidade

## Dúvidas?

Abra uma issue ou entre em contato em suporte@stackflowlab.com

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT.
