/* ============================================================
   SULE WORKSTATION BOX - 共通テーマ切り替え
   ------------------------------------------------------------
   使い方:
     1. <head> で theme.css の後にこのファイルを読み込む
     2. 切り替えUIを置きたい場所に <div data-theme-switcher></div>
        を書く (React ページでは SuleTheme.mountSwitcher(el) を呼ぶ)
   選択したテーマは localStorage に保存され、全ページで共有される。
   ============================================================ */
(function () {
    const THEMES = [
        { id: 'mint', label: 'チョコミント' },
        { id: 'banana', label: 'チョコバナナ' },
        { id: 'strawberry', label: 'ストロベリーチョコ' }
    ];
    const STORAGE_KEY = 'sule-workstation-theme';
    const listeners = [];

    function get() {
        let saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* localStorage無効環境 */ }
        return THEMES.some(t => t.id === saved) ? saved : THEMES[0].id;
    }

    function apply(id) {
        document.documentElement.setAttribute('data-theme', id);
        document.querySelectorAll('.sule-theme-select').forEach(sel => { sel.value = id; });
        listeners.forEach(fn => fn(id));
    }

    function set(id) {
        if (!THEMES.some(t => t.id === id)) return;
        try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* 保存できなくても切り替えは行う */ }
        apply(id);
    }

    const PALETTE_SVG =
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>' +
        '<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>' +
        '<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>' +
        '<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>' +
        '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>' +
        '</svg>';

    const ARROW_SVG =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="m6 9 6 6 6-6"/>' +
        '</svg>';

    function mountSwitcher(container) {
        if (!container || container.querySelector('.sule-theme-select')) return;
        container.insertAdjacentHTML('beforeend',
            '<div class="sule-theme-switcher">' +
                '<span class="sule-palette-icon">' + PALETTE_SVG + '</span>' +
                '<span class="sule-theme-select-wrap">' +
                    '<select class="sule-theme-select" aria-label="カラーテーマ">' +
                    THEMES.map(t => '<option value="' + t.id + '">' + t.label + '</option>').join('') +
                    '</select>' +
                    '<span class="sule-theme-arrow">' + ARROW_SVG + '</span>' +
                '</span>' +
            '</div>');
        const sel = container.querySelector('.sule-theme-select');
        sel.value = get();
        sel.addEventListener('change', e => set(e.target.value));
    }

    // 描画前にテーマを反映してチラつきを防ぐ (このファイルは head で同期読み込みする)
    apply(get());

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-theme-switcher]').forEach(mountSwitcher);
    });

    // 別タブ・別ページでの変更を反映
    window.addEventListener('storage', e => {
        if (e.key === STORAGE_KEY) apply(get());
    });

    window.SuleTheme = {
        themes: THEMES,
        get: get,
        set: set,
        mountSwitcher: mountSwitcher,
        onChange: function (fn) { listeners.push(fn); }
    };
})();
