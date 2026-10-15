/* ============================================================
   SULE WORKSTATION BOX — core
   ------------------------------------------------------------
   全ページ共通。<head> で同期読み込みして、描画前に
   テーマ (mint/banana/strawberry) とモード (day/night) を反映する。
     - SWB.TOOLS        ツール一覧 (ナビ・ホーム・パレット共通)
     - SWB.icon(name)   インラインSVGアイコン
     - SWB.prefs        テーマ / 昼夜モードの取得・変更
     - SWB.copy(text)   クリップボードへコピー + トースト
     - SWB.fmt(n)       数値の表示整形
     - SWB.store        localStorage ラッパー (失敗しても落ちない)
   ============================================================ */
(function () {
    'use strict';

    const SWB = (window.SWB = window.SWB || {});

    /* ---------- storage ---------- */
    const store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (e) {
                return fallback;
            }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode など */ }
        },
        remove(key) {
            try { localStorage.removeItem(key); } catch (e) { /* noop */ }
        }
    };
    SWB.store = store;

    /* ---------- icons (Lucide 互換の 24px ストローク) ---------- */
    const ICONS = {
        hex: '<path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5z"/><circle cx="12" cy="12" r="3.4"/>',
        ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
        bolt: '<path d="M7.5 3h9l2 3-2 3h-9l-2-3z"/><path d="M9.5 9v11a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9"/><path d="m9.5 13 5-1.5"/><path d="m9.5 16.5 5-1.5"/>',
        fit: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 1.5v3"/><path d="M12 19.5v3"/><path d="M17 12h4.5"/>',
        calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
        languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
        servo: '<rect x="2.5" y="10" width="15" height="10" rx="2"/><path d="M17.5 13H21"/><path d="M17.5 17H21"/><circle cx="7.5" cy="10" r="2.5"/><path d="m9.2 8.2 8.3-4.7"/><circle cx="18.5" cy="3" r=".6"/>',
        resistor: '<path d="M2 12h3.5l1.5-4.5 3 9 3-9 3 9 1.5-4.5H22"/>',
        home: '<path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
        search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
        moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
        sunmoon: '<path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
        copy: '<rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        swapH: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
        swapV: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
        x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        backspace: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6"/><path d="m12 9 6 6"/>',
        arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
        arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
        enter: '<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
        sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
        stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
        lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        star: '<path d="M11.48 3.5a.53.53 0 0 1 1.04 0l2.1 4.25a.53.53 0 0 0 .4.29l4.69.68a.53.53 0 0 1 .3.9l-3.4 3.31a.53.53 0 0 0-.15.47l.8 4.67a.53.53 0 0 1-.77.56l-4.2-2.2a.53.53 0 0 0-.49 0l-4.2 2.2a.53.53 0 0 1-.77-.56l.8-4.67a.53.53 0 0 0-.15-.47l-3.4-3.3a.53.53 0 0 1 .3-.91l4.69-.68a.53.53 0 0 0 .4-.29z"/>',
        plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
        battery: '<rect width="16" height="10" x="2" y="7" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/>',
        led: '<path d="M8 10a4 4 0 0 1 8 0v6H8z"/><path d="M6 16h12"/><path d="M10 16v5"/><path d="M14 16v3"/><path d="m4 4 2 2"/><path d="m20 4-2 2"/><path d="M12 1.5v2"/>',
        zap: '<path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z"/>',
        palette: '<circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>'
    };

    SWB.icon = function (name, cls) {
        return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    };

    /* ---------- tools ---------- */
    SWB.TOOLS = [
        { id: 'units', name: '単位変換', en: 'Units', href: 'units.html', icon: 'ruler', desc: '長さ・トルク・圧力・回転…', keys: 'unit tani henkan 単位 たんい mm inch kgf トルク 圧力' },
        { id: 'screws', name: 'ネジ', en: 'Screws', href: 'screws.html', icon: 'bolt', desc: '寸法・下穴・ばか穴・ざぐり', keys: 'neji screw bolt nut ねじ ボルト ナット 下穴 ばか穴 ざぐり タップ' },
        { id: 'fits', name: 'はめあい', en: 'Fits', href: 'fits.html', icon: 'fit', desc: 'ISO 286 公差・すきま・しめしろ', keys: 'fit tolerance kousa hameai 公差 はめあい H7 h7 iso286' },
        { id: 'calc', name: '電卓', en: 'Calc', href: 'calc.html', icon: 'calc', desc: '関数電卓・履歴・キーボード操作', keys: 'calc dentaku calculator 電卓 けいさん' },
        { id: 'translate', name: '翻訳', en: 'Translate', href: 'translate.html', icon: 'languages', desc: 'Claude Haiku 5.5', keys: 'translate honyaku 翻訳 english 英語' },
        { id: 'servo', name: 'サーボ', en: 'Servo', href: 'servo.html', icon: 'servo', desc: 'PCA9685 PWM・KRS ICS', keys: 'servo pwm pca9685 krs ics サーボ パルス' },
        { id: 'circuit', name: '回路', en: 'Circuit', href: 'circuit.html', icon: 'resistor', desc: '分圧・LED抵抗・カラーコード', keys: 'circuit resistor led ohm 抵抗 分圧 カラーコード オーム 回路 電子' }
    ];

    /* ---------- prefs: theme & day/night ---------- */
    const THEMES = [
        { id: 'mint', label: 'チョコミント', color: '#4FE2BF' },
        { id: 'banana', label: 'チョコバナナ', color: '#FFD43B' },
        { id: 'strawberry', label: 'ストロベリーチョコ', color: '#FF6F96' }
    ];
    const MODES = [
        { id: 'auto', label: '自動 (18時〜6時は夜)', icon: 'sunmoon' },
        { id: 'day', label: '昼モード', icon: 'sun' },
        { id: 'night', label: '夜モード', icon: 'moon' }
    ];
    const THEME_KEY = 'sule-workstation-theme'; // 旧サイトと同じキー (選択を引き継ぐ)
    const MODE_KEY = 'swb-mode';
    const listeners = [];

    function readRaw(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeRaw(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* noop */ }
    }

    function getTheme() {
        const v = readRaw(THEME_KEY);
        return THEMES.some(t => t.id === v) ? v : 'mint';
    }
    function getMode() {
        const v = readRaw(MODE_KEY);
        return MODES.some(m => m.id === v) ? v : 'auto';
    }
    function isNightHour(date) {
        const h = (date || new Date()).getHours();
        return h >= 18 || h < 6;
    }
    function resolvedMode() {
        const m = getMode();
        if (m === 'auto') return isNightHour() ? 'night' : 'day';
        return m;
    }

    function apply() {
        const root = document.documentElement;
        const theme = getTheme();
        const mode = resolvedMode();
        const changed = root.dataset.theme !== theme || root.dataset.mode !== mode;
        root.dataset.theme = theme;
        root.dataset.mode = mode;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = mode === 'night' ? '#1A110E' : '#3B2420';
        syncControls();
        if (changed) listeners.forEach(fn => fn({ theme, mode, setting: getMode() }));
    }

    SWB.prefs = {
        themes: THEMES,
        modes: MODES,
        theme: getTheme,
        mode: getMode,
        resolvedMode,
        setTheme(id) { if (THEMES.some(t => t.id === id)) { writeRaw(THEME_KEY, id); apply(); } },
        setMode(id) { if (MODES.some(m => m.id === id)) { writeRaw(MODE_KEY, id); apply(); } },
        cycleMode() {
            const i = MODES.findIndex(m => m.id === getMode());
            const next = MODES[(i + 1) % MODES.length];
            this.setMode(next.id);
            SWB.toast(next.label, next.icon);
        },
        onChange(fn) { listeners.push(fn); }
    };

    // 描画前に反映 (チラつき防止)
    apply();
    setInterval(apply, 60 * 1000);
    window.addEventListener('storage', e => { if (e.key === THEME_KEY || e.key === MODE_KEY) apply(); });

    /* ---------- controls (テーマ・モード切り替えUI) ---------- */
    function controlsHTML() {
        const sw = THEMES.map(t =>
            '<button type="button" class="swatch" data-swb-theme="' + t.id + '" style="--sw:' + t.color + '" aria-label="' + t.label + '" title="' + t.label + '" aria-pressed="false"></button>'
        ).join('');
        return '<div class="swatches" role="group" aria-label="カラーテーマ">' + sw + '</div>' +
            '<button type="button" class="icon-btn" data-swb-mode aria-label="昼夜モード"></button>';
    }

    function syncControls() {
        const theme = getTheme();
        const mode = getMode();
        const modeInfo = MODES.find(m => m.id === mode);
        document.querySelectorAll('[data-swb-theme]').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.swbTheme === theme));
        });
        document.querySelectorAll('[data-swb-mode]').forEach(b => {
            b.innerHTML = SWB.icon(modeInfo.icon);
            b.title = modeInfo.label + '（クリックで切り替え）';
            b.setAttribute('aria-label', '昼夜モード: ' + modeInfo.label);
        });
    }

    function bindControls(scope) {
        scope.querySelectorAll('[data-swb-theme]').forEach(b => {
            b.addEventListener('click', () => SWB.prefs.setTheme(b.dataset.swbTheme));
        });
        scope.querySelectorAll('[data-swb-mode]').forEach(b => {
            b.addEventListener('click', () => SWB.prefs.cycleMode());
        });
        syncControls();
    }

    SWB.mountControls = function (el) {
        el.insertAdjacentHTML('beforeend', controlsHTML());
        bindControls(el);
    };

    /* ---------- header ---------- */
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    SWB.isMac = isMac;

    function mountHeader(el) {
        const current = el.dataset.tool;
        const nav = SWB.TOOLS.map(t =>
            '<a href="' + t.href + '"' + (t.id === current ? ' aria-current="page"' : '') + '>' + SWB.icon(t.icon) + '<span>' + t.name + '</span></a>'
        ).join('');
        el.classList.add('swb-header');
        el.innerHTML =
            '<div class="swb-header__inner">' +
                '<a class="brand" href="index.html" aria-label="ホームへ戻る">' +
                    '<span class="brand__mark">' + SWB.icon('hex') + '</span>' +
                    '<span class="brand__name">SULE WORKSTATION<small>BOX · TOOLS</small></span>' +
                '</a>' +
                '<nav class="tool-nav" aria-label="ツール">' + nav + '</nav>' +
                '<div class="header-tools">' +
                    '<button type="button" class="palette-btn" data-swb-palette aria-label="ツール検索・クイック計算">' + SWB.icon('search') +
                        '<span class="palette-btn__label">検索・計算</span><span class="kbd">' + (isMac ? '⌘' : 'Ctrl') + ' K</span></button>' +
                    controlsHTML() +
                '</div>' +
            '</div>';
        bindControls(el);
        el.querySelector('[data-swb-palette]').addEventListener('click', () => SWB.palette.open());
        const active = el.querySelector('[aria-current="page"]');
        if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    /* ---------- toast ---------- */
    SWB.toast = function (message, icon) {
        let host = document.querySelector('.toast-host');
        if (!host) {
            host = document.createElement('div');
            host.className = 'toast-host';
            host.setAttribute('role', 'status');
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = SWB.icon(icon || 'check') + '<span></span>';
        t.lastChild.textContent = message;
        host.appendChild(t);
        while (host.children.length > 3) host.firstChild.remove();
        setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 260); }, 1800);
    };

    /* ---------- clipboard ---------- */
    SWB.copy = async function (text, label) {
        const value = String(text);
        let ok = false;
        try {
            await navigator.clipboard.writeText(value);
            ok = true;
        } catch (e) {
            // http (LAN上のスマホ等) では Clipboard API が使えないのでフォールバック
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
            ta.remove();
        }
        SWB.toast(ok ? (label ? label + ' をコピー' : 'コピーしました') : 'コピーできませんでした', ok ? 'check' : 'x');
        return ok;
    };

    /* ---------- number format ---------- */
    // 有効数字 sig 桁で丸め、桁区切りつきで返す。極端な値は指数表記。
    SWB.fmt = function (n, sig, opts) {
        opts = opts || {};
        if (n === null || n === undefined || Number.isNaN(n)) return '—';
        if (!Number.isFinite(n)) return n > 0 ? '∞' : '−∞';
        if (n === 0) return '0';
        sig = sig || 7;
        const abs = Math.abs(n);
        if (abs >= 1e12 || abs < 1e-6) {
            const [m, e] = n.toExponential(sig - 1).split('e');
            return String(parseFloat(m)) + 'e' + (Number(e) >= 0 ? '+' : '') + Number(e);
        }
        const rounded = parseFloat(n.toPrecision(sig));
        if (opts.group === false) return String(rounded);
        return rounded.toLocaleString('en-US', { maximumFractionDigits: 12 });
    };
    // 小数点以下 d 桁固定 (末尾ゼロを残す)
    SWB.fixed = function (n, d) {
        if (n === null || n === undefined || !Number.isFinite(n)) return '—';
        const v = Math.abs(n) < Math.pow(10, -d) / 2 ? 0 : n; // -0.000 を避ける
        return v.toFixed(d);
    };

    SWB.escape = function (s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    };

    SWB.params = new URLSearchParams(location.search);

    /* ---------- command palette (⌘K) ---------- */
    SWB.palette = (function () {
        let root = null;
        let items = [];
        let index = 0;

        function build(query) {
            const q = query.trim();
            const ql = q.toLowerCase();
            const out = [];

            // 1. クイック計算
            if (q && SWB.expr && /[\d)πe]/.test(q) && /[-+*/×÷^%√()]|sqrt|sin|cos|tan|log|ln|pi|π/i.test(q)) {
                const r = SWB.expr.evaluate(q);
                if (r.ok && Number.isFinite(r.value)) {
                    const shown = SWB.fmt(r.value, 12, { group: false });
                    out.push({ kind: 'calc', icon: 'calc', title: '= ' + shown, sub: q + '  — Enter でコピー', result: shown, run: () => SWB.copy(shown) });
                }
            }

            // 2. スマートジャンプ: M3 → ネジ, H7/g6 → はめあい
            const m = q.match(/^m\s*(\d+(?:\.\d+)?)$/i);
            if (m) {
                out.push({ icon: 'bolt', title: 'M' + m[1] + ' のネジ早見', sub: 'ピッチ・下穴・ばか穴・ざぐり', run: () => go('screws.html?size=M' + m[1]) });
            }
            const f = q.match(/^(?:(\d+(?:\.\d+)?)\s*)?([A-Z]{1,2}\d{1,2})\s*\/\s*([a-z]{1,2}\d{1,2})(?:\s*(\d+(?:\.\d+)?))?$/);
            if (f) {
                const d = f[1] || f[4];
                const fit = f[2] + '/' + f[3];
                out.push({ icon: 'fit', title: (d ? 'φ' + d + ' ' : '') + fit + ' のはめあい', sub: 'ISO 286 で計算', run: () => go('fits.html?fit=' + encodeURIComponent(fit) + (d ? '&d=' + d : '')) });
            }
            if (q.length > 1 && /^(t|tr|翻訳)\s+/i.test(q)) {
                const text = q.replace(/^(t|tr|翻訳)\s+/i, '');
                out.push({ icon: 'languages', title: '「' + text + '」を翻訳', sub: 'Claude Haiku 5.5', run: () => go('translate.html?text=' + encodeURIComponent(text)) });
            }

            // 3. ツール
            const tools = SWB.TOOLS.filter(t => !ql || (t.name + ' ' + t.en + ' ' + t.desc + ' ' + t.keys).toLowerCase().includes(ql));
            tools.forEach(t => out.push({ icon: t.icon, title: t.name + '  ' + t.en, sub: t.desc, run: () => go(t.href) }));
            if (!ql || 'home ホーム'.includes(ql)) out.push({ icon: 'home', title: 'ホーム', sub: 'SULE WORKSTATION BOX', run: () => go('index.html') });
            return out;
        }

        function go(href) { location.href = href; }

        function render() {
            const list = root.querySelector('.palette__list');
            if (!items.length) {
                list.innerHTML = '<div class="palette__item"><span class="pi-main faint">見つかりません。計算式・「M3」・「H7/g6 10」・「t 翻訳したい文」も使えます</span></div>';
                return;
            }
            list.innerHTML = items.map((it, i) =>
                '<button type="button" class="palette__item" role="option" data-i="' + i + '" aria-selected="' + (i === index) + '">' +
                    '<span class="pi-icon">' + SWB.icon(it.icon) + '</span>' +
                    '<span class="pi-main"><span class="' + (it.kind === 'calc' ? 'pi-result' : 'pi-title') + '"></span><span class="pi-sub" style="display:block"></span></span>' +
                '</button>'
            ).join('');
            list.querySelectorAll('.palette__item').forEach((btn, i) => {
                btn.querySelector(items[i].kind === 'calc' ? '.pi-result' : '.pi-title').textContent = items[i].title;
                btn.querySelector('.pi-sub').textContent = items[i].sub || '';
                btn.addEventListener('click', () => choose(i));
                btn.addEventListener('mousemove', () => { if (index !== i) { index = i; mark(); } });
            });
        }

        function mark() {
            root.querySelectorAll('.palette__item[data-i]').forEach(b => {
                const on = Number(b.dataset.i) === index;
                b.setAttribute('aria-selected', String(on));
                if (on) b.scrollIntoView({ block: 'nearest' });
            });
        }

        function choose(i) {
            const it = items[i];
            if (!it) return;
            if (it.kind !== 'calc') close();
            it.run();
        }

        function open(initial) {
            if (root) return;
            root = document.createElement('div');
            root.className = 'palette';
            root.innerHTML =
                '<div class="palette__box" role="dialog" aria-modal="true" aria-label="検索・クイック計算">' +
                    '<div class="palette__search">' + SWB.icon('search') +
                        '<input type="text" placeholder="ツール名・計算式・M3・H7/g6 10・t 翻訳する文" autocomplete="off" spellcheck="false" aria-label="検索">' +
                        '<span class="kbd">esc</span></div>' +
                    '<div class="palette__list" role="listbox"></div>' +
                    '<div class="palette__foot"><span><span class="kbd">↑</span><span class="kbd">↓</span>選択</span><span><span class="kbd">↵</span>開く / コピー</span></div>' +
                '</div>';
            document.body.appendChild(root);
            const input = root.querySelector('input');
            input.value = initial || '';
            const update = () => { items = build(input.value); index = 0; render(); };
            input.addEventListener('input', update);
            input.addEventListener('keydown', e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); index = Math.min(items.length - 1, index + 1); mark(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); index = Math.max(0, index - 1); mark(); }
                else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); choose(index); }
                else if (e.key === 'Escape') { e.preventDefault(); close(); }
            });
            root.addEventListener('mousedown', e => { if (e.target === root) close(); });
            update();
            input.focus();
        }

        function close() {
            if (!root) return;
            root.remove();
            root = null;
        }

        return { open, close, isOpen: () => !!root };
    })();

    function isTyping(el) {
        return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    }
    SWB.isTyping = isTyping;

    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            SWB.palette.isOpen() ? SWB.palette.close() : SWB.palette.open();
        } else if (e.key === '/' && !isTyping(document.activeElement) && !SWB.palette.isOpen()) {
            e.preventDefault();
            SWB.palette.open();
        }
    });

    /* ---------- boot ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-swb-header]').forEach(mountHeader);
        document.querySelectorAll('[data-swb-controls]').forEach(el => SWB.mountControls(el));
        document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = SWB.icon(el.dataset.icon); });
        syncControls();
    });
})();
