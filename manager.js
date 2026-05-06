const grid = document.getElementById('shortcutsGrid');
const searchInput = document.getElementById('search');
const triggerDisplay = document.getElementById('currentTriggerDisplay');
const totalDisplay = document.getElementById('totalShortcuts');
const navDash = document.getElementById('nav-dash');
const navConfig = document.getElementById('nav-config');
const navCateg = document.getElementById('nav-categorias');
const viewCateg = document.getElementById('view-categorias');
const viewDash = document.getElementById('view-dashboard');
const viewSettings = document.getElementById('view-settings');
const importBtn = document.getElementById('btn-import');
const fileInput = document.getElementById('import-file');
let keyToDelete = null;
let deleteType = 'shortcut';

const closeModal = () => document.getElementById('editModal').style.display = 'none';
const closeConfirmModal = () => {
    document.getElementById('confirmModal').style.display = 'none';
    keyToDelete = null;
};

document.getElementById('btn-cancel-edit').addEventListener('click', closeModal);
document.getElementById('btn-cancel-confirm').addEventListener('click', closeConfirmModal);

function resetNavActive() {
    [navDash, navConfig, navCateg].forEach(item => item?.classList.remove('active'));
}

navDash.addEventListener('click', () => {
    resetNavActive();
    navDash.classList.add('active');
    viewDash.style.display = 'block';
    viewSettings.style.display = 'none';
    viewCateg.style.display = 'none';
    renderShortcuts(); 
});

navConfig.addEventListener('click', () => {
    resetNavActive();
    navConfig.classList.add('active');
    
    viewDash.style.display = 'none';
    viewCateg.style.display = 'none';
    viewSettings.style.display = 'block';

    chrome.storage.local.get(['trigger'], (res) => {
        const triggerInput = document.getElementById('input-global-trigger');
        if (triggerInput) {
            triggerInput.value = res.trigger || "//";
        }
    });
});

navCateg.addEventListener('click', () => {
    resetNavActive();
    navCateg.classList.add('active');
    viewDash.style.display = 'none';
    viewSettings.style.display = 'none';
    viewCateg.style.display = 'block';
    renderGestaoCategorias();
});

const btnSaveCateg = document.getElementById('save-category-btn');
if (btnSaveCateg) {
    btnSaveCateg.addEventListener('click', () => {
        const input = document.getElementById('input-nova-categoria');
        const alertBox = document.getElementById('Categoria-inline-alert');
        const nome = input.value.trim();

        if (!nome) {
            showInlineAlert(alertBox, "❌ Digite um nome para a categoria", "error");
            return;
        }

        chrome.storage.local.get(['customCategories'], (res) => {
            let categs = res.customCategories || ["Geral"];
            if (categs.includes(nome)) {
                showInlineAlert(alertBox, "⚠️ Esta categoria já existe", "error");
                return;
            }
            categs.push(nome);
            chrome.storage.local.set({ customCategories: categs }, () => {
                input.value = '';
                showInlineAlert(alertBox, `✅ Categoria "${nome}" criada!`, "success");
                renderGestaoCategorias();
            });
        });
    });
}

function showInlineAlert(box, msg, type) {
    if (!box) return;
    box.innerText = msg;
    box.className = `inline-alert ${type}`;
    setTimeout(() => box.className = 'inline-alert', 3000);
}

function renderGestaoCategorias() {
    chrome.storage.local.get(['customCategories'], (res) => {
        const categs = res.customCategories || ["Geral"];
        const lista = document.getElementById('lista-categorias-gestao');
        if (!lista) return;
        lista.innerHTML = '';

        categs.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'stat-card';
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; margin-bottom: 8px;';
            item.innerHTML = `
                <span style="font-weight: 600;">📁 ${cat}</span>
                ${cat !== 'Geral' ? `<button class="btn btn-del" data-cat="${cat}">Excluir</button>` : '<span style="font-size: 10px; color: #94a3b8;">PADRÃO</span>'}
            `;
            const delBtn = item.querySelector('.btn-del');
            if (delBtn) delBtn.onclick = () => openConfirmModal(cat, 'category');
            lista.appendChild(item);
        });
    });
}

