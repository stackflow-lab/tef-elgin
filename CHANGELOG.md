## [1.0.2](https://github.com/stackflow-lab/tef-elgin/compare/v1.0.1...v1.0.2) (2026-03-12)

### Bug Fixes

- restaura provenance (requer tornar repositório público no GitHub) ([ce51d9d](https://github.com/stackflow-lab/tef-elgin/commit/ce51d9dc7d2c7d4253b88f105af8e9d33ff30175))
- update repository references and improve documentation consistency ([24e94d0](https://github.com/stackflow-lab/tef-elgin/commit/24e94d0d66ec8d79a8f9c64b2f578a4f974eeb4e))

## [1.0.1](https://github.com/stackflow-lab/tef-elgin/compare/v1.0.0...v1.0.1) (2026-03-12)

### Bug Fixes

- adiciona publishConfig com access public para permitir publicação com provenance ([f5d1ae1](https://github.com/stackflow-lab/tef-elgin/commit/f5d1ae146370a84b421e98fd704061aa9c269785))

## 1.0.0 (2026-03-12)

### Features

- enhance CI/CD workflows with NPM provenance and security improvements ([3a9b8fb](https://github.com/stackflow-lab/tef-elgin/commit/3a9b8fbe05a12cdb4194dc240d7bf709062b5d71))
- implement CI/CD workflows with GitHub Actions and semantic release ([c8fb71d](https://github.com/stackflow-lab/tef-elgin/commit/c8fb71d0526451e5fb21f28d6b448e3da13c040c))
- implement TEF client with payment and admin APIs ([e0875e9](https://github.com/stackflow-lab/tef-elgin/commit/e0875e96a3a6987b3cc2b7c3db565d4c939802d1))

### Bug Fixes

- corrige URLs do repositório no package.json ([c086e6c](https://github.com/stackflow-lab/tef-elgin/commit/c086e6c5ab1b06f0a8fb7a0172bda5b264bed33d))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-03-11

### Added

- Initial release
- Event-driven API for TEF operations
- Payment methods: PIX, Credit, Debit, Voucher, Fleet, Private Label
- Administrative operations: Cancel, Pending, Reprint
- TypeScript support with full type definitions
- Built-in debug logging system
- Comprehensive error handling
- Integration with Elgin E1_Tef01.dll
- Complete test suite with 100% coverage
- English public API with internal Portuguese mapping

### Features

- `Client.instance()` - Static factory method
- `client.payment.*` - Intuitive payment API
  - `pix(amount)` - PIX payments
  - `credit(amount)` - Credit card
  - `debit(amount)` - Debit card
  - `voucher(amount)` - Voucher payments
  - `fleet(amount)` - Fleet card
  - `privateLabel(amount)` - Private label card
  - `ask(amount)` - Ask card type
- `client.admin.*` - Administrative operations API
  - `cancel()` - Cancel transaction
  - `pending()` - Check pending transactions
  - `reprint()` - Reprint receipt
  - `ask()` - Ask operation type
- `client.enableDebug()` - Enable detailed logging
- `client.disableDebug()` - Disable logging
- Event system with detailed transaction data
  - `approved` - Transaction approved with full details
  - `declined` - Transaction declined
  - `error` - Error occurred
  - `collect:text` - Collect user input
  - `collect:options` - Collect user choice
  - `qrcode` - QR Code data available
  - `print` - Receipt data available
  - `display` - Display message
  - `waiting` - Waiting message
  - `finished` - Operation finished
  - `confirmed` - Transaction confirmed

### Documentation

- Comprehensive README with examples
- API reference documentation
- Debug guide
- TypeScript type definitions
- Example playground applications

[Unreleased]: https://github.com/stackflow-lab/tef-elgin/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/stackflow-lab/tef-elgin/releases/tag/v0.0.1
