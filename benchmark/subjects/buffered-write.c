#include "assert.h"
#include "stdint.h"
#include "stdio.h"
#include "string.h"

#define BYTES_TO_WRITE 100 * 1024 * 1024
#define CHUNK_SIZE 16
#define CHUNKS BYTES_TO_WRITE / CHUNK_SIZE
#define BUF_SIZE 8 * 1024

static const char *chunkBuf[CHUNK_SIZE] = {0};
static char buffer[BUF_SIZE] = {0};
static size_t offset = 0;

int main() {
  assert(BUF_SIZE % CHUNK_SIZE == 0);

  for (int i = 0; i < CHUNKS; i++) {
    memcpy(buffer + offset, chunkBuf, CHUNK_SIZE);
    offset += CHUNK_SIZE;

    if (offset == BUF_SIZE) {
      int written = fwrite(buffer, 1, BUF_SIZE, stdout);
      fflush(stdout);
      offset = 0;
    }
  }
}