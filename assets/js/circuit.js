/* ============================================================
   SWB.circuit — 抵抗まわりの計算
   ------------------------------------------------------------
   parseR("4k7") → 4700 / formatR(4700) → "4.7 kΩ"
   nearestE(281, 'E24', 'up') → 300
   valueToBands(4700, 4) ⇄ bandsToValue([4, 7, 2, 10], 4)
   dividerPairs(4.2, 3.0) → 出力が 3.0V を超えない E24 の組み合わせ
   ============================================================ */
(function (root) {
    'use strict';

    const COLORS = [
        { i: 0, name: '黒', hex: '#1F1A17', digit: 0, mult: 1, tol: null },
        { i: 1, name: '茶', hex: '#7B4A2A', digit: 1, mult: 10, tol: 1 },
        { i: 2, name: '赤', hex: '#D7263D', digit: 2, mult: 100, tol: 2 },
        { i: 3, name: '橙', hex: '#F28C28', digit: 3, mult: 1e3, tol: null },
        { i: 4, name: '黄', hex: '#F4D03F', digit: 4, mult: 1e4, tol: null },
        { i: 5, name: '緑', hex: '#2E9E5B', digit: 5, mult: 1e5, tol: 0.5 },
        { i: 6, name: '青', hex: '#2E6FD8', digit: 6, mult: 1e6, tol: 0.25 },
        { i: 7, name: '紫', hex: '#8E44AD', digit: 7, mult: 1e7, tol: 0.1 },
        { i: 8, name: '灰', hex: '#9AA0A6', digit: 8, mult: 1e8, tol: 0.05 },
        { i: 9, name: '白', hex: '#F7F7F7', digit: 9, mult: 1e9, tol: null },
        { i: 10, name: '金', hex: '#C9A227', digit: null, mult: 0.1, tol: 5 },
        { i: 11, name: '銀', hex: '#C4C4C4', digit: null, mult: 0.01, tol: 10 }
    ];

    const SERIES = {
        E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
        E24: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
    };

    const clean = v => parseFloat(v.toPrecision(12));

    const PREFIX = { '': 1, r: 1, R: 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9, g: 1e9, m: 1e-3 };

    function parseR(input) {
        let s = String(input || '').normalize('NFKC').trim().replace(/\s+/g, '').replace(/(Ω|ohms?)$/i, '');
        if (!s) return NaN;
        let m = /^(\d+)([RrKkMGg])(\d+)$/.exec(s); // 4k7, 2R2, 1M5
        if (m) return clean(parseFloat(m[1] + '.' + m[3]) * PREFIX[m[2]]);
        m = /^(\d*\.?\d+(?:e[+-]?\d+)?)([RrKkMGgm]?)$/.exec(s);
        if (m) return clean(parseFloat(m[1]) * PREFIX[m[2]]);
        if (root.SWB && root.SWB.expr) {
            const r = root.SWB.expr.evaluate(s);
            if (r.ok) return r.value;
        }
        return NaN;
    }

    function formatR(v, compact) {
        if (!(v > 0) || !Number.isFinite(v)) return '—';
        const units = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, '']];
        const [div, p] = units.find(u => v >= u[0] * 0.9999999) || [1, ''];
        const n = String(parseFloat((v / div).toPrecision(4)));
        return compact ? n + p : n + ' ' + p + 'Ω';
    }

    function formatI(a) {
        if (!Number.isFinite(a)) return '—';
        const abs = Math.abs(a);
        if (abs >= 1) return parseFloat(a.toPrecision(4)) + ' A';
        if (abs >= 1e-3) return parseFloat((a * 1e3).toPrecision(4)) + ' mA';
        return parseFloat((a * 1e6).toPrecision(4)) + ' µA';
    }

    function seriesValues(name, from, to) {
        const out = [];
        for (let d = Math.floor(Math.log10(from)) - 1; d <= Math.ceil(Math.log10(to)); d++) {
            SERIES[name].forEach(b => {
                const v = clean(b * Math.pow(10, d));
                if (v >= from * 0.9999999 && v <= to * 1.0000001) out.push(v);
            });
        }
        return out;
    }

    function nearestE(r, name, mode) {
        if (!(r > 0)) return NaN;
        const list = seriesValues(name || 'E24', r / 20, r * 20);
        if (mode === 'up') return list.find(v => v >= r * (1 - 1e-9));
        if (mode === 'down') return list.filter(v => v <= r * (1 + 1e-9)).pop();
        return list.reduce((best, v) => (Math.abs(Math.log(v / r)) < Math.abs(Math.log(best / r)) ? v : best), list[0]);
    }

    // 出力が voutMax を超えない分圧の組み合わせを、誤差の小さい順に
    function dividerPairs(vin, voutMax, count) {
        const values = seriesValues('E24', 1e3, 1e6);
        const found = [];
        for (const r1 of values) {
            for (const r2 of values) {
                const total = r1 + r2;
                if (total < 1e4 || total > 2e6) continue;
                const vout = vin * r2 / total;
                if (vout > voutMax + 1e-12) continue;
                found.push({ r1, r2, vout, err: voutMax - vout, size: Math.abs(Math.log(total / 2e5)) });
            }
        }
        found.sort((a, b) => a.err - b.err || a.size - b.size);
        const seen = new Set();
        const out = [];
        for (const p of found) {
            const key = (p.r2 / (p.r1 + p.r2)).toPrecision(6);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(p);
            if (out.length >= (count || 4)) break;
        }
        return out;
    }

    function bandsToValue(cc, n) {
        const digits = cc.slice(0, n - 2).map(i => COLORS[i].digit);
        if (digits.some(d => d === null || d === undefined)) return { value: NaN, tol: null };
        const base = Number(digits.join(''));
        const mult = COLORS[cc[n - 2]].mult;
        return { value: clean(base * mult), tol: COLORS[cc[n - 1]].tol };
    }

    function valueToBands(v, n, tolIdx) {
        if (!(v > 0)) return null;
        const sig = n === 4 ? 2 : 3;
        let exp = Math.floor(Math.log10(v) + 1e-12) - (sig - 1);
        let digits = Math.round(v / Math.pow(10, exp));
        if (digits >= Math.pow(10, sig)) { digits = Math.round(digits / 10); exp += 1; }
        const multIdx = exp === -2 ? 11 : exp === -1 ? 10 : exp >= 0 && exp <= 9 ? exp : -1;
        if (multIdx < 0) return null;
        const tol = tolIdx !== undefined && COLORS[tolIdx] && COLORS[tolIdx].tol !== null ? tolIdx : (n === 4 ? 10 : 1);
        return String(digits).padStart(sig, '0').split('').map(Number).concat([multIdx, tol]);
    }

    function describe(ci, bandIndex, n) {
        const c = COLORS[ci];
        if (bandIndex < n - 2) return String(c.digit);
        if (bandIndex === n - 2) return '×' + (c.mult >= 1e3 ? formatR(c.mult, true) : c.mult);
        return '±' + c.tol + '%';
    }

    root.SWB = root.SWB || {};
    root.SWB.circuit = { COLORS, SERIES, parseR, formatR, formatI, nearestE, seriesValues, dividerPairs, bandsToValue, valueToBands, describe };
})(typeof window !== 'undefined' ? window : globalThis);
