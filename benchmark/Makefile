default: run-benchmarks

OUTPUT_DIR := ../build/benchmark

WASM_OPT   := ../build/binaryen/bin/wasm-opt
WASI_SDK_PATH := ../deps/wasi-sdk-13.0
WASI_SYSROOT  := $(abspath ${WASI_SDK_PATH}/share/wasi-sysroot)

BUNDLE := $(OUTPUT_DIR)/index.mjs
MEMFS_SRC  := ../dist/memfs.wasm
MEMFS_DST  := $(OUTPUT_DIR)/memfs.wasm

node_modules: ./package.json ./package-lock.json ../package.json
	npm install --no-audit --no-fund --no-progress --quiet
	touch $@

$(OUTPUT_DIR)/wasm-table.ts:
	mkdir -p $(@D)
	node ./generate-wasm-table.mjs > $@

$(MEMFS_DST): $(MEMFS_SRC)
	mkdir -p $(@D)
	cp $< $@

$(BUNDLE): $(wildcard ../dist/**) $(wildcard ./driver/**) $(MEMFS_DST) $(OUTPUT_DIR)/wasm-table.ts node_modules
	mkdir -p $(@D)
	node build.mjs

run-benchmarks: $(BUNDLE) subjects/binaries/non-buffered-write.wasm subjects/binaries/buffered-write.wasm $(OUTPUT_DIR)/wasm-table.ts
	NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest --detectOpenHandles

export CC      := $(abspath ${WASI_SDK_PATH}/bin/clang) -target wasm32-wasi --sysroot=${WASI_SYSROOT}
export CFLAGS  := -Oz -flto
export LDFLAGS := -flto -Wl,--allow-undefined

$(WASI_SDK_PATH):
	mkdir -p $(@D)
	curl -sLo wasi-sdk.tar.gz https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-13/wasi-sdk-13.0-linux.tar.gz
	echo 'aea04267dd864a2f41e21f6cc43591b73dd8901e1ad4e87decf8c4b5905c73cf wasi-sdk.tar.gz' | sha256sum -c
	tar zxf wasi-sdk.tar.gz --touch -C deps
	rm wasi-sdk.tar.gz

$(WASM_OPT):
	@$(call color,"downloading binaryen")
	mkdir -p $(@D)
	curl -Lo binaryen.tar.gz https://github.com/WebAssembly/binaryen/releases/download/version_100/binaryen-version_100-x86_64-linux.tar.gz
	echo '9057c8f3f0bbfec47a95985c8f0faad8cc2aa3932e94a7d6b705e245ed140e19  binaryen.tar.gz' | sha256sum -c
	tar zxvf binaryen.tar.gz --strip-components=1 --touch -C ../build/binaryen
	rm binaryen.tar.gz

subjects/binaries/%.wasm: $(WASI_SDK_PATH) $(WASM_OPT)
	mkdir -p subjects/binaries/
	$(CC) $(CFLAGS) $(LDFLAGS) subjects/$*.c -o subjects/binaries/$*.wasm
	$(WASM_OPT) -g -O --asyncify subjects/binaries/$*.wasm -o subjects/binaries/$*.asyncify.wasm 
