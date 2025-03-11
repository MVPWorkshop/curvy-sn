# Curvy Stealth Address Protocol on Starknet

![](./docs/assets/demo-banner.png)

## Overview

This repository contains implementation code for the Curvy Protocol.

The original paper: **Elliptic Curve Pairing Stealth Address Protocols**
Marija Mikic, Mihajlo Srbakoski https://arxiv.org/abs/2312.12131

## Project structure

The project's dir. structure is as following:

- `./docs`: General documentation, with detailed results that were achieved
- `./core`: Off-chain protocol code part used by the sender and recipient
- `./sc`: On-chain contracts (used for sender <-> recipient "communication")
