//console.log("⚡ FastMask Turbo: Content Script Injetado com Sucesso!");
let currentTrigger = "//";
let shortcuts = {};
let activeElement = null;
let selectedIndex = 0;
let isCategoryView = false;

let icon = document.getElementById('fastmask-trigger-icon');
if (!icon) {
    icon = document.createElement('div');
    icon.id = 'fastmask-trigger-icon';
    icon.innerHTML = '⚡';
    icon.title = "FastMask Turbo - Atalhos"; 
    document.body.appendChild(icon);
}

let menu = document.getElementById('fastmask-floating-menu');
if (!menu) {
    menu = document.createElement('div');
    menu.id = 'fastmask-floating-menu';
    document.body.appendChild(menu);
}

function loadData() {
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get(['shortcuts', 'trigger'], (res) => {
        if (chrome.runtime.lastError) return;
        shortcuts = res.shortcuts || {};
        currentTrigger = res.trigger || "//";
    });
}

loadData();

function positionIcon(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
        const parent = el.closest('.editor-container') || el.parentElement;
        if (parent) {
            const pRect = parent.getBoundingClientRect();
            icon.style.display = 'flex';
            icon.style.left = `${pRect.right + window.scrollX - 35}px`;
            icon.style.top = `${pRect.top + window.scrollY + (pRect.height / 2) - 14}px`;
            return;
        }
    }

    icon.style.display = 'flex';
    icon.style.left = `${rect.right + window.scrollX - 35}px`;
    icon.style.top = `${rect.top + window.scrollY + (rect.height / 2) - 14}px`;
}

function getCaretCoordinates(element) {
    const rect = element.getBoundingClientRect();
    try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0).cloneRange();
            const clientRect = range.getBoundingClientRect();
            if (clientRect.left !== 0 && clientRect.top !== 0) {
                return { left: clientRect.left + window.scrollX, top: clientRect.bottom + window.scrollY };
            }
        }
    } catch(e) {}
    
    return { left: rect.left + window.scrollX + 15, top: rect.bottom + window.scrollY };
}

function closeMenuOnly() {
    menu.style.display = 'none';
    selectedIndex = 0;
}
function closeAll() {
    menu.style.display = 'none';
    icon.style.display = 'none';
    selectedIndex = 0;
}

function checkAndSetActiveElement(target) {
    if (!target) return;
    
    const lexicalEditor = target.closest('[data-lexical-editor="true"]') || target.closest('.ContentEditable__root');
    const normalInput = target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    const el = lexicalEditor || (normalInput ? target : null);
    
    if (el) {
        activeElement = el;
        loadData();
        positionIcon(el);
    }
}

document.addEventListener('focusin', (e) => checkAndSetActiveElement(e.target));
document.addEventListener('click', (e) => checkAndSetActiveElement(e.target));

document.addEventListener('keydown', (e) => {
    if (menu.style.display === 'block') {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
            return; 
        }
        
        if (e.target && e.target.id === 'fastmask-search-input') {
            return;
        }
    }

    const el = activeElement || e.target;
    if (!el) return;

    const isTalkdesk = el.classList.contains('ContentEditable__root') || el.isContentEditable;
    const isNormalInput = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';

    if (!isTalkdesk && !isNormalInput) return;

    setTimeout(() => {
        const val = isTalkdesk ? (el.innerText || "") : (el.value || "");
        
        if (val.trim() === "") {
            closeMenuOnly();
            return;
        }

        let textBeforeCursor = "";
        
        if (isTalkdesk) {
            try {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    if (range.startContainer.nodeType === Node.TEXT_NODE) {
                        textBeforeCursor = range.startContainer.textContent.slice(0, range.startOffset);
                    } else {
                        textBeforeCursor = val;
                    }
                } else {
                    textBeforeCursor = val;
                }
            } catch (err) {
                textBeforeCursor = val;
            }
        } 
        else {
            const cursorPos = el.selectionStart || 0;
            textBeforeCursor = val.slice(0, cursorPos);
        }

        const escapedTrigger = currentTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const triggerRegex = new RegExp(`(?:^|\\s)${escapedTrigger}([^\\s]*)$`);
        const match = textBeforeCursor.match(triggerRegex);

        if (match) {
            const searchTerm = match[1].toLowerCase();
            const coords = getCaretCoordinates(el);
            
            openMenu(coords.left, coords.top, searchTerm);
        } else {
            closeMenuOnly();
        }
    }, 10);
}, true);

