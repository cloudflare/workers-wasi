FROM rust:slim-buster

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    build-essential ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-wasi

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_17.x  | bash -
RUN apt-get -qq -y install nodejs

WORKDIR /workers-wasi

CMD ["make", "-j", "test"]