function updateCategoryFilters(shortcuts, activeCat) {
    const container = document.getElementById('category-filter-container');
    if (!container) return;

    const cats = ['all', ...new Set(Object.values(shortcuts).map(s => (typeof s === 'object' ? s.category : 'Geral')))];
    container.innerHTML = '';

    cats.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `filter-chip ${activeCat === cat ? 'active' : ''}`;
        btn.innerText = cat === 'all' ? 'Ver Todos' : cat;
        btn.onclick = () => renderShortcuts(cat);
        container.appendChild(btn);
    });
}

function renderShortcuts(filterCat = 'all') {
    chrome.storage.local.get(['shortcuts', 'trigger'], (res) => {
        const shortcuts = res.shortcuts || {};
        grid.innerHTML = '';
        const keys = Object.keys(shortcuts);
        
        totalDisplay.innerText = keys.length;
        triggerDisplay.innerText = res.trigger || "//";

        updateCategoryFilters(shortcuts, filterCat);

        keys.forEach(key => {
            const data = shortcuts[key];
            const isObject = typeof data === 'object' && data !== null;
            const val = isObject ? data.value : data;
            const cat = isObject ? (data.category || "Geral") : "Geral";

            if (filterCat !== 'all' && cat !== filterCat) return;

            const emojiMatch = key.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
            const emoji = emojiMatch ? emojiMatch[0] : '📄';
            const cleanTitle = key.replace(emoji, '').trim();

            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('data-key', key.toLowerCase());
            card.innerHTML = `
                <div class="card-header">
                    <div class="emoji-circle">${emoji}</div>
                    <div style="display: flex; flex-direction: column;">
                        <div class="card-title">${cleanTitle}</div>
                        <span class="category-badge">${cat}</span>
                    </div>
                </div>
                <div class="card-body">${val}</div>
                <div class="card-actions">
                    <button class="btn btn-edit" data-key="${key}">Editar</button>
                    <button class="btn btn-del" data-key="${key}">Excluir</button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
});

grid.addEventListener('click', (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    if (e.target.classList.contains('btn-del')) openConfirmModal(key, 'shortcut');
    else if (e.target.classList.contains('btn-edit')) openEditModal(key);
});

function openConfirmModal(key, type = 'shortcut') {
    keyToDelete = key;
    deleteType = type;
    const msg = type === 'shortcut' 
        ? `Você deseja realmente excluir o atalho "${key}"?`
        : `Deseja remover a categoria "${key}"? Atalhos nela voltarão para "Geral".`;
    document.getElementById('confirmMessage').innerText = msg;
    document.getElementById('confirmModal').style.display = 'block';
}

const btnConfirmAction = document.getElementById('btn-confirm-action');
if (btnConfirmAction) {
    btnConfirmAction.addEventListener('click', () => {
        if (!keyToDelete) return;
        chrome.storage.local.get(['shortcuts', 'customCategories'], (res) => {
            if (deleteType === 'shortcut') {
                const s = res.shortcuts || {};
                delete s[keyToDelete];
                chrome.storage.local.set({ shortcuts: s }, () => finalizarAcaoExclusao("Atalho removido!", renderShortcuts));
            } else {
                let categs = res.customCategories || ["Geral"];
                let s = res.shortcuts || {};
                categs = categs.filter(c => c !== keyToDelete);
                Object.keys(s).forEach(k => { if (s[k].category === keyToDelete) s[k].category = "Geral"; });
                chrome.storage.local.set({ customCategories: categs, shortcuts: s }, () => {
                    finalizarAcaoExclusao("Categoria removida!", renderGestaoCategorias);
                    renderShortcuts();
                });
            }
        });
    });
}

function finalizarAcaoExclusao(mensagem, reloadFn) {
    closeConfirmModal(); 
    if (reloadFn) reloadFn();
    showToast(mensagem, "info");
}

function openEditModal(key) {
    chrome.storage.local.get(['shortcuts', 'customCategories'], (res) => {
        const s = res.shortcuts || {};
        const categs = res.customCategories || ["Geral"];
        const data = s[key];
        const val = (typeof data === 'object') ? data.value : data;
        const currentCat = (typeof data === 'object') ? (data.category || "Geral") : "Geral";

        const select = document.getElementById('edit-category');
        select.innerHTML = categs.map(c => `<option value="${c}">${c}</option>`).join('');

        document.getElementById('modalTitle').innerText = "Editar Atalho";
        document.getElementById('edit-old-key').value = key;
        document.getElementById('edit-key').value = key;
        document.getElementById('edit-value').value = val;
        select.value = currentCat;
        document.getElementById('editModal').style.display = 'block';
    });
}

document.getElementById('confirm-edit-btn').addEventListener('click', () => {
    const oldKey = document.getElementById('edit-old-key').value;
    const newKey = document.getElementById('edit-key').value.trim();
    const newVal = document.getElementById('edit-value').value.trim();
    const newCat = document.getElementById('edit-category').value;

    if (!newKey || !newVal) return showToast("Preencha tudo!", "error");

    chrome.storage.local.get(['shortcuts'], (res) => {
        const s = res.shortcuts || {};
        if (oldKey !== newKey && s[newKey]) return showToast("Já existe!", "error");
        if (oldKey) delete s[oldKey];
        s[newKey] = { value: newVal, category: newCat };
        chrome.storage.local.set({ shortcuts: s }, () => {
            closeModal();
            renderShortcuts();
            showToast("✅ Alterações salvas com sucesso!", "success");
        });
    });
});

document.getElementById('btn-open-create').addEventListener('click', () => {
    chrome.storage.local.get(['customCategories'], (res) => {
        const categs = res.customCategories || ["Geral"];
        const select = document.getElementById('edit-category');
        select.innerHTML = categs.map(c => `<option value="${c}">${c}</option>`).join('');
        
        document.getElementById('modalTitle').innerText = "Novo Atalho";
        document.getElementById('edit-old-key').value = ""; 
        document.getElementById('edit-key').value = "";
        document.getElementById('edit-value').value = "";
        select.value = "Geral";
        document.getElementById('editModal').style.display = 'block';
    });
});

document.getElementById('save-trigger-btn').addEventListener('click', () => {
    const triggerInput = document.getElementById('input-global-trigger');
    const alertBox = document.getElementById('config-inline-alert');
    const newTrigger = triggerInput.value.trim();
    
    if (newTrigger) {
        chrome.storage.local.set({ trigger: newTrigger }, () => {
            showToast(`Gatilho atualizado para: ${newTrigger}`, "success");

            if (alertBox) {
                alertBox.innerText = "✅ Alterações salvas com sucesso!";
                alertBox.className = "inline-alert success";
                setTimeout(() => { alertBox.className = "inline-alert"; }, 3000);
            }

            if (triggerDisplay) triggerDisplay.innerText = newTrigger;
            
            renderShortcuts();
        });
    } else {
        showToast("O gatilho não pode estar vazio!", "error");
    }
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

document.getElementById('btn-export').addEventListener('click', () => {
    chrome.storage.local.get(null, (data) => {
        if (Object.keys(data).length === 0) {
            showToast("Nada para exportar!", "error");
            return;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const dataFormatada = new Date().toISOString().split('T')[0];
        
        a.href = url;
        a.download = `fastmask_backup_${dataFormatada}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast("Backup exportado!", "success");
    });
});

importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            
            chrome.storage.local.set(config, () => {
                showToast("Importação concluída com sucesso!", "success");
                
                if (typeof renderShortcuts === "function") renderShortcuts();
                
                fileInput.value = ""; 
            });
        } catch (err) {
            showToast("Erro: Ficheiro JSON inválido", "error");
        }
    };
    reader.readAsText(file);
});

renderShortcuts();