import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../assets/js/iso286.js';

const { tolerance, fit, parseClass } = globalThis.SWB.iso286;
const tol = (cls, d) => {
    const c = parseClass(cls);
    const t = tolerance(c.letter, c.grade, d);
    return t && [t.upper, t.lower];
};

// JIS B 0401-2 / ISO 286-2 の公差表から抜き出した既知の値 (µm)
const KNOWN = [
    ['H7', 10, [15, 0]], ['H7', 25, [21, 0]], ['H7', 100, [35, 0]], ['H7', 300, [52, 0]],
    ['H6', 16, [11, 0]], ['H8', 40, [39, 0]], ['H9', 6, [30, 0]], ['H11', 8, [90, 0]],
    ['h6', 10, [0, -9]], ['h7', 18, [0, -18]], ['h9', 50, [0, -62]],
    ['g6', 10, [-5, -14]], ['g6', 30, [-7, -20]], ['f7', 12, [-16, -34]], ['f7', 60, [-30, -60]],
    ['e8', 20, [-40, -73]], ['d9', 45, [-80, -142]], ['c9', 2, [-60, -85]], ['b9', 3, [-140, -165]],
    ['k6', 3, [6, 0]], ['k6', 5, [9, 1]], ['k6', 25, [15, 2]], ['k6', 100, [25, 3]],
    ['m6', 8, [15, 6]], ['n6', 15, [23, 12]], ['p6', 25, [35, 22]], ['p6', 70, [51, 32]],
    ['r6', 12, [34, 23]], ['r6', 70, [62, 43]], ['s6', 30, [48, 35]], ['s6', 110, [101, 79]],
    ['t6', 30, [54, 41]], ['u6', 20, [54, 41]], ['u6', 28, [61, 48]], ['x6', 16, [56, 45]], ['x6', 20, [67, 54]],
    ['js6', 8, [4.5, -4.5]], ['js7', 15, [9, -9]], ['JS7', 8, [7.5, -7.5]],
    ['G7', 10, [20, 5]], ['F7', 20, [41, 20]], ['F8', 6, [28, 10]], ['E9', 12, [75, 32]], ['D10', 25, [149, 65]],
    ['K6', 5, [2, -6]], ['K7', 5, [3, -9]], ['K7', 8, [5, -10]], ['K7', 25, [6, -15]], ['K7', 2, [0, -10]],
    ['M6', 8, [-3, -12]], ['M7', 8, [0, -15]], ['M7', 25, [0, -21]], ['M6', 300, [-9, -41]],
    ['N7', 5, [-4, -16]], ['N7', 15, [-5, -23]], ['N7', 25, [-7, -28]], ['N9', 2, [-4, -29]], ['N9', 5, [0, -30]],
    ['P6', 15, [-15, -26]], ['P7', 5, [-8, -20]], ['P7', 25, [-14, -35]], ['P9', 10, [-15, -51]],
    ['R7', 2, [-10, -20]], ['R7', 15, [-16, -34]], ['R7', 130, [-48, -88]],
    ['S7', 5, [-15, -27]], ['S7', 15, [-21, -39]], ['S7', 130, [-77, -117]],
    ['T7', 28, [-33, -54]], ['U7', 5, [-19, -31]], ['U7', 8, [-22, -37]], ['U7', 15, [-26, -44]], ['U7', 110, [-131, -166]],
    ['X7', 2, [-20, -30]], ['X7', 5, [-24, -36]], ['X7', 12, [-33, -51]],
];

test('既知の公差値と一致する', () => {
    for (const [cls, d, expected] of KNOWN) {
        assert.deepEqual(tol(cls, d), expected, `${cls} φ${d}`);
    }
});

test('規定のない組み合わせは null', () => {
    assert.equal(tol('t6', 20), null);
    assert.equal(tol('T7', 10), null);
});

test('はめあいの判定', () => {
    const a = fit('H7', 'g6', 10);
    assert.equal(a.type, 'clearance');
    assert.equal(a.maxClearance, 29);
    assert.equal(a.minClearance, 5);

    const b = fit('H7', 'k6', 10);
    assert.equal(b.type, 'transition');
    assert.equal(b.maxClearance, 14);
    assert.equal(b.maxInterference, 10);

    const c = fit('H7', 'p6', 10);
    assert.equal(c.type, 'interference');
    assert.equal(c.minInterference, 0);
    assert.equal(c.maxInterference, 24);

    const d = fit('H7', 'h6', 10);
    assert.equal(d.type, 'clearance');
    assert.equal(d.minClearance, 0);
    assert.ok(Math.abs(d.hole.max - 10.015) < 1e-9);

    assert.ok(fit('H7', 'g6', 600).error);
    assert.ok(fit('Z7', 'g6', 10).error);
});
