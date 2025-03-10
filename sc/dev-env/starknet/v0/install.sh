asdf plugin add scarb

asdf install scarb latest

asdf plugin add starknet-foundry

asdf install starknet-foundry latest

asdf global starknet-foundry 0.38.0
asdf global scarb 2.10.1

curl -L https://raw.githubusercontent.com/software-mansion/universal-sierra-compiler/master/scripts/install.sh | sh

export UNIVERSAL_SIERRA_COMPILER=~/.local/bin/universal-sierra-compiler