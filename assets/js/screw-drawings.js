/* ============================================================
   SWB.screwDrawing — ねじの製図をその場で描く (オリジナル SVG)
   ------------------------------------------------------------
   screwDrawing('cap', { d: 'M3', dk: 5.5, k: 3, s: 2.5, ... })
   → 左に頭側から見た図、右に側面図。選んだサイズの実寸比で描き、
     寸法線には数値を入れる。色はすべてテーマのトークン。
   寸法は <g class="dim" data-dim="dk"> でまとめてあり、
   表の見出しと連動してハイライトできる。
   ============================================================ */
(function (root) {
    'use strict';

    const W = 640, H = 330, CY = 166;
    const END_CX = 128;        // 頭側から見た図の中心
    const X0 = 336;            // 側面図: 頭の端
    const END_MAX_R = 92;      // 頭側から見た図の最大半径 (px)
    const SIDE_MAX = 248;      // 側面図の最大長さ (px)

    const f = v => Math.round(v * 10) / 10;
    const num = v => (typeof v === 'number' ? String(v) : v);
    const dia = row => parseFloat(String(row.d).replace(/^M/i, ''));

    /* ---------- 基本図形 ---------- */
    const L = (x1, y1, x2, y2, cls) => '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" class="' + cls + '"/>';
    const P = (d, cls) => '<path d="' + d + '" class="' + cls + '"/>';
    const C = (cx, cy, r, cls) => '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" class="' + cls + '"/>';
    const pts = list => list.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
    const POLY = (list, cls) => '<polygon points="' + pts(list) + '" class="' + cls + '"/>';

    // 中心が (cx, cy)、外接円半径 R、角が上下に来る六角形 (二面幅は左右)
    function hexagon(cx, cy, R) {
        const out = [];
        for (let i = 0; i < 6; i++) {
            const a = (90 + 60 * i) * Math.PI / 180;
            out.push([cx + R * Math.cos(a), cy - R * Math.sin(a)]);
        }
        return out;
    }

    function arrow(x, y, dx, dy) {
        // (x, y) が先端、(dx, dy) の向きへ向く矢印
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const bx = x - ux * 8, by = y - uy * 8;
        return POLY([[x, y], [bx - uy * 2.8, by + ux * 2.8], [bx + uy * 2.8, by - ux * 2.8]], 'arw');
    }

    function label(x, y, text, opts) {
        opts = opts || {};
        const rot = opts.rotate ? ' transform="rotate(-90 ' + f(x) + ' ' + f(y) + ')"' : '';
        return '<text x="' + f(x) + '" y="' + f(y) + '" text-anchor="' + (opts.anchor || 'middle') + '"' + rot + ' class="dl">' + text + '</text>';
    }

    /* ---------- 寸法線 ---------- */
    // 横方向: x1〜x2 を y の高さで。ext は引出線の根元の y
    function dimH(key, x1, x2, y, text, ext1, ext2) {
        const up = y < ext1;
        const gap = up ? -3 : 3;
        let s = '<g class="dim" data-dim="' + key + '">';
        s += L(x1, ext1 + gap, x1, y + (up ? -5 : 5), 'ext') + L(x2, (ext2 === undefined ? ext1 : ext2) + gap, x2, y + (up ? -5 : 5), 'ext');
        if (x2 - x1 >= 30) {
            s += L(x1, y, x2, y, 'dimln') + arrow(x1, y, -1, 0) + arrow(x2, y, 1, 0);
        } else {
            // 狭いときは外側から矢印
            s += L(x1 - 18, y, x2 + 18, y, 'dimln') + arrow(x1, y, 1, 0) + arrow(x2, y, -1, 0);
        }
        s += label((x1 + x2) / 2, y - 6, text);
        return s + '</g>';
    }

    // 縦方向: y1〜y2 を x の位置で。ext は引出線の根元の x。side は文字の側
    function dimV(key, y1, y2, x, text, ext1, ext2, side) {
        const left = side !== 'right';
        const dir = x < ext1 ? -1 : 1;
        let s = '<g class="dim" data-dim="' + key + '">';
        if (ext1 !== null) {
            s += L(ext1 + 3 * dir, y1, x + 5 * dir, y1, 'ext') + L((ext2 === undefined ? ext1 : ext2) + 3 * dir, y2, x + 5 * dir, y2, 'ext');
        }
        if (y2 - y1 >= 30) {
            s += L(x, y1, x, y2, 'dimln') + arrow(x, y1, 0, -1) + arrow(x, y2, 0, 1);
        } else {
            s += L(x, y1 - 18, x, y2 + 18, 'dimln') + arrow(x, y1, 0, 1) + arrow(x, y2, 0, -1);
        }
        s += label(x + (left ? -7 : 15), (y1 + y2) / 2, text, { rotate: true });
        return s + '</g>';
    }

    // 引出線
    function leader(key, x, y, tx, ty, text) {
        const right = tx >= x;
        return '<g class="dim" data-dim="' + key + '">' +
            '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2.2" class="arw"/>' +
            L(x, y, tx, ty, 'dimln') + L(tx, ty, tx + (right ? 34 : -34), ty, 'dimln') +
            label(tx + (right ? 4 : -4), ty - 6, text, { anchor: right ? 'start' : 'end' }) +
        '</g>';
    }

    function centerH(x1, x2) { return L(x1, CY, x2, CY, 'cl'); }
    function centerV(x, y1, y2) { return L(x, y1, x, y2, 'cl'); }

    /* ---------- 軸 (ねじ部) ---------- */
    // xh: 首下, len: 軸の長さ(px), rd: 呼び径の半径(px), threadFrom: ねじ部の始まり (0〜1)
    function shaft(xh, len, rd, threadFrom) {
        const xe = xh + len;
        const c = Math.max(1.5, rd * 0.22);
        const xt = xh + len * threadFrom;
        const rm = rd * 0.8;
        let s = P('M' + f(xh) + ' ' + f(CY - rd) + ' L' + f(xe - c) + ' ' + f(CY - rd) + ' L' + f(xe) + ' ' + f(CY - rd + c) +
            ' L' + f(xe) + ' ' + f(CY + rd - c) + ' L' + f(xe - c) + ' ' + f(CY + rd) + ' L' + f(xh) + ' ' + f(CY + rd), 'body');
        // ねじの谷径 (細線) と、ねじの終わり
        s += L(xt, CY - rm, xe, CY - rm, 'thin') + L(xt, CY + rm, xe, CY + rm, 'thin');
        if (threadFrom > 0.02) s += L(xt, CY - rd, xt, CY + rd, 'edge');
        return { svg: s, xe, xt };
    }

    // ドーム頭 (楕円近似) で、高さ y の位置の表面の x
    function domeX(x0, xr, r, y) {
        const t = Math.min(1, Math.abs(y) / r);
        return x0 + (xr - x0) * (1 - Math.sqrt(1 - t * t));
    }

    /* ---------- 頭側から見た図の部品 ---------- */
    function socketR(sAcross, sc) { return sAcross / Math.sqrt(3) * sc; }

    function crossRecess(cx, dk, sc) {
        const a = 0.27 * dk * sc, w = Math.max(1.6, 0.055 * dk * sc);
        const shape = [
            [cx - w, CY - a], [cx + w, CY - a], [cx + w, CY - w], [cx + a, CY - w], [cx + a, CY + w], [cx + w, CY + w],
            [cx + w, CY + a], [cx - w, CY + a], [cx - w, CY + w], [cx - a, CY + w], [cx - a, CY - w], [cx - w, CY - w]
        ];
        return C(cx, CY, w * 2.1, 'thin') + POLY(shape, 'recess');
    }

    /* ---------- 種類ごとの作図 ---------- */
    const DRAW = {
        cap(row) {
            const d = dia(row), dk = row.dk, k = row.k, s = row.s;
            const Ls = 3.2 * d;
            const sc = Math.min((END_MAX_R * 2) / dk, SIDE_MAX / (k + Ls));
            const r = dk / 2 * sc, rd = d / 2 * sc, xh = X0 + k * sc, ch = Math.max(2, 0.08 * dk * sc);
            const sh = shaft(xh, Ls * sc, rd, 0.42);
            const hr = socketR(s, sc), depth = 0.55 * k * sc;
            let g = '';
            // 頭側から見た図
            g += C(END_CX, CY, r, 'body') + C(END_CX, CY, r - ch, 'thin') + POLY(hexagon(END_CX, CY, hr), 'recess');
            g += centerH(END_CX - r - 12, END_CX + r + 12) + centerV(END_CX, CY - r - 12, CY + r + 12);
            // 側面図
            g += P('M' + f(xh) + ' ' + f(CY - r) + ' L' + f(X0 + ch) + ' ' + f(CY - r) + ' L' + f(X0) + ' ' + f(CY - r + ch) +
                ' L' + f(X0) + ' ' + f(CY + r - ch) + ' L' + f(X0 + ch) + ' ' + f(CY + r) + ' L' + f(xh) + ' ' + f(CY + r) + ' Z', 'body');
            g += P('M' + f(X0) + ' ' + f(CY - hr) + ' L' + f(X0 + depth) + ' ' + f(CY - hr) + ' L' + f(X0 + depth + hr * 0.55) + ' ' + f(CY) +
                ' L' + f(X0 + depth) + ' ' + f(CY + hr) + ' L' + f(X0) + ' ' + f(CY + hr), 'hidden');
            g += sh.svg + centerH(X0 - 12, sh.xe + 12);
            // 寸法
            g += dimV('dk', CY - r, CY + r, END_CX - r - 20, 'dk ' + num(dk), END_CX, END_CX);
            g += dimH('k', X0, xh, CY - r - 20, 'k ' + num(k), CY - r + ch, CY - r);
            g += dimV('d', CY - rd, CY + rd, sh.xe + 20, row.d, sh.xe, sh.xe, 'right');
            g += dimV('ds', CY - rd, CY + rd, (xh + sh.xt) / 2, 'ds ' + num(row.ds), null, null, 'right');
            g += dimH('l', xh, sh.xe, CY + r + 26, 'l ' + num(row.l), CY + r, CY + rd);
            g += dimH('s', END_CX - hr * Math.sqrt(3) / 2, END_CX + hr * Math.sqrt(3) / 2, CY - r - 20, 's ' + num(s), CY - hr / 2);
            return g;
        },

        button(row) {
            const d = dia(row), D = row.D, Hh = row.H, B = row.B;
            const Ls = 3.0 * d;
            const sc = Math.min((END_MAX_R * 2) / D, SIDE_MAX / (Hh + Ls));
            const r = D / 2 * sc, rd = d / 2 * sc, xh = X0 + Hh * sc, rim = 0.16 * Hh * sc;
            const sh = shaft(xh, Ls * sc, rd, 0);
            const hr = socketR(B, sc), depth = 0.6 * Hh * sc;
            const xr = xh - rim, k1 = X0 + (xr - X0) * 0.38;
            let g = '';
            g += C(END_CX, CY, r, 'body') + C(END_CX, CY, r * 0.62, 'thin') + POLY(hexagon(END_CX, CY, hr), 'recess');
            g += centerH(END_CX - r - 12, END_CX + r + 12) + centerV(END_CX, CY - r - 12, CY + r + 12);
            g += P('M' + f(xh) + ' ' + f(CY - r) + ' L' + f(xr) + ' ' + f(CY - r) +
                ' C' + f(k1) + ' ' + f(CY - r) + ' ' + f(X0) + ' ' + f(CY - r * 0.48) + ' ' + f(X0) + ' ' + f(CY) +
                ' C' + f(X0) + ' ' + f(CY + r * 0.48) + ' ' + f(k1) + ' ' + f(CY + r) + ' ' + f(xr) + ' ' + f(CY + r) +
                ' L' + f(xh) + ' ' + f(CY + r) + ' Z', 'body');
            const xs = domeX(X0, xr, r, hr);
            g += P('M' + f(xs) + ' ' + f(CY - hr) + ' L' + f(X0 + depth) + ' ' + f(CY - hr) + ' L' + f(X0 + depth + hr * 0.55) + ' ' + f(CY) +
                ' L' + f(X0 + depth) + ' ' + f(CY + hr) + ' L' + f(xs) + ' ' + f(CY + hr), 'hidden');
            g += sh.svg + centerH(X0 - 12, sh.xe + 12);
            g += dimV('D', CY - r, CY + r, END_CX - r - 20, 'D ' + num(D), END_CX, END_CX);
            g += dimH('H', X0, xh, CY - r - 20, 'H ' + num(Hh), CY - 2, CY - r);
            g += dimV('d', CY - rd, CY + rd, sh.xe + 20, row.d, sh.xe, sh.xe, 'right');
            g += dimH('B', END_CX - hr * Math.sqrt(3) / 2, END_CX + hr * Math.sqrt(3) / 2, CY - r - 20, 'B ' + num(B), CY - hr / 2);
            return g;
        },

        pan(row) { return smallScrew(row, 'pan'); },
        truss(row) { return smallScrew(row, 'truss'); },

        nut(row) {
            const d = dia(row), s = row.s, e = row.e, m = row.m;
            const sc = Math.min((END_MAX_R * 2) / e, 150 / m);
            const R = e / 2 * sc, half = s / 2 * sc, rd = d / 2 * sc;
            const x0 = 316, x1 = x0 + m * sc, c = Math.max(2, R * 0.07);
            let g = '';
            // 正面 (ねじ穴側)
            g += POLY(hexagon(END_CX, CY, R), 'body') + C(END_CX, CY, half * 0.93, 'thin');
            g += C(END_CX, CY, rd * 0.84, 'edge');
            g += P('M' + f(END_CX + rd) + ' ' + f(CY) + ' A' + f(rd) + ' ' + f(rd) + ' 0 1 0 ' + f(END_CX) + ' ' + f(CY + rd), 'thin'); // めねじの谷 (3/4 円の細線)
            g += centerH(END_CX - R - 12, END_CX + R + 12) + centerV(END_CX, CY - R - 12, CY + R + 12);
            // 側面
            g += P('M' + f(x0 + c) + ' ' + f(CY - R) + ' L' + f(x1 - c) + ' ' + f(CY - R) + ' L' + f(x1) + ' ' + f(CY - R + c) +
                ' L' + f(x1) + ' ' + f(CY + R - c) + ' L' + f(x1 - c) + ' ' + f(CY + R) + ' L' + f(x0 + c) + ' ' + f(CY + R) +
                ' L' + f(x0) + ' ' + f(CY + R - c) + ' L' + f(x0) + ' ' + f(CY - R + c) + ' Z', 'body');
            g += L(x0, CY - R / 2, x1, CY - R / 2, 'edge') + L(x0, CY + R / 2, x1, CY + R / 2, 'edge');
            // 面取りの弧
            [-R, -R / 2, R / 2].forEach(y => {
                const y2 = y + R / 2;
                const ym = (y + y2) / 2;
                g += P('M' + f(x0) + ' ' + f(CY + y) + ' Q' + f(x0 + c * 2.4) + ' ' + f(CY + ym) + ' ' + f(x0) + ' ' + f(CY + y2), 'thin');
                g += P('M' + f(x1) + ' ' + f(CY + y) + ' Q' + f(x1 - c * 2.4) + ' ' + f(CY + ym) + ' ' + f(x1) + ' ' + f(CY + y2), 'thin');
            });
            g += L(x0, CY - rd, x1, CY - rd, 'hidden') + L(x0, CY + rd, x1, CY + rd, 'hidden');
            g += centerH(x0 - 12, x1 + 12);
            // 寸法
            g += dimH('s', END_CX - half, END_CX + half, CY - R - 20, 's ' + num(s), CY - R / 2);
            g += dimV('e', CY - R, CY + R, END_CX - R - 4 - 18, 'e ' + num(e), END_CX, END_CX);
            g += dimH('m', x0, x1, CY - R - 20, 'm ' + num(m), CY - R + c);
            const a = -40 * Math.PI / 180;
            g += leader('d', END_CX + rd * Math.cos(a), CY + rd * Math.sin(a), END_CX + R + 22, CY + R + 12, row.d);
            return g;
        }
    };

    function smallScrew(row, kind) {
        const d = dia(row), dk = row.dk, k = row.k;
        const Ls = 3.2 * d;
        const sc = Math.min((END_MAX_R * 2) / dk, SIDE_MAX / (k + Ls));
        const r = dk / 2 * sc, rd = d / 2 * sc, xh = X0 + k * sc;
        const sh = shaft(xh, Ls * sc, rd, 0);
        let g = '';
        g += C(END_CX, CY, r, 'body') + crossRecess(END_CX, dk, sc);
        g += centerH(END_CX - r - 12, END_CX + r + 12) + centerV(END_CX, CY - r - 12, CY + r + 12);
        let head;
        if (kind === 'pan') {
            const rad = Math.min(k * sc * 0.55, r * 0.45);
            head = 'M' + f(xh) + ' ' + f(CY - r) + ' L' + f(X0 + rad) + ' ' + f(CY - r) + ' Q' + f(X0) + ' ' + f(CY - r) + ' ' + f(X0) + ' ' + f(CY - r + rad) +
                ' L' + f(X0) + ' ' + f(CY + r - rad) + ' Q' + f(X0) + ' ' + f(CY + r) + ' ' + f(X0 + rad) + ' ' + f(CY + r) + ' L' + f(xh) + ' ' + f(CY + r) + ' Z';
        } else {
            const rim = 0.22 * k * sc, xr = xh - rim, k1 = X0 + (xr - X0) * 0.55;
            head = 'M' + f(xh) + ' ' + f(CY - r) + ' L' + f(xr) + ' ' + f(CY - r) +
                ' C' + f(k1) + ' ' + f(CY - r) + ' ' + f(X0) + ' ' + f(CY - r * 0.62) + ' ' + f(X0) + ' ' + f(CY) +
                ' C' + f(X0) + ' ' + f(CY + r * 0.62) + ' ' + f(k1) + ' ' + f(CY + r) + ' ' + f(xr) + ' ' + f(CY + r) +
                ' L' + f(xh) + ' ' + f(CY + r) + ' Z';
        }
        g += P(head, 'body');
        // 十字穴 (かくれ線)
        const w = 0.27 * dk * sc, depth = 0.62 * k * sc;
        const xs = kind === 'pan' ? X0 : domeX(X0, xh - 0.22 * k * sc, r, w);
        g += P('M' + f(xs) + ' ' + f(CY - w) + ' L' + f(X0 + depth) + ' ' + f(CY) + ' L' + f(xs) + ' ' + f(CY + w), 'hidden');
        g += sh.svg + centerH(X0 - 12, sh.xe + 12);
        const topExt = kind === 'pan' ? CY - r + Math.min(k * sc * 0.55, r * 0.45) : CY - 2;
        g += dimV('dk', CY - r, CY + r, END_CX - r - 20, 'dk ' + num(dk), END_CX, END_CX);
        g += dimH('k', X0, xh, CY - r - 20, 'k ' + num(k), topExt, CY - r);
        g += dimV('d', CY - rd, CY + rd, sh.xe + 20, row.d, sh.xe, sh.xe, 'right');
        g += dimH('l', xh, sh.xe, CY + r + 26, 'l ' + num(row.l), CY + r, CY + rd);
        g += '<g class="dim" data-dim="slot">' + label(END_CX, CY + r + 30, '十字穴 No.' + row.slot) + '</g>';
        return g;
    }

    function screwDrawing(type, row) {
        const draw = DRAW[type];
        if (!draw || !row) return '';
        return '<svg class="drawing__svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + draw(row) + '</svg>';
    }

    // 描いた中身に合わせて viewBox を詰める (枠いっぱいに大きく見せる)。DOM に入れてから呼ぶ
    screwDrawing.fit = function (svg) {
        if (!svg || !svg.getBBox) return;
        const b = svg.getBBox();
        if (!b.width || !b.height) return;
        let x = b.x - 22, y = b.y - 34, w = b.width + 44, h = b.height + 50;
        const ar = W / H;
        if (w / h > ar) { const nh = w / ar; y -= (nh - h) / 2; h = nh; } else { const nw = h * ar; x -= (nw - w) / 2; w = nw; }
        svg.setAttribute('viewBox', [x, y, w, h].map(f).join(' '));
    };

    root.SWB = root.SWB || {};
    root.SWB.screwDrawing = screwDrawing;
})(typeof window !== 'undefined' ? window : globalThis);
