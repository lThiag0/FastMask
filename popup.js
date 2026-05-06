const saveBtn = document.getElementById('save');
const triggerInput = document.getElementById('triggerInput');
const shortIn = document.getElementById('short');
const longIn = document.getElementById('long');
const openManagerBtn = document.getElementById('openManager');
const statCountEl = document.getElementById('statCount');
const emojiBtn = document.getElementById('emojiBtn');
const duplicateBadge = document.getElementById('duplicateBadge');
const categorySelect = document.getElementById('categoryInput');
const categorySelectWrapper = document.getElementById('categorySelectWrapper');
const newCategoryWrapper = document.getElementById('newCategoryWrapper');
const newCategoryName = document.getElementById('newCategoryName');
const confirmCat = document.getElementById('confirmCat');
const cancelCat = document.getElementById('cancelCat');

openManagerBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

function loadCategories() {
    chrome.storage.local.get(['customCategories'], (res) => {
        const categories = res.customCategories || ["Geral"];
        
        categorySelect.innerHTML = '';

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = `📁 ${cat}`;
            categorySelect.appendChild(opt);
        });

        const newOpt = document.createElement('option');
        newOpt.value = "NEW_CAT";
        newOpt.innerText = "➕ Criar Nova Categoria...";
        categorySelect.appendChild(newOpt);
    });
}

categorySelect.addEventListener('change', () => {
    if (categorySelect.value === "NEW_CAT") {
        categorySelectWrapper.style.display = 'none';
        newCategoryWrapper.style.display = 'flex';
        newCategoryName.focus();
    }
});

confirmCat.addEventListener('click', (e) => {
    e.preventDefault();
    const cleanCat = newCategoryName.value.trim();

    if (cleanCat !== "") {
        chrome.storage.local.get(['customCategories'], (res) => {
            const categories = res.customCategories || ["Geral"];
            
            if (!categories.includes(cleanCat)) {
                categories.push(cleanCat);
                chrome.storage.local.set({ customCategories: categories }, () => {
                    loadCategories();
                    
                    setTimeout(() => {
                        categorySelect.value = cleanCat;
                        exitNewCategoryMode();
                    }, 100);
                });
            } else {
                categorySelect.value = cleanCat;
                exitNewCategoryMode();
            }
        });
    }
});

cancelCat.addEventListener('click', (e) => {
    e.preventDefault();
    exitNewCategoryMode();
    categorySelect.selectedIndex = 0; 
});

function exitNewCategoryMode() {
    newCategoryWrapper.style.display = 'none';
    categorySelectWrapper.style.display = 'block';
    newCategoryName.value = '';
}

emojiBtn.addEventListener('click', () => {
    shortIn.focus();
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Dica: Use Win + Ponto (.)";
    saveBtn.style.background = "#6366f1"; 
    
    setTimeout(() => {
        saveBtn.innerText = originalText;
        saveBtn.style.background = "";
    }, 2500);
});

loadCategories();

shortIn.addEventListener('input', () => {
    const key = shortIn.value.trim();
    
    if (!key) {
        duplicateBadge.style.display = 'none';
        resetSaveButton();
        return;
    }

    chrome.storage.local.get(['shortcuts'], (res) => {
        const shortcuts = res.shortcuts || {};
        
        if (shortcuts[key]) {
            duplicateBadge.style.display = 'block';
            saveBtn.innerText = "⚠️ Sobrescrever Atalho";
            saveBtn.style.background = "#f59e0b"; 
        } else {
            duplicateBadge.style.display = 'none';
            resetSaveButton();
        }
    });
});

function resetSaveButton() {
    saveBtn.innerText = "Adicionar";
    saveBtn.style.background = ""; 
}

saveBtn.addEventListener('click', () => {
    const key = shortIn.value.trim();
    const val = longIn.value.trim();
    const category = categorySelect.value;
    
    if (key && val && category !== "NEW_CAT") {
        chrome.storage.local.get(['shortcuts'], (res) => {
            const shortcuts = res.shortcuts || {};
            
            shortcuts[key] = {
                value: val,
                category: category
            };
            
            chrome.storage.local.set({ shortcuts }, () => {
                shortIn.value = '';
                longIn.value = '';
                duplicateBadge.style.display = 'none';
                saveBtn.innerText = "✅ Salvo com Sucesso!";
                const originalBg = saveBtn.style.background;
                saveBtn.style.background = "#059669"; 
                
                setTimeout(() => {
                    saveBtn.style.background = originalBg;
                    resetSaveButton();
                    updateStats();
                    if(typeof loadCategorySuggestions === 'function') loadCategorySuggestions();
                }, 1500);
            });
        });
    } else {
        const originalText = saveBtn.innerText;
        saveBtn.innerText = "❌ Preencha os campos!";
        saveBtn.classList.add('btn-error');
        saveBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            saveBtn.classList.remove('btn-error');
            saveBtn.innerText = originalText;
            saveBtn.style.pointerEvents = 'auto';
            resetSaveButton();
        }, 2000);
    }
});

function updateStats() {
    chrome.storage.local.get(['shortcuts', 'trigger'], (res) => {
        const shortcuts = res.shortcuts || {};
        const count = Object.keys(shortcuts).length;
        if (statCountEl) statCountEl.innerText = count;
        if (triggerInput) triggerInput.value = res.trigger || "//";
    });
}

triggerInput.addEventListener('input', () => {
    chrome.storage.local.set({ trigger: triggerInput.value });
});

updateStats();