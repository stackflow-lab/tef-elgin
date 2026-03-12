# CI/CD Setup

Este projeto utiliza GitHub Actions para automação de CI/CD com releases semânticos.

## Workflows

### CI (Continuous Integration)

**Arquivo:** `.github/workflows/ci.yml`

Executa em:

- Push para `main` ou `develop`
- Pull Requests para `main` ou `develop`

Etapas:

1. ✅ Checkout do código
2. ✅ Setup do Node.js 22.x
3. ✅ Instalação de dependências
4. ✅ Build do projeto
5. ✅ Execução dos testes
6. ✅ Upload dos artifacts de build

### Release (Continuous Deployment)

**Arquivo:** `.github/workflows/release.yml`

Executa em:

- Push para `main`

Etapas:

1. ✅ Checkout do código
2. ✅ Setup do Node.js 22.x
3. ✅ Instalação de dependências
4. ✅ Build do projeto
5. ✅ Execução dos testes
6. ✅ Análise de commits semânticos
7. ✅ Geração automática de tag e versão
8. ✅ Atualização do CHANGELOG
9. ✅ Publicação no NPM com **provenance** (verificação de autenticidade)
10. ✅ Criação de release no GitHub

## Autenticação NPM

O projeto usa **Trusted Publishing** com provenance para publicação segura:

- **Arquivo**: `.npmrc` (versionado no repositório)
- **Autenticação**: Via variável de ambiente `NODE_AUTH_TOKEN`
- **Provenance**: Habilitado via `NPM_CONFIG_PROVENANCE=true`
- **Segurança**: Elimina tokens de longa duração commitados no código

O arquivo `.npmrc` contém:

```
//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
```

Isso garante que:

- ✅ Pacotes publicados são verificáveis e rastreáveis
- ✅ Provenance statements são gerados automaticamente
- ✅ Maior segurança usando tokens granulares do NPM

## Commits Semânticos

O projeto usa **Conventional Commits** para gerar versões automaticamente:

### Tipos de Commit

| Tipo              | Versão    | Descrição                 | Exemplo                                    |
| ----------------- | --------- | ------------------------- | ------------------------------------------ |
| `feat`            | **MINOR** | Nova funcionalidade       | `feat: adiciona suporte a PIX`             |
| `fix`             | **PATCH** | Correção de bug           | `fix: corrige erro no processamento`       |
| `perf`            | **PATCH** | Melhoria de performance   | `perf: otimiza carregamento da DLL`        |
| `refactor`        | **PATCH** | Refatoração de código     | `refactor: reorganiza estrutura de pastas` |
| `revert`          | **PATCH** | Reversão de commit        | `revert: desfaz commit abc123`             |
| `BREAKING CHANGE` | **MAJOR** | Quebra de compatibilidade | Ver abaixo                                 |

### Tipos que NÃO geram release:

- `docs`: Documentação
- `style`: Formatação de código
- `test`: Testes
- `build`: Sistema de build
- `ci`: Configuração de CI
- `chore`: Tarefas gerais

### Breaking Changes (Major Version)

Para indicar uma mudança que quebra compatibilidade:

```bash
# Opção 1: No rodapé do commit
git commit -m "feat: nova API de pagamento

BREAKING CHANGE: A função processPayment agora retorna Promise"

# Opção 2: Com ! após o tipo
git commit -m "feat!: nova API de pagamento"
```

### Exemplos de Commits

```bash
# Feature (0.1.0 -> 0.2.0)
git commit -m "feat: adiciona modo de débito automático"

# Bug fix (0.1.0 -> 0.1.1)
git commit -m "fix: corrige timeout na comunicação com pinpad"

# Performance (0.1.0 -> 0.1.1)
git commit -m "perf: melhora carregamento inicial da biblioteca"

# Breaking change (0.1.0 -> 1.0.0)
git commit -m "feat!: altera assinatura do método collect"

# Com escopo
git commit -m "feat(payment): adiciona suporte a voucher"
git commit -m "fix(client): corrige inicialização do worker"

# Múltiplas linhas
git commit -m "feat: implementa retry automático

- Adiciona retry em caso de falha de comunicação
- Configurável via opções do cliente
- Timeout padrão de 3 tentativas"
```

## Configuração Necessária

### 1. NPM Token (Granular Access Token)

O projeto usa **Trusted Publishing** com provenance para maior segurança na publicação.

Crie um **Granular Access Token** no NPM:

1. Acesse https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Clique em "Generate New Token" > "Granular Access Token"
3. Configure:
   - **Token Name**: `GitHub Actions - Elgin SDK`
   - **Expiration**: Escolha um período (recomendado: 1 ano)
   - **Packages and scopes**:
     - Selecione "Read and write"
     - Escolha o pacote `@stackflowlab/elgin-sdk`
   - **Organizations**: Selecione sua organização se aplicável
4. Copie o token (começa com `npm_...`)

Adicione como secret no GitHub:

1. Vá em Settings > Secrets and variables > Actions
2. Clique em "New repository secret"
3. Nome: `NPM_TOKEN`
4. Valor: Cole o token do NPM

> **Nota**: O workflow usa `NPM_CONFIG_PROVENANCE=true` para gerar provenance statements automaticamente, garantindo autenticidade e rastreabilidade dos pacotes publicados.

### 2. Permissões do GitHub Token

O `GITHUB_TOKEN` é gerado automaticamente, mas certifique-se de que o repositório tem as permissões:

1. Settings > Actions > General
2. Em "Workflow permissions", selecione:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Fluxo de Trabalho

### Desenvolvimento

```bash
# Crie uma branch para sua feature
git checkout -b feat/nova-funcionalidade

# Faça commits semânticos
git commit -m "feat: adiciona nova funcionalidade"

# Envie a branch
git push origin feat/nova-funcionalidade

# Abra um Pull Request para develop ou main
# O workflow de CI será executado automaticamente
```

### Release

```bash
# Após o merge do PR para main
git checkout main
git pull

# O workflow de Release será executado automaticamente:
# 1. Roda build e testes
# 2. Analisa os commits desde a última versão
# 3. Determina o tipo de versão (major/minor/patch)
# 4. Atualiza package.json e CHANGELOG.md
# 5. Cria tag e release no GitHub
# 6. Publica no NPM
```

## Troubleshooting

### Release não foi criado

- Verifique se há commits com tipos válidos desde a última release
- Commits `docs`, `test`, `ci`, `chore` não geram releases
- Verifique os logs no Actions

### Falha na publicação no NPM

- Verifique se o `NPM_TOKEN` está configurado corretamente
- Certifique-se de que o token tem permissões de publicação
- Verifique se o nome do pacote está disponível no NPM

### Versão incorreta gerada

- Revise os commits - eles devem seguir o padrão Conventional Commits
- Para major: use `BREAKING CHANGE:` no rodapé ou `!` após o tipo
- Para minor: use `feat:`
- Para patch: use `fix:`, `perf:`, `refactor:`

## Versioning

O projeto segue [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): Novas funcionalidades (backward compatible)
- **PATCH** (0.0.X): Bug fixes e melhorias
