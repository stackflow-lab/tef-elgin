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

[Unreleased]: https://github.com/stackflowlab/elgin-sdk/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/stackflowlab/elgin-sdk/releases/tag/v0.0.1
