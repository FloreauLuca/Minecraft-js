const X_NOISE_GEN = 31;
const Y_NOISE_GEN = 211;
const SEED_NOISE_GEN = 1009;

export default class Hash {
    static hash(a) {
        a = (a ^ 61) ^ (a >> 16);
        a = a + (a << 3);
        a = a ^ (a >> 4);
        a = a * 0x27d4eb2d;
        a = a ^ (a >> 15);
        return a;
    }

    static hash_2d(x, y, seed) {
        let n = (
            X_NOISE_GEN * x
            + Y_NOISE_GEN * y
            + SEED_NOISE_GEN * seed);
            n = n % 2147483647;
        return Hash.hash(n);
    }
}