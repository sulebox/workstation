import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../assets/js/expr.js';
import '../assets/js/circuit.js';

const C = globalThis.SWB.circuit;

test('抵抗値の読み取り', () => {
    assert.equal(C.parseR('4.7k'), 4700);
    assert.equal(C.parseR('4k7'), 4700);
    assert.equal(C.parseR('2R2'), 2.2);
    assert.equal(C.parseR('1M'), 1e6);
    assert.equal(C.parseR('1M5'), 1.5e6);
    assert.equal(C.parseR('220'), 220);
    assert.equal(C.parseR('220Ω'), 220);
    assert.equal(C.parseR('10 kohm'), 10000);
    assert.equal(C.parseR('１００ｋ'), 100000);
    assert.ok(Number.isNaN(C.parseR('abc')));
});

test('表示', () => {
    assert.equal(C.formatR(4700), '4.7 kΩ');
    assert.equal(C.formatR(1e6), '1 MΩ');
    assert.equal(C.formatR(220), '220 Ω');
    assert.equal(C.formatR(4700, true), '4.7k');
    assert.equal(C.formatI(0.021), '21 mA');
    assert.equal(C.formatI(2.1e-5), '21 µA');
});

test('E 系列', () => {
    assert.equal(C.nearestE(281, 'E24', 'up'), 300);
    assert.equal(C.nearestE(281, 'E12', 'up'), 330);
    assert.equal(C.nearestE(150, 'E24', 'up'), 150);
    assert.equal(C.nearestE(4600, 'E24', 'nearest'), 4700);
    assert.equal(C.nearestE(95, 'E12', 'up'), 100);
});

test('カラーコード', () => {
    assert.deepEqual(C.valueToBands(4700, 4), [4, 7, 2, 10]);
    assert.deepEqual(C.valueToBands(4700, 5), [4, 7, 0, 1, 1]);
    assert.deepEqual(C.valueToBands(0.47, 4), [4, 7, 11, 10]);
    assert.deepEqual(C.valueToBands(10, 4), [1, 0, 0, 10]);
    assert.deepEqual(C.valueToBands(1e6, 4, 11), [1, 0, 5, 11]);
    assert.equal(C.bandsToValue([4, 7, 2, 10], 4).value, 4700);
    assert.equal(C.bandsToValue([4, 7, 2, 10], 4).tol, 5);
    assert.equal(C.bandsToValue([1, 0, 0, 2, 1], 5).value, 10000);
    assert.equal(C.bandsToValue([4, 7, 10, 10], 4).value, 4.7);
    // 4本表記で丸めが入る値
    assert.equal(C.bandsToValue(C.valueToBands(4750, 4), 4).value, 4800);
    assert.equal(C.bandsToValue(C.valueToBands(4750, 5), 5).value, 4750);
    assert.equal(C.valueToBands(0.01, 4), null);
});

test('分圧の組み合わせ', () => {
    const pairs = C.dividerPairs(4.2, 3.0, 4);
    assert.equal(pairs.length, 4);
    for (const p of pairs) {
        assert.ok(p.vout <= 3.0 + 1e-12, 'vout must not exceed limit');
        assert.ok(p.r1 + p.r2 >= 1e4 && p.r1 + p.r2 <= 2e6);
    }
    for (let i = 1; i < pairs.length; i++) assert.ok(pairs[i].err >= pairs[i - 1].err);
    assert.ok(pairs[0].err < 0.02, 'best pair should be within 20 mV');
});
