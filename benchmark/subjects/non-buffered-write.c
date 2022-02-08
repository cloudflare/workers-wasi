#include "assert.h"
#include "stdint.h"
#include "stdio.h"
#include "string.h"

#define BYTES_TO_WRITE 8 * 1024 * 1024
#define CHUNK_SIZE 16
#define CHUNKS BYTES_TO_WRITE / CHUNK_SIZE

static const char *chunkBuf[CHUNK_SIZE] = {0};

int main() {
  for (int i = 0; i < CHUNKS; i++) {
    int written = fwrite(chunkBuf, 1, CHUNK_SIZE, stdout);
    fflush(stdout);
  }
}