/* ============================================================
   SendCutSend の材質と板厚 (シート材)
   ------------------------------------------------------------
   出典: https://sendcutsend.com/materials/ と各材質ページ (2026年10月確認)
   SendCutSend はインチで板厚を管理しているので、ここもインチの
   表記をそのまま持ち、mm は 25.4 倍して出す。
   ラインナップが変わったら t の配列を直すだけで反映される。
     t: ['.040', ...]               … 材質全体の proc で加工
     t: [['.125', 'laser'], ...]    … 板厚ごとに加工方法が違う場合
   ============================================================ */
(function (root) {
    'use strict';

    const SCS = {
        updated: '2026年10月',
        source: 'https://sendcutsend.com/materials/',
        processes: {
            laser: 'レーザー',
            cnc: 'CNC ルーター',
            waterjet: 'ウォータージェット'
        },
        categories: [
            { id: 'metal', name: '金属' },
            { id: 'composite', name: '複合材' },
            { id: 'plastic', name: '樹脂' },
            { id: 'rubber', name: 'ゴム・ガスケット' },
            { id: 'wood', name: '木材・ボード' }
        ],
        materials: [
            // ---- 金属 ----
            { id: 'al5052', cat: 'metal', name: '5052 アルミ', en: '5052 H32 Aluminum', proc: 'laser', slug: '5052-aluminum',
                t: ['.040', '.063', '.080', '.090', '.100', '.125', '.187', '.250', '.313', '.375', '.500'] },
            { id: 'al6061', cat: 'metal', name: '6061 アルミ', en: '6061 T6 Aluminum', proc: 'laser', slug: '6061-aluminum',
                t: ['.040', '.063', '.080', '.100', '.125', '.187', '.250', '.313', '.375', '.500', '.625', '.750'] },
            { id: 'al7075', cat: 'metal', name: '7075 アルミ', en: '7075 T6 Aluminum', proc: 'laser', slug: '7075-aluminum',
                t: ['.125', '.190', '.250'] },
            { id: 'al2024', cat: 'metal', name: '2024 アルミ', en: '2024 T3 Aluminum', proc: 'laser', slug: 'laser-cut-2024-aluminum',
                t: ['.025'] },
            { id: 'mic6', cat: 'metal', name: 'MIC-6 鋳造アルミ', en: 'MIC-6 Cast Aluminum', proc: 'laser', slug: 'mic-6-cast-aluminum',
                t: ['.250', '.375', '.500'] },
            { id: 'mild', cat: 'metal', name: '軟鋼', en: 'Mild Steel (A36 / 1008 / 1018)', proc: 'laser', slug: 'mild-steel',
                t: ['.030', '.048', '.059', '.074', '.104', '.119', '.135', '.187', '.250', '.313', '.375', '.500'] },
            { id: 'g90', cat: 'metal', name: '亜鉛めっき鋼板', en: 'G90 Galvanized Steel', proc: 'laser', slug: 'g90-steel',
                t: ['.030', '.048', '.059', '.074'] },
            { id: 'ss304', cat: 'metal', name: 'ステンレス 304', en: '304 Stainless Steel', proc: 'laser', slug: 'stainless-steel',
                t: ['.030', '.048', '.060', '.074', '.100', '.125', '.187', '.250', '.375', '.500'] },
            { id: 'ss316', cat: 'metal', name: 'ステンレス 316', en: '316 Stainless Steel', proc: 'laser', slug: 'stainless-steel-316',
                t: ['.060', '.125', '.187', '.250'] },
            { id: 'cromo', cat: 'metal', name: 'クロモリ 4130', en: '4130 Chromoly', proc: 'laser', slug: '4130-chromoly',
                t: ['.050', '.063', '.125', '.190', '.250'] },
            { id: 'hc1095', cat: 'metal', name: '高炭素鋼 1095', en: '1095 High Carbon Steel', proc: 'laser', slug: '1095-high-carbon-steel',
                t: ['.125', '.187'] },
            { id: 'spring', cat: 'metal', name: 'ばね鋼 1075', en: '1075 Blue Temper Spring Steel', proc: 'laser', slug: '1075-blue-temper-spring-steel',
                t: ['.015'] },
            { id: 'ar400', cat: 'metal', name: '耐摩耗鋼 AR400', en: 'AR400', proc: 'laser', slug: 'ar400',
                t: ['.250'] },
            { id: 'ar500', cat: 'metal', name: '耐摩耗鋼 AR500', en: 'AR500', proc: 'laser', slug: 'ar500',
                t: ['.119', '.187', '.250', '.375', '.500'] },
            { id: 'magnacut', cat: 'metal', name: 'MagnaCut（刃物鋼）', en: 'CPM MagnaCut Stainless', proc: 'laser', slug: 'cpm-magnacut',
                t: ['.155'] },
            { id: 'brass', cat: 'metal', name: '真鍮', en: 'Brass', proc: 'laser', slug: 'brass',
                t: ['.040', '.063', '.125', '.187', '.250'] },
            { id: 'copper', cat: 'metal', name: '銅', en: 'Copper', proc: 'laser', slug: 'copper',
                t: ['.032', '.040', '.063', '.125', '.187', '.250'] },
            { id: 'ti2', cat: 'metal', name: 'チタン 2種', en: 'Grade 2 Titanium (CP2)', proc: 'laser', slug: 'titanium-cp2',
                t: ['.040'] },
            { id: 'ti5', cat: 'metal', name: 'チタン 64（Grade 5）', en: 'Grade 5 Titanium', proc: 'laser', slug: 'titanium',
                t: ['.040', '.063', '.125', '.187', '.250'] },

            // ---- 複合材 ----
            { id: 'carbon', cat: 'composite', name: 'カーボン（CFRP）', en: 'Carbon Fiber', proc: 'waterjet', slug: 'carbon-fiber',
                t: ['.040', '.063', '.079', '.118', '.157', '.197', '.315'] },
            { id: 'g10', cat: 'composite', name: 'G-10 / FR-4（ガラエポ）', en: 'G-10 / FR-4', proc: 'waterjet', slug: 'g10-fr4',
                t: ['.063', '.125', '.187', '.250', '.375', '.500'] },
            { id: 'phenolic', cat: 'composite', name: '布入りフェノール', en: 'LE Phenolic', proc: 'waterjet', slug: 'le-phenolic-linen',
                t: ['.125', '.250', '.375'] },
            { id: 'acm', cat: 'composite', name: 'アルミ複合板（ACM）', en: 'ACM Panel', proc: 'cnc', slug: 'acm',
                t: ['.118', '.236'] },

            // ---- 樹脂 ----
            { id: 'acrylic', cat: 'plastic', name: 'アクリル', en: 'Acrylic', proc: 'laser', slug: 'acrylic',
                t: ['.063', '.118', '.177', '.214', '.375', '.500'] },
            { id: 'delrin', cat: 'plastic', name: 'POM（デルリン）', en: 'Delrin', proc: 'laser', slug: 'delrin',
                t: [['.125', 'laser'], ['.270', 'cnc']] },
            { id: 'pc', cat: 'plastic', name: 'ポリカーボネート', en: 'Polycarbonate', proc: 'cnc', slug: 'polycarbonate',
                t: ['.118', '.177', '.220'] },
            { id: 'abs', cat: 'plastic', name: 'ABS', en: 'ABS', proc: 'cnc', slug: 'abs-plastic',
                t: ['.125', '.187', '.234'] },
            { id: 'hdpe', cat: 'plastic', name: 'HDPE', en: 'HDPE', proc: 'cnc', slug: 'hdpe',
                t: ['.187', '.250', '.375', '.500'] },
            { id: 'uhmw', cat: 'plastic', name: '超高分子量 PE（UHMW）', en: 'UHMW', proc: 'cnc', slug: 'uhmw',
                t: ['.375', '.500'] },
            { id: 'pp', cat: 'plastic', name: 'PP（透明）', en: 'Polypropylene Clear', proc: 'laser', slug: 'polypropylene',
                t: ['.030'] },
            { id: 'mylar', cat: 'plastic', name: 'マイラー（透明）', en: 'Mylar Clear', proc: 'laser', slug: 'mylar-clear',
                t: ['.005', '.010'] },
            { id: 'pefoam', cat: 'plastic', name: 'PE フォーム', en: 'Polyethylene Foam', proc: 'waterjet', slug: 'polyethylene-foam',
                t: ['.875', '1.125', '2.250'] },

            // ---- ゴム・ガスケット ----
            { id: 'neoprene', cat: 'rubber', name: 'ネオプレン', en: 'Neoprene Rubber', proc: 'waterjet', slug: 'neoprene',
                t: ['.063', '.125'] },
            { id: 'neoprenef', cat: 'rubber', name: '布入りネオプレン', en: 'Fabric Reinforced Neoprene', proc: 'waterjet', slug: 'neoprene-fabric-reinforced',
                t: ['.063', '.125'] },
            { id: 'nitrile', cat: 'rubber', name: 'ニトリル（NBR）', en: 'Nitrile Buna-N', proc: 'laser', slug: 'nitrile-buna',
                t: ['.063', '.125'] },
            { id: 'viton', cat: 'rubber', name: 'バイトン（FKM）', en: 'Viton FKM', proc: 'waterjet', slug: 'viton',
                t: ['.063', '.125'] },
            { id: 'cork', cat: 'rubber', name: 'コルク（ガスケット用）', en: 'Gasket Grade Cork', proc: 'laser', slug: 'gasket-grade-cork',
                t: ['.063', '.125'] },
            { id: 'garlock', cat: 'rubber', name: 'Garlock BLUE-GARD', en: 'Garlock BLUE-GARD', proc: 'laser', slug: 'garlock',
                t: ['.031'] },
            { id: 'vhb', cat: 'rubber', name: '3M VHB テープ', en: '3M VHB Tape', proc: 'laser', slug: '3m-vhb',
                t: ['.045'] },

            // ---- 木材・ボード ----
            { id: 'birch', cat: 'wood', name: 'バーチ合板', en: 'Baltic Birch Plywood', proc: 'laser', slug: 'baltic-birch-plywood',
                t: [['.125', 'laser'], ['.250', 'laser'], ['.354', 'cnc'], ['.472', 'cnc']] },
            { id: 'mdf', cat: 'wood', name: 'MDF', en: 'MDF', proc: 'laser', slug: 'mdf',
                t: [['.125', 'laser'], ['.250', 'laser'], ['.375', 'cnc'], ['.500', 'cnc']] },
            { id: 'hardboard', cat: 'wood', name: 'ハードボード', en: 'Hardboard', proc: 'laser', slug: 'hardboard',
                t: ['.125'] },
            { id: 'chipboard', cat: 'wood', name: 'チップボード', en: 'Chipboard', proc: 'laser', slug: 'chipboard',
                t: ['.030'] }
        ]
    };

    // 板厚を { label: '.125″', inch: 0.125, mm: 3.175, proc } に展開
    SCS.thicknesses = function (m) {
        return m.t.map(item => {
            const raw = Array.isArray(item) ? item[0] : item;
            const inch = parseFloat(raw);
            return { label: raw, inch, mm: inch * 25.4, proc: Array.isArray(item) ? item[1] : m.proc };
        });
    };
    SCS.url = m => SCS.source + m.slug + '/';
    // mm を小数 2 桁で (3.175 → "3.18"。toFixed だけだと 3.17 になる)
    SCS.mm2 = v => (Math.round(v * 100 + 1e-7) / 100).toFixed(2);
    // CAD 入力用に小数 3 桁 (.125 → "3.175")
    SCS.mm3 = v => (Math.round(v * 1000 + 1e-6) / 1000).toFixed(3);

    // 1/32 単位の分数で表せるなら返す (.125 → "1/8", 1.125 → "1-1/8")
    SCS.fraction = function (inch) {
        const whole = Math.floor(inch + 1e-9);
        const rest = inch - whole;
        if (rest < 1e-9) return whole ? String(whole) : null;
        for (const d of [2, 4, 8, 16, 32]) {
            const n = Math.round(rest * d);
            if (n > 0 && n < d && Math.abs(rest - n / d) <= 0.0006) {
                let nn = n, dd = d;
                while (nn % 2 === 0 && dd % 2 === 0) { nn /= 2; dd /= 2; }
                return (whole ? whole + '-' : '') + nn + '/' + dd;
            }
        }
        return null;
    };

    root.SWB = root.SWB || {};
    root.SWB.scs = SCS;
})(typeof window !== 'undefined' ? window : globalThis);
