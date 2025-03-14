# Curvy Smart Contracts

This is a standard [`sn-foundry`](https://foundry-rs.github.io/starknet-foundry/) project with additional functionality scripts.

## Deployed Contracts

-   `CurvyMetaRegistryV0`: @ []()
-   `CurvyAnnouncerV0`: @ []()

## Developer Overview

The directory structure is as:

-   `./dev-env` - Docker development setup needed to enable development on Mac
    -   Start the docker container using: `./dev-env/starknet/v0/run.sh .` and attach VS Code to it
-   `./packages` - Individual smart contracts are separated using package system.
    -   `./account` - Stealth Account implementation used by the protocol (`CurvyAccountV0`)
    -   `./announcer` - Announcer (`CurvyAnnouncerV0`) contract that is used to broadcast transfers by the senders
    -   `./meta_registry` - Registry of Meta addresses for the recipients (`CurvyMetaRegistryV0`)
-   `./script` - Utility scripts used to declare and deploy the protocol
-   `./tests` - Test suite for the protocol's components
