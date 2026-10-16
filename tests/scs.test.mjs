import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../assets/js/scs-data.js';

const SCS = globalThis.SWB.scs;

test('データの整合性', () => {
    const ids = new Set();
    const cats = new Set(SCS.categories.map(c => c.id));
    for (const m of SCS.materials) {
        assert.ok(!ids.has(m.id), 'id が重複: ' + m.id);
        ids.add(m.id);
        assert.ok(cats.has(m.cat), m.id + ' のカテゴリが不明');
        assert.ok(SCS.processes[m.proc], m.id + ' の加工方法が不明');
        const tks = SCS.thicknesses(m);
        assert.ok(tks.length > 0, m.id + ' に板厚がない');
        tks.forEach((t, i) => {
            assert.ok(t.inch > 0 && Number.isFinite(t.mm), m.id + ' ' + t.label);
            assert.ok(SCS.processes[t.proc], m.id + ' ' + t.label + ' の加工方法');
            if (i) assert.ok(t.inch > tks[i - 1].inch, m.id + ' の板厚が昇順でない');
        });
    }
    assert.equal(SCS.materials.length, 43);
});

test('インチ → mm と分数', () => {
    const al = SCS.thicknesses(SCS.materials.find(m => m.id === 'al5052'));
    assert.equal(SCS.mm2(al.find(t => t.label === '.125').mm), '3.18');
    assert.equal(SCS.mm2(al.find(t => t.label === '.063').mm), '1.60');
    assert.equal(SCS.mm2(al.find(t => t.label === '.375').mm), '9.53');
    assert.equal(SCS.mm3(al.find(t => t.label === '.125').mm), '3.175');
    assert.equal(SCS.mm3(al.find(t => t.label === '.187').mm), '4.750');
    assert.equal(SCS.mm3(al.find(t => t.label === '.063').mm), '1.600');
    assert.equal(SCS.fraction(0.125), '1/8');
    assert.equal(SCS.fraction(0.063), '1/16');
    assert.equal(SCS.fraction(0.187), '3/16');
    assert.equal(SCS.fraction(0.313), '5/16');
    assert.equal(SCS.fraction(0.031), '1/32');
    assert.equal(SCS.fraction(1.125), '1-1/8');
    assert.equal(SCS.fraction(0.155), null);
    assert.equal(SCS.fraction(0.157), null);
    assert.equal(SCS.fraction(0.040), null);
});
