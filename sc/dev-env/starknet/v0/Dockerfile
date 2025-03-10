FROM --platform=linux/arm64 ubuntu:22.04

# Replace shell with bash
# RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Install dependencies
RUN apt-get update && apt-get -y install hwloc jq pkg-config bzr ocl-icd-opencl-dev curl build-essential

ENV NODE_VERSION 20

# Install nvm with node, npm and yarn
RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm i -g yarn

ENV NODE_PATH ~/.nvm/$NODE_VERSION/lib/node_modules
ENV PATH      ~/.nvm/$NODE_VERSION/bin:$PATH

# Install rust
# RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -y | sh 
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# RUN echo '. $HOME/.cargo/env' >> $HOME/.bashrc
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Git
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC  apt install git-all -y

# Install foundry
RUN curl -L https://foundry.paradigm.xyz | bash \
    && . /root/.bashrc && foundryup

# Root dir
RUN mkdir -p /starknet-dev-root/
WORKDIR /starknet-dev-root/

# Install Dojo Engine
RUN curl -L https://install.dojoengine.org | bash \
    && . /root/.bashrc && dojoup

# Helper scripts
COPY ./_/*.sh /go/_scripts/
RUN chmod +x /go/_scripts/*.sh

# Install asdf
RUN git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0 \
    && echo 'source $HOME/.asdf/asdf.sh' >> $HOME/.bashrc \
    && echo 'source $HOME/.asdf/completions/asdf.bash' >> $HOME/.bashrc

RUN chmod +x $HOME/.asdf/asdf.sh \
    && mkdir $HOME/.asdf-dir && export ASDF_DIR=$HOME/.asdf-dir \
    && $HOME/.asdf/asdf.sh plugin add scarb \
    && $HOME/.asdf/asdf.sh install scarb latest \
    && $HOME/.asdf/asdf.sh plugin add starknet-foundry \
    && $HOME/.asdf/asdf.sh install starknet-foundry latest


