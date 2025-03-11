# Curvy Stealth Address Protocol on Starknet

![](./docs/assets/demo-banner.png)

## Overview

This repository contains implementation code for the Curvy Stealth Address Protocol on Starknet. For the initial Ethereum implementation see: [**ECPDKSAP**](https://github.com/0x3327/ecpdksap).

Implementation follows the original paper: [**Elliptic Curve Pairing Stealth Address Protocols**](https://arxiv.org/abs/2312.12131)
Marija Mikic, Mihajlo Srbakoski.

The Post-Quantum version of the protocol (detailed in the [**Post-Quantum Stealth Address Protocols**](https://eprint.iacr.org/2025/112) Marija Mikic, Mihajlo Srbakoski, Strahinja Praska) is not yet supported.

## [Developer] Getting Started

### Project setup overview

The project's functionality is dispersed across different sections. Each has its own following documentation, and is orchestrated as:

- `./docs`: General protocol documentation, with detailed results that were achieved
- `./core`: Off-chain protocol code part used by the sender and recipient
- `./sc`: On-chain contracts (used for sender <-> recipient communication)
- `./backend`: Indexer and other Backend components used by the Frontend
