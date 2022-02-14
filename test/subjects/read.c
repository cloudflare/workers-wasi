#include "assert.h"
#include "stdint.h"
#include "stdio.h"
#include "string.h"

#define CHUNK_SIZE 4096
#define ITERATIONS 1024

int main() {
  const char *chunk_buf[CHUNK_SIZE] = {0};

  for (int iterations = 0; iterations < ITERATIONS; iterations++) {
    fread(chunk_buf, 1, CHUNK_SIZE, stdin);
  }
}
