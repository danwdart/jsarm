const MODES = {
        0b10000: 'usr',
        0b10001: 'fiq',
        0b10010: 'irq',
        0b10011: 'svc',
        0b10111: 'abt',
        0b11011: 'und',
        0b11111: 'sys'
    },
    DATA = [
        'AND',
        'EOR',
        'SUB',
        'RSB',
        'ADD',
        'ADC',
        'SBC',
        'RSC',
        'TST',
        'TEQ',
        'CMP',
        'CMN',
        'ORR',
        'MOV',
        'BIC',
        'MVN'
    ]
    CPSR = {
        M: 0,
        T: (1<<5),
        F: (1<<6),
        I: (1<<7),
        A: (1<<8),
        E: (1<<9),
        IT: (1<<10),
        IT2: (1<<25),
        GE: (1<<16),
        DNM: (1<<20),
        J: (1<<24),
        Q: (1<<27),
        V: (1<<28),
        C: (1<<29),
        Z: (1<<30),
        N: (1<<31)
    },
    COND = [
        'EQ',
        'NE',
        'HS',
        'LO',
        'MI',
        'PL',
        'VS',
        'VC',
        'HI',
        'LS',
        'GE',
        'LT',
        'GT',
        'LE',
        'AL',
        'NV'
    ],
    INSTRUCTIONS = {
        'DATA': [(1<<27)+(1<<26), 0],
        'MUL': [(1<<27)+(1<<26)+(1<<25)+(1<<24)+(1<<23)+(1<<22)+(1<<6)+(1<<5), (1<<7)+(1<<4)],
        'LMUL': [(1<<27)+(1<<26)+(1<<25)+(1<<24)+(1<<6)+(1<<5), (1<<23)+(1<<7)+(1<<4)],
        'SWAP': [(1<<27)+(1<<26)+(1<<25)+(1<<23)+(1<<21)+(1<<20)+(1<<11)+(1<<10)+(1<<9)+(1<<8)+(1<<6)+(1<<5), (1<<7)+(1<<4)],
        'LSBW': [(1<<27), (1<<26)+(1<<25)],
        'LSM': [(1<<27), (1<<26)+(1<<25)],
        'HWTIO': [(1<<27)+(1<<26)+(1<<25), (1<<22)+(1<<7)+(1<<4)],
        'HWTRO': [(1<<27)+(1<<26)+(1<<25)+(1<<22)+(1<<11)+(1<<10)+(1<<9)+(1<<8), (1<<7)+(1<<4)],
        'B': [(1<<26), (1<<27)+(1<<25)],
        'BX': [(1<<27)+(1<<26)+(1<<25)+(1<<23)+(1<<22)+(1<<20)+(1<<7)+(1<<6)+(1<<5), (1<<24)+(1<<21)+(1<<19)+(1<<18)+(1<<17)+(1<<16)+(1<<15)+(1<<14)+(1<<13)+(1<<12)+(1<<11)+(1<<10)+(1<<9)+(1<<8)+(1<<4)],
        'CPDX': [(1<<25), (1<<27)+(1<<26)],
        'CPDO': [(1<<24)+(1<<4), (1<<27)+(1<<26)+(1<<25)],
        'CPRX': [(1<<24), (1<<27)+(1<<26)+(1<<25)+(1<<4)],
        'INT': [0, (1<<27)+(1<<26)+(1<<25)+(1<<24)]
    };

class CPU
{
    constructor() {
        this.regs = new Uint32Array(37);
        this.views = new Map();

        defineDVs(this, this.regs, {
            'r0': 0,
            'r1': 1,
            'r2': 2,
            'r3': 3,
            'r4': 4,
            'r5': 5,
            'r6': 6,
            'r7': 7,
            'r8': 8,
            'r8_fiq': 9,
            'r9': 10,
            'r9_fiq': 11,
            'r10': 12,
            'r10_fiq': 13,
            'r11': 14,
            'r11_fiq': 15,
            'r12': 16,
            'r12_fiq': 17,
            'r13': 18,
            'sp': 18,
            'r13_svc': 19,
            'r13_abt': 20,
            'r13_und': 21,
            'r13_irq': 22,
            'r13_fiq': 23,
            'r14': 24,
            'lr': 24,
            'r14_svc': 25,
            'r14_abt': 26,
            'r14_und': 27,
            'r14_irq': 28,
            'r14_fiq': 29,
            'r15': 30,
            'pc': 30,
            'cpsr': 31,
            'spsr_svc': 32,
            'spsr_abt': 33,
            'spsr_und': 34,
            'spsr_irq': 35,
            'spsr_fiq': 36
        });
    }

    runProgram(program) {
        let dvInstruction = new DataView(program),
            instruction;

        for (let i = 0; i <= 256; i+= Uint32Array.BYTES_PER_ELEMENT) {
            instruction = dvInstruction.getUint32(i * Uint32Array.BYTES_PER_ELEMENT, true);

            debug(instruction.toString(2));

            let type = 'invalid';

            for (let ins in INSTRUCTIONS) {
                //debug('checking for '+ins)
                let bm0 = INSTRUCTIONS[ins][0],
                    bm1 = INSTRUCTIONS[ins][1],
                    onesmatch = bm1 == (instruction & bm1),
                    zeroesmatch = bm0 == (~instruction & bm0);
                //debug('Ones match: '+bm1.toString(2)+' == ' + instruction.toString(2) + ' & ' + bm1.toString(2) + ' : ' + onesmatch.toString());
                //debug('zeroes match: '+(bm0>>>0).toString(2)+' == ' + (~instruction>>>0).toString(2) + ' & ' + (bm0>>>0).toString(2) + ' : ' + zeroesmatch.toString());

                if (onesmatch && zeroesmatch) {
                    type = ins;
                    break;
                }
            }

            let cond = COND[instruction >> 28];

            if ('undefined' == typeof this[cond])
                throw new Error(cond + ' is an unimplemented condition');

            if ('undefined' == typeof this[type])
                throw new Error(type + ' is an unimplemented instruction type');

            //if (this[cond]())
                this[type](instruction);

            debug(type + ' ' + cond);
        }
    }

    MI() {
        return this.cpsr & CPSR.N;
    }

    EQ() {
        return this.cpsr & CPSR.Z;
    }

    EOR(i, s, Rn, Rd, op) {
        debug('EOR i='+i+' s='+s+' Rn='+Rn.toString(2)+' Rd='+Rd.toString(2)+' op='+op.toString(2));
    }

    AND(i, s, Rn, Rd, op) {
        debug('AND i='+i+' s='+s+' Rn='+Rn.toString(2)+' Rd='+Rd.toString(2)+' op='+op.toString(2));        
    }

    DATA(instruction) {
        let opcodeid = (instruction >> 21) & 0b1111,
            fn = DATA[opcodeid];

        if ('undefined' === typeof this[fn])
            throw new Error(DATA[opcodeid] + ' is an unimplemented data instruction.');

        debug(fn);

        let i = !!(instruction & (1<<25)),
            s = !!(instruction & (1<<20)),
            Rn = (instruction >> 16) & 0b1111,
            Rd = (instruction >> 12) & 0b1111,
            op = (instruction & 0x111111111111);

        return this[fn](i, s, Rn, Rd, op);
    }

    LSBW(instruction) {
        debug('LSBW');
    }
}
