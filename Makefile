# disable built-in rules
.SUFFIXES:

all: dist/index.mjs

ci: test
	@git diff --exit-code HEAD # error on unexpected changes, eg. out of date package-lock.json

test: all
	cd ./test && $(MAKE)

clean:
	rm -rf ./dist/
	rm -rf ./build/
	rm -rf ./node_modules/
	rm -rf ./test/node_modules/

WASI_SDK_PATH := ./deps/wasi-sdk-13.0
WASI_SYSROOT  := $(abspath ${WASI_SDK_PATH}/share/wasi-sysroot)

export CC      := $(abspath ${WASI_SDK_PATH}/bin/clang) -target wasm32-wasi --sysroot=${WASI_SYSROOT}
export CFLAGS  := -Oz -flto -I ./deps/rapidjson/include -I./deps/littlefs -fno-exceptions -include ./src/config.h
export LDFLAGS := -lstdc++ -flto -Wl,--allow-undefined

MEMFS_SRC := ./deps/littlefs/lfs.c ./deps/littlefs/lfs_util.c ./deps/littlefs/bd/lfs_rambd.c ./src/memfs.cc
dist/memfs.wasm: $(MEMFS_SRC) $(WASI_SDK_PATH) ./src/config.h
	mkdir -p $(@D)
	$(CC) $(CFLAGS) $(LDFLAGS) $(MEMFS_SRC) -o $@

node_modules: ./package.json ./package-lock.json
	npm install --no-audit --no-optional --no-fund --no-progress --quiet
	touch $@

dist/index.mjs: $(wildcard ./src/**) node_modules dist/memfs.wasm
	sed -i 's/^class Asyncify/export class Asyncify/g' ./deps/asyncify/asyncify.mjs
	$(shell npm bin)/tsc -p ./tsconfig.json
	$(shell npm bin)/esbuild --bundle ./src/index.ts --outfile=$@ --format=esm --log-level=warning --external:*.wasm

$(WASI_SDK_PATH):
	mkdir -p $(@D)
	curl -sLo wasi-sdk.tar.gz https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-13/wasi-sdk-13.0-linux.tar.gz
	echo 'aea04267dd864a2f41e21f6cc43591b73dd8901e1ad4e87decf8c4b5905c73cf wasi-sdk.tar.gz' | sha256sum -c
	tar zxf wasi-sdk.tar.gz --touch -C deps
	rm wasi-sdk.tar.gz
