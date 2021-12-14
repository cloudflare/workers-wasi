FROM debian:buster

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    ca-certificates curl file gnupg \
    build-essential \
    autoconf automake autotools-dev libtool xutils-dev && \
    rm -rf /var/lib/apt/lists/*

ENV SSL_VERSION=1.0.2u

RUN curl https://www.openssl.org/source/openssl-$SSL_VERSION.tar.gz -O && \
    tar -xzf openssl-$SSL_VERSION.tar.gz && \
    cd openssl-$SSL_VERSION && ./config && make depend && make install && \
    cd .. && rm -rf openssl-$SSL_VERSION*

ENV OPENSSL_LIB_DIR=/usr/local/ssl/lib \
    OPENSSL_INCLUDE_DIR=/usr/local/ssl/include \
    OPENSSL_STATIC=1

# install Rust and wasm32-wasi target
RUN curl https://sh.rustup.rs -sSf | \
    sh -s -- --default-toolchain stable -y

ENV PATH=/root/.cargo/bin:$PATH

RUN rustup target add wasm32-wasi

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_17.x  | bash -
RUN apt-get -y install nodejs

WORKDIR /workers-wasi

CMD ["make", "-j", "test"]