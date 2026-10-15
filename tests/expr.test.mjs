import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../assets/js/expr.js';

const { evaluate } = globalThis.SWB.expr;
const ev = (s, o) => evaluate(s, o);

test('四則演算と優先順位', () => {
    assert.equal(ev('1+2*3').value, 7);
    assert.equal(ev('(1+2)*3').value, 9);
    assert.equal(ev('10/4').value, 2.5);
    assert.equal(ev('0.1+0.2').value, 0.3);
    assert.equal(ev('2^3^2').value, 512);
    assert.equal(ev('-2^2').value, -4);
    assert.equal(ev('2^-1').value, 0.5);
    assert.equal(ev('8×3÷4').value, 6);
});

test('暗黙の掛け算・定数・関数', () => {
    assert.equal(ev('2(3+4)').value, 14);
    assert.equal(ev('(1+2)(3+4)').value, 21);
    assert.equal(ev('2π').value, parseFloat((2 * Math.PI).toPrecision(15)));
    assert.equal(ev('√16').value, 4);
    assert.equal(ev('2√16').value, 8);
    assert.equal(ev('sqrt(2)^2').value, 2);
    assert.equal(ev('sin(30)').value, 0.5);
    assert.equal(ev('sin30').value, 0.5);
    assert.equal(ev('cos(90)').value, 0);
    assert.equal(ev('sin(pi/2)', { angle: 'rad' }).value, 1);
    assert.equal(ev('atan(1)').value, 45);
    assert.equal(ev('log(1000)').value, 3);
    assert.equal(ev('ln(e)').value, 1);
    assert.equal(ev('ans*2', { vars: { ans: 21 } }).value, 42);
});

test('パーセント (電卓式)', () => {
    assert.equal(ev('50%').value, 0.5);
    assert.equal(ev('200+10%').value, 220);
    assert.equal(ev('200-10%').value, 180);
    assert.equal(ev('200*10%').value, 20);
});

test('全角・帯分数・桁区切り', () => {
    assert.equal(ev('１２＋３').value, 15);
    assert.equal(ev('1 1/2').value, 1.5);
    assert.equal(ev('3/8').value, 0.375);
    assert.equal(ev('1,234+1').value, 1235);
    assert.equal(ev('5 − 2').value, 3);
});

test('エラーと寛容モード', () => {
    assert.equal(ev('1/0').ok, false);
    assert.equal(ev('2+').ok, false);
    assert.equal(ev('(1+2').ok, false);
    assert.equal(ev('foo').ok, false);
    assert.equal(ev('alert(1)').ok, false);
    assert.equal(ev('tan(90)').ok, false);
    assert.equal(ev('').empty, true);
    assert.equal(ev('2+', { lenient: true }).value, 2);
    assert.equal(ev('(1+2', { lenient: true }).value, 3);
    assert.equal(ev('√(9', { lenient: true }).value, 3);
});