document.addEventListener('keyup', (e) => {
    const el = activeElement || e.target;
    if (!el) return;
    
    const val = el.value || el.innerText || "";
    if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!val.includes(currentTrigger)) {
            closeMenuOnly();
        }
    }
});

function openMenu(left, top, searchTerm = "", forceCategoryView = false) {
    if (!activeElement) return;
    isCategoryView = forceCategoryView;

    chrome.storage.local.get(['shortcuts', 'customCategories'], (res) => {
        const shortcuts = res.shortcuts || {};
        const categories = res.customCategories || ["Geral"];
        
        menu.style.display = 'block';
        const rect = activeElement.getBoundingClientRect();
        
        if (left && top) {
            menu.style.left = `${left}px`;
            menu.style.top = `${top - 10}px`;
        } else {
            menu.style.left = `${rect.left + window.scrollX}px`;
            menu.style.top = `${rect.top + window.scrollY - 10}px`;
        }
        menu.style.transform = 'translateY(-100%)';

        menu.innerHTML = `
            <div class="menu-header" style="flex-direction: column; align-items: stretch; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span id="menu-title-text" style="font-weight: 800;">${isCategoryView ? '📁 EXPLORAR' : '🔍 SUGESTÕES'}</span>
                    <div id="fastmask-close-menu" style="cursor:pointer; padding: 0 5px; font-weight: bold;">✕</div>
                </div>
                <input type="text" id="fastmask-search-input" placeholder="Buscar atalho..." 
                    style="width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; box-sizing: border-box;">
            </div>
            <div id="fastmask-menu-content" style="max-height: 250px; overflow-y: auto;"></div>
        `;

        const searchInput = menu.querySelector('#fastmask-search-input');
        const content = menu.querySelector('#fastmask-menu-content');
        const titleText = menu.querySelector('#menu-title-text');

        if (isCategoryView) {
            searchInput.value = "";
            setTimeout(() => searchInput.focus(), 100);
        } else if (searchTerm) {
            searchInput.value = searchTerm;
        }

        const renderList = (filterText = "") => {
            content.innerHTML = '';
            const term = filterText.toLowerCase();

            if (isCategoryView && term === "") {
                titleText.innerText = "📁 CATEGORIAS";
                categories.forEach(cat => {
                    const div = document.createElement('div');
                    div.className = 'menu-itemFastMask';
                    div.innerHTML = `<div class="menu-emoji">📁</div><div class="menu-text-wrap"><span class="menu-key">${cat}</span></div>`;
                    div.onmousedown = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        showShortcutsByCategory(cat, shortcuts);
                    };
                    content.appendChild(div);
                });
                return;
            }

            titleText.innerText = term === "" ? "🔍 SUGESTÕES" : "🔎 RESULTADOS";
            
            const keys = Object.keys(shortcuts).filter(key => key.toLowerCase().includes(term));

            if (keys.length === 0) {
                content.innerHTML = '<div style="padding: 20px; font-size: 12px; color: #94a3b8; text-align: center;">Nenhum resultado</div>';
                return;
            }

            keys.forEach((key, index) => {
                renderShortcutItem(content, key, shortcuts[key], index, filterText);
            });
        };

        searchInput.oninput = (e) => renderList(e.target.value);
        searchInput.onmousedown = (e) => e.stopPropagation();

        menu.querySelector('#fastmask-close-menu').onmousedown = (e) => {
            e.preventDefault(); e.stopPropagation(); closeMenuOnly();
        };

        renderList(searchInput.value);
    });
}

function showShortcutsByCategory(category, allShortcuts) {
    const content = menu.querySelector('#fastmask-menu-content');
    const title = menu.querySelector('#menu-title-text');
    
    title.innerHTML = `<span id="fastmask-back-cats" style="cursor:pointer; color: #2563eb;">⬅ Voltar</span> | ${category}`;
    content.innerHTML = '';

    menu.querySelector('#fastmask-back-cats').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        openMenu(null, null, "", true);
    };

    const keys = Object.keys(allShortcuts).filter(key => {
        const item = allShortcuts[key];
        const itemCat = (typeof item === 'object' && item !== null) ? (item.category || 'Geral') : 'Geral';
        return itemCat === category;
    });

    if (keys.length === 0) {
        content.innerHTML = '<div style="padding:15px; font-size:12px; color:#94a3b8; text-align:center;">Nenhum atalho nesta categoria.</div>';
        return;
    }

    keys.forEach((key, index) => {
        renderShortcutItem(content, key, allShortcuts[key], index, "");
    });
}

function renderShortcutItem(container, key, data, index, searchTerm) {
    const div = document.createElement('div');
    div.className = `menu-itemFastMask ${index === selectedIndex ? 'selected' : ''}`;
    div.setAttribute('data-key', key);
    
    const isObj = typeof data === 'object' && data !== null;
    const contentText = isObj ? data.value : data;
    
    const emojiMatch = key.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    const emoji = emojiMatch ? emojiMatch[0] : '📄';
    const cleanKey = key.replace(emoji, '').trim();

    div.innerHTML = `
        <div class="menu-emoji">${emoji}</div>
        <div class="menu-text-wrap">
            <span class="menu-key">${cleanKey}</span>
            <span class="menu-preview">${contentText.substring(0, 35)}...</span>
        </div>
    `;

    div.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        insertText(key, searchTerm, contentText);
    };
    container.appendChild(div);
}

function insertText(key, searchTerm = "", forcedContent = null) {
    if (!activeElement) return;

    let replacement = forcedContent;
    if (!replacement) {
        const data = shortcuts[key];
        if (!data) return;
        replacement = (typeof data === 'object' && data !== null) ? data.value : data;
    }

    if (!replacement) return;

    replacement = replacement.replace(/[\r\n]+$/, '');

    if (activeElement.isContentEditable || activeElement.classList.contains('ContentEditable__root')) {
        activeElement.focus();
        
        const currentText = (activeElement.innerText || "").trim().replace(/[\r\n]+$/, '');
        const escapedTrigger = currentTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexGatilho = new RegExp(`${escapedTrigger}${escapedTerm}$`, 'i');

        let textoFinal = "";
        if (regexGatilho.test(currentText)) {
            textoFinal = currentText.replace(regexGatilho, replacement);
        } else {
            textoFinal = currentText + replacement;
        }

        textoFinal = textoFinal.replace(/[\r\n]+$/, '');

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const selectAllEvent = new KeyboardEvent('keydown', {
            key: 'a',
            code: 'KeyA',
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true,
            cancelable: true
        });
        
        activeElement.dispatchEvent(selectAllEvent);

        setTimeout(() => {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', textoFinal);

            const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dataTransfer
            });

            activeElement.dispatchEvent(pasteEvent);
            
            setTimeout(() => {
                const events = ['input', 'change', 'blur'];
                events.forEach(eventName => {
                    activeElement.dispatchEvent(new Event(eventName, { bubbles: true }));
                });
            }, 30);
        }, 10);

    } else {
        activeElement.focus();
        
        const content = activeElement.value;
        const escapedTrigger = currentTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const replaceRegex = new RegExp(`${escapedTrigger}[^\\s]*$`, 'i');

        let novoValor = "";
        if (replaceRegex.test(content)) {
            novoValor = content.replace(replaceRegex, replacement);
        } else {
            const fallbackLength = currentTrigger.length + searchTerm.length;
            novoValor = content.slice(0, -fallbackLength) + replacement;
        }

        novoValor = novoValor.replace(/[\r\n]+$/, '');

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
            || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(activeElement, novoValor);
        } else {
            activeElement.value = novoValor;
        }

        const events = ['input', 'change', 'blur'];
        events.forEach(eventName => {
            activeElement.dispatchEvent(new Event(eventName, { bubbles: true }));
        });
    }
    
    closeAll();
}

document.addEventListener('keydown', (e) => {
    if (menu.style.display === 'block') {
        const items = menu.querySelectorAll('.menu-itemFastMask');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selectedItem = items[selectedIndex];
            if (selectedItem) {
                const key = selectedItem.getAttribute('data-key');
                const menuSearchInput = menu.querySelector('#fastmask-search-input');
                const termUsed = menuSearchInput ? menuSearchInput.value : "";
                insertText(key, termUsed);
            }
        } else if (e.key === 'Escape') {
            closeAll();
        }
    }
}, true);

function updateSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
        if (index === selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

document.addEventListener('mousedown', (e) => {
    if (e.target !== icon && !menu.contains(e.target)) {
        closeMenuOnly(); 
        if (!e.target.matches('textarea') && !e.target.isContentEditable && !e.target.classList.contains('ContentEditable__root')) {
            closeAll();
        }
    }
});

icon.onmousedown = (e) => {
    e.preventDefault(); e.stopPropagation();
    openMenu(null, null, "", true);
};
