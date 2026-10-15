/* ============================================================
   SWB.expr — 安全な数式パーサ (eval / new Function を使わない)
   ------------------------------------------------------------
   evaluate("2(3+4)^2 - √16 + 10%")  →  { ok: true, value: 97.1 }
   - 演算子: + - * / × ÷ ^ (**) %  ( )  √
   - 暗黙の掛け算: 2π, 3(4+5), (1+2)(3+4), 2sin(30)
   - 関数: sqrt cbrt sin cos tan asin acos atan log(=log10) ln log2 exp abs round floor ceil
   - 定数: pi π e ans
   - 「200+10%」= 220 (電卓式のパーセント)。「200×10%」= 20
   - 帯分数「1 1/2」= 1.5、全角数字・記号も OK
   ============================================================ */
(function (root) {
    'use strict';

    const FUNCS = {
        sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
        ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
        round: Math.round, floor: Math.floor, ceil: Math.ceil,
        sin: null, cos: null, tan: null, asin: null, acos: null, atan: null
    };
    const TRIG = ['sin', 'cos', 'tan'];
    const ATRIG = ['asin', 'acos', 'atan'];

    class ExprError extends Error {}

    function normalize(src) {
        return String(src)
            .normalize('NFKC')
            .replace(/[−–—ー]/g, '-')      // 各種マイナス・長音記号の誤入力
            .replace(/[・]/g, '*')
            .replace(/\*\*/g, '^')
            .replace(/(\d),(?=\d{3}(\D|$))/g, '$1') // 桁区切りカンマ
            .replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, '($1+$2/$3)'); // 帯分数
    }

    function tokenize(s) {
        const tokens = [];
        let i = 0;
        while (i < s.length) {
            const c = s[i];
            if (/\s/.test(c)) { i++; continue; }
            if (/[0-9.]/.test(c)) {
                const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
                if (!m || m[0] === '.') throw new ExprError('数値が読めません');
                tokens.push({ t: 'num', v: parseFloat(m[0]) });
                i += m[0].length;
                continue;
            }
            if (/[a-zπ]/i.test(c)) {
                const m = /^(π|log10|log2|[a-z]+)/i.exec(s.slice(i));
                tokens.push({ t: 'id', v: m[0].toLowerCase() });
                i += m[0].length;
                continue;
            }
            if ('+-*/×÷^%()√'.includes(c)) {
                const op = c === '×' ? '*' : c === '÷' ? '/' : c;
                tokens.push({ t: op });
                i++;
                continue;
            }
            throw new ExprError('使えない文字: ' + c);
        }
        return tokens;
    }

    function evaluate(src, opts) {
        opts = opts || {};
        const deg = opts.angle !== 'rad';
        const vars = Object.assign({ pi: Math.PI, 'π': Math.PI, e: Math.E }, opts.vars || {});
        let tokens, pos = 0;

        try {
            const text = normalize(src);
            if (!text.trim()) return { ok: false, empty: true, error: '' };
            tokens = tokenize(text);
            if (opts.lenient) tokens = makeLenient(tokens);
            const r = additive();
            if (pos < tokens.length) throw new ExprError('式の形がおかしいです');
            const value = clean(r.v);
            if (Number.isNaN(value)) return { ok: false, error: '計算できません' };
            if (!Number.isFinite(value)) return { ok: false, error: '0 で割れません／大きすぎます' };
            return { ok: true, value };
        } catch (err) {
            if (err instanceof ExprError) return { ok: false, error: err.message };
            throw err;
        }

        function peek() { return tokens[pos]; }
        function next() { return tokens[pos++]; }
        function is(type) { const t = tokens[pos]; return t && t.t === type; }

        function additive() {
            let left = multiplicative();
            while (is('+') || is('-')) {
                const op = next().t;
                const right = multiplicative();
                // 電卓式パーセント: a ± b% = a × (1 ± b/100)
                const delta = right.pct ? left.v * right.v : right.v;
                left = { v: op === '+' ? left.v + delta : left.v - delta };
            }
            return left;
        }

        function startsTerm(t) {
            return t && (t.t === 'num' || t.t === 'id' || t.t === '(' || t.t === '√');
        }

        function multiplicative() {
            let left = unary();
            for (;;) {
                if (is('*') || is('/')) {
                    const op = next().t;
                    const right = unary();
                    left = { v: op === '*' ? left.v * right.v : left.v / right.v };
                } else if (startsTerm(peek())) {
                    const right = power(); // 暗黙の掛け算 (符号なし)
                    left = { v: left.v * right.v };
                } else {
                    return left;
                }
            }
        }

        function unary() {
            if (is('-')) { next(); const r = unary(); return { v: -r.v, pct: r.pct }; }
            if (is('+')) { next(); return unary(); }
            return power();
        }

        function power() {
            const base = postfix();
            if (is('^')) {
                next();
                const exp = unary(); // 右結合: 2^3^2 = 2^9
                return { v: Math.pow(base.v, exp.v) };
            }
            return base;
        }

        function postfix() {
            let r = primary();
            while (is('%')) { next(); r = { v: r.v / 100, pct: true }; }
            return r;
        }

        function primary() {
            const t = next();
            if (!t) throw new ExprError('式が途中で終わっています');
            if (t.t === 'num') return { v: t.v };
            if (t.t === '(') {
                const r = additive();
                if (!is(')')) throw new ExprError('カッコが閉じていません');
                next();
                return { v: r.v };
            }
            if (t.t === '√') return { v: Math.sqrt(postfix().v) };
            if (t.t === 'id') {
                if (Object.prototype.hasOwnProperty.call(FUNCS, t.v)) {
                    const arg = is('(') ? primary() : postfix();
                    return { v: callFn(t.v, arg.v) };
                }
                if (Object.prototype.hasOwnProperty.call(vars, t.v)) {
                    const v = vars[t.v];
                    if (typeof v !== 'number' || !Number.isFinite(v)) throw new ExprError(t.v + ' はまだありません');
                    return { v };
                }
                throw new ExprError('不明な名前: ' + t.v);
            }
            throw new ExprError('ここに「' + t.t + '」は置けません');
        }

        function callFn(name, x) {
            if (TRIG.includes(name)) {
                const rad = deg ? x * Math.PI / 180 : x;
                if (deg && name === 'tan' && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) return Infinity;
                const r = Math[name](rad);
                return Math.abs(r) < 1e-13 ? 0 : r;
            }
            if (ATRIG.includes(name)) {
                const r = Math[name](x);
                return deg ? r * 180 / Math.PI : r;
            }
            return FUNCS[name](x);
        }
    }

    // プレビュー用: 末尾の演算子を落とし、閉じカッコを補う
    function makeLenient(tokens) {
        const out = tokens.slice();
        while (out.length && ['+', '-', '*', '/', '^', '(', '√'].includes(out[out.length - 1].t)) out.pop();
        let depth = 0;
        out.forEach(t => { if (t.t === '(') depth++; else if (t.t === ')') depth--; });
        for (; depth > 0; depth--) out.push({ t: ')' });
        return out;
    }

    // 0.1+0.2 → 0.3 のように浮動小数点の端数を消す
    function clean(v) {
        if (!Number.isFinite(v) || v === 0) return v;
        return parseFloat(v.toPrecision(15));
    }

    root.SWB = root.SWB || {};
    root.SWB.expr = { evaluate, normalize };
})(typeof window !== 'undefined' ? window : globalThis);
