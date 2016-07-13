PREFIX=arm-none-eabi-
AS=as
CC=gcc
LD=ld

all: ld

clean:
	rm *.o kernel

start:
	$(PREFIX)$(AS) -o start.o start.s

cc:
	$(PREFIX)$(CC) -Wall -Wextra -Werror -nostdlib -nostartfiles -ffreestanding -std=gnu99 -c main.c

ld: start cc
	$(PREFIX)$(LD) -T link.ld -o kernel start.o main.o

qemu:
	qemu-system-arm -M integratorcp -kernel kernel -m 128 -serial stdio
