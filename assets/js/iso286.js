/* ============================================================
   SWB.iso286 — はめあい公差 (ISO 286-1 / JIS B 0401-1)
   ------------------------------------------------------------
   表を丸写しせず、規格の「基本公差 IT」と「基礎となる寸法許容差」
   から公差域を計算する。対象: 基準寸法 0 < d ≤ 500 mm, IT5〜IT11。
     tolerance('H', 7, 10)  →  { upper: 15, lower: 0 }   (µm)
     fit('H7', 'g6', 10)    →  穴・軸の寸法とすきま/しめしろ
   ============================================================ */
(function (root) {
    'use strict';

    // 基本公差の寸法区分 (… を超え 〜 以下)
    const MAIN = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
    // 基礎となる寸法許容差の細分区分
    const SUB = [3, 6, 10, 14, 18, 24, 30, 40, 50, 65, 80, 100, 120, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500];

    // 基本公差 IT (µm)  — MAIN の各区分
    const IT = {
        4: [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
        5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
        6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
        7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
        8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
        9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
        10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
        11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400]
    };

    // 軸の基礎となる寸法許容差 (µm) — SUB の各区分
    //   b〜h: 上の寸法許容差 es / k〜x: 下の寸法許容差 ei
    const r3 = (a, b, c, d, e, f, g, h, i, j, k, l, m) => [a, b, c, d, d, e, e, f, f, g, g, h, h, i, i, i, j, j, j, k, k, l, l, m, m];
    const SHAFT = {
        b: [-140, -140, -150, -150, -150, -160, -160, -170, -180, -190, -200, -220, -240, -260, -280, -310, -340, -380, -420, -480, -540, -600, -680, -760, -840],
        c: [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480],
        d: r3(-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230),
        e: r3(-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135),
        f: r3(-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68),
        g: r3(-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20),
        h: r3(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        k: r3(0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5), // IT4〜IT7 の値 (それ以外は 0)
        m: r3(2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23),
        n: r3(4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40),
        p: r3(6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68),
        r: [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132],
        s: [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252],
        t: [null, null, null, null, null, null, 41, 48, 54, 66, 75, 91, 104, 122, 134, 146, 166, 180, 196, 218, 240, 268, 294, 330, 360],
        u: [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540],
        x: [20, 28, 34, 40, 45, 54, 64, 80, 97, 122, 146, 178, 210, 248, 280, 310, 350, 385, 425, 475, 525, 590, 660, 740, 820]
    };
    const UPPER_LETTERS = ['b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // 穴 K〜ZC の補正値 Δ (µm) — MAIN の各区分、IT5〜IT8
    const DELTA = {
        5: [0, 1, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 7],
        6: [0, 3, 3, 3, 4, 5, 6, 7, 7, 9, 9, 11, 13],
        7: [0, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
        8: [0, 6, 7, 9, 12, 14, 16, 19, 23, 26, 29, 32, 34]
    };

    const HOLE_LETTERS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'JS', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'X'];
    const SHAFT_LETTERS = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'js', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'x'];
    const GRADES = [5, 6, 7, 8, 9, 10, 11];
    const MAX_SIZE = 500;

    function rangeIndex(bounds, d) {
        for (let i = 0; i < bounds.length; i++) if (d <= bounds[i]) return i;
        return -1;
    }

    function rangeLabel(d) {
        const i = rangeIndex(MAIN, d);
        return (i === 0 ? '0' : MAIN[i - 1]) + '〜' + MAIN[i];
    }

    function it(grade, d) {
        const i = rangeIndex(MAIN, d);
        return IT[grade] ? IT[grade][i] : undefined;
    }

    function shaftTol(letter, grade, d) {
        const mi = rangeIndex(MAIN, d);
        const si = rangeIndex(SUB, d);
        const T = IT[grade][mi];
        if (letter === 'js') return { upper: T / 2, lower: -T / 2 };
        const table = SHAFT[letter];
        if (!table) return null;
        let fd = table[si];
        if (fd === null || fd === undefined) return null;
        if (letter === 'k' && (grade < 4 || grade > 7)) fd = 0;
        if (UPPER_LETTERS.includes(letter)) return { upper: fd, lower: fd - T };
        return { upper: fd + T, lower: fd };
    }

    function holeTol(letter, grade, d) {
        const mi = rangeIndex(MAIN, d);
        const si = rangeIndex(SUB, d);
        const T = IT[grade][mi];
        if (letter === 'JS') return { upper: T / 2, lower: -T / 2 };
        const lower = letter.toLowerCase();
        if (UPPER_LETTERS.includes(lower)) {
            // A〜H: EI = −es
            const EI = -SHAFT[lower][si];
            return { upper: EI + T, lower: EI };
        }
        const table = SHAFT[lower];
        if (!table) return null;
        const ei = table[si];
        if (ei === null || ei === undefined) return null;
        const delta = DELTA[grade] ? DELTA[grade][mi] : 0;
        let ES;
        if (letter === 'K') {
            const kei = grade >= 4 && grade <= 7 ? ei : 0;
            ES = grade <= 8 ? -kei + delta : 0;
        } else if (letter === 'M') {
            ES = grade <= 8 ? -ei + delta : -ei;
            if (grade === 6 && d > 250 && d <= 315) ES = -9; // 規格の特例
        } else if (letter === 'N') {
            ES = grade <= 8 ? -ei + delta : (d <= 3 ? -ei : 0);
        } else {
            // P〜X: IT7 以下は Δ を加える
            ES = grade <= 7 ? -ei + delta : -ei;
        }
        return { upper: ES, lower: ES - T };
    }

    // "H7" / "js6" → { letter, grade, kind }
    function parseClass(s) {
        const m = /^\s*([A-Za-z]{1,2})\s*(\d{1,2})\s*$/.exec(String(s || ''));
        if (!m) return null;
        const letter = m[1];
        const grade = Number(m[2]);
        const isHole = letter[0] === letter[0].toUpperCase();
        const norm = isHole ? letter.toUpperCase() : letter.toLowerCase();
        const list = isHole ? HOLE_LETTERS : SHAFT_LETTERS;
        if (!list.includes(norm) || !GRADES.includes(grade)) return null;
        return { letter: norm, grade, kind: isHole ? 'hole' : 'shaft', label: norm + grade };
    }

    function tolerance(letter, grade, d) {
        if (!(d > 0 && d <= MAX_SIZE) || !IT[grade]) return null;
        const isHole = letter[0] === letter[0].toUpperCase();
        const t = isHole ? holeTol(letter, grade, d) : shaftTol(letter, grade, d);
        return t && { upper: t.upper + 0, lower: t.lower + 0 }; // -0 を 0 に
    }

    function fit(holeClass, shaftClass, d) {
        const h = parseClass(holeClass);
        const s = parseClass(shaftClass);
        if (!h || h.kind !== 'hole') return { error: '穴の公差クラスが読めません' };
        if (!s || s.kind !== 'shaft') return { error: '軸の公差クラスが読めません' };
        if (!(d > 0)) return { error: '基準寸法を入力してください' };
        if (d > MAX_SIZE) return { error: '500 mm までに対応しています' };
        const ht = tolerance(h.letter, h.grade, d);
        const st = tolerance(s.letter, s.grade, d);
        if (!ht) return { error: h.label + ' はこの寸法区分 (' + rangeLabel(d) + ') では規定されていません' };
        if (!st) return { error: s.label + ' はこの寸法区分 (' + rangeLabel(d) + ') では規定されていません' };

        // µm で計算 (浮動小数の誤差を避ける)
        const maxClear = ht.upper - st.lower;
        const minClear = ht.lower - st.upper;
        let type;
        if (minClear >= 0) type = 'clearance';
        else if (maxClear <= 0) type = 'interference';
        else type = 'transition';

        return {
            d,
            range: rangeLabel(d),
            hole: { cls: h.label, upper: ht.upper, lower: ht.lower, max: d + ht.upper / 1000, min: d + ht.lower / 1000, it: it(h.grade, d) },
            shaft: { cls: s.label, upper: st.upper, lower: st.lower, max: d + st.upper / 1000, min: d + st.lower / 1000, it: it(s.grade, d) },
            type,
            maxClearance: maxClear,           // 最大すきま (負なら最小しめしろ)
            minClearance: minClear,           // 最小すきま (負なら最大しめしろ)
            maxInterference: 0 - minClear,
            minInterference: 0 - maxClear
        };
    }

    root.SWB = root.SWB || {};
    root.SWB.iso286 = {
        HOLE_LETTERS, SHAFT_LETTERS, GRADES, MAX_SIZE,
        it, tolerance, fit, parseClass, rangeLabel
    };
})(typeof window !== 'undefined' ? window : globalThis);
