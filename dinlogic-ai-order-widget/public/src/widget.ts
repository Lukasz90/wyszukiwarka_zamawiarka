import { addLinesToCart, parseTranscript, searchProducts, extractOcrText } from './services/rest';
import { createRecognition, hasBrowserSTT } from './services/stt';
import type { ProductSummary, TranscriptLine, WorkingCartLine } from './types';

interface WidgetState {
    query: string;
    results: ProductSummary[];
    loading: boolean;
    cart: WorkingCartLine[];
    submitting: boolean;
    message: { text: string; type: 'success' | 'error' | 'info' } | null;
    transcriptLines: TranscriptLine[];
}

const config = window.DinlogicAIWConfig || {
    currency: 'PLN',
    locale: 'pl-PL',
    priceDecimals: 2,
};

const formatter = new Intl.NumberFormat(config.locale || 'pl-PL', {
    style: 'currency',
    currency: config.currency || 'PLN',
    minimumFractionDigits: config.priceDecimals ?? 2,
    maximumFractionDigits: config.priceDecimals ?? 2,
});

function formatMoney(value: number | null | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return formatter.format(0);
    }
    return formatter.format(value);
}

function buildBadge(label: string): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'dinlogic-aiw__badge';
    badge.textContent = label;
    return badge;
}

function createMessageElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'dinlogic-aiw__message dinlogic-aiw__message--info';
    el.setAttribute('role', 'status');
    el.style.display = 'none';
    return el;
}

function updateMessage(el: HTMLDivElement, message: WidgetState['message']) {
    if (!message) {
        el.style.display = 'none';
        el.textContent = '';
        return;
    }

    el.style.display = 'block';
    el.textContent = message.text;
    el.className = `dinlogic-aiw__message dinlogic-aiw__message--${message.type}`;
}

function createResultsList(state: WidgetState, onAdd: (product: ProductSummary, qty: number) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dinlogic-aiw__results';

    if (state.loading) {
        const loading = document.createElement('div');
        loading.textContent = 'Szukam produktów…';
        container.appendChild(loading);
        return container;
    }

    if (!state.results.length) {
        const empty = document.createElement('div');
        empty.className = 'dinlogic-aiw__empty';
        empty.textContent = 'Brak wyników. Wpisz nazwę produktu, aby rozpocząć.';
        container.appendChild(empty);
        return container;
    }

    const list = document.createElement('ul');
    list.className = 'dinlogic-aiw__result-list';

    state.results.forEach((product, index) => {
        const item = document.createElement('li');
        item.className = 'dinlogic-aiw__result-item';

        if (index === 0) {
            item.classList.add('dinlogic-aiw__result-item--best');
            const badge = buildBadge('Najlepsze dopasowanie');
            badge.style.alignSelf = 'flex-start';
            item.appendChild(badge);
        }

        const details = document.createElement('div');
        details.className = 'dinlogic-aiw__result-details';

        const title = document.createElement('strong');
        title.textContent = product.name;
        details.appendChild(title);

        if (product.sku) {
            const sku = document.createElement('span');
            sku.textContent = `SKU: ${product.sku}`;
            sku.style.color = '#52606d';
            sku.style.fontSize = '0.85rem';
            details.appendChild(sku);
        }

        if (product.unit) {
            const unit = document.createElement('span');
            unit.textContent = `Jednostka: ${product.unit}`;
            unit.style.fontSize = '0.85rem';
            details.appendChild(unit);
        }

        const prices = document.createElement('div');
        prices.className = 'dinlogic-aiw__result-prices';

        const before = document.createElement('span');
        before.innerHTML = `<span style="color:#52606d;">Przed rabatem:</span> <strong>${formatMoney(product.regular_price ?? product.price)}</strong>`;
        prices.appendChild(before);

        const after = document.createElement('span');
        after.innerHTML = `<span style="color:#0f172a;">Po rabacie:</span> <strong>${formatMoney(product.price)}</strong>`;
        prices.appendChild(after);

        details.appendChild(prices);

        const actions = document.createElement('div');
        actions.className = 'dinlogic-aiw__result-actions';

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = '1';
        qtyInput.value = '1';
        qtyInput.setAttribute('aria-label', `Ilość dla ${product.name}`);
        actions.appendChild(qtyInput);

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.textContent = 'Dodaj do listy';
        addButton.addEventListener('click', () => {
            const qty = Math.max(1, Number.parseInt(qtyInput.value, 10) || 1);
            onAdd(product, qty);
        });
        actions.appendChild(addButton);

        item.appendChild(details);
        item.appendChild(actions);
        list.appendChild(item);
    });

    container.appendChild(list);
    return container;
}

function createTranscriptPreview(state: WidgetState, onTrySearch: (text: string) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dinlogic-aiw__transcript';

    if (!state.transcriptLines.length) {
        return container;
    }

    const title = document.createElement('h3');
    title.textContent = 'Rozpoznane linie';
    title.style.margin = '0';
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = 'dinlogic-aiw__transcript-list';

    state.transcriptLines.forEach((line) => {
        const item = document.createElement('div');
        item.className = 'dinlogic-aiw__transcript-line';

        const text = document.createElement('span');
        text.textContent = line.raw;
        item.appendChild(text);

        const meta = document.createElement('span');
        meta.style.textAlign = 'right';
        meta.style.display = 'flex';
        meta.style.gap = '6px';
        meta.style.alignItems = 'center';

        if (line.family) {
            const family = document.createElement('strong');
            family.textContent = line.family;
            meta.appendChild(family);
        }

        if (typeof line.confidence === 'number') {
            const confidence = document.createElement('span');
            confidence.textContent = `${Math.round(line.confidence * 100)}%`;
            confidence.style.fontSize = '0.8rem';
            meta.appendChild(confidence);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Szukaj';
        button.style.background = '#2563eb';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.padding = '4px 10px';
        button.style.borderRadius = '999px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => onTrySearch(line.raw));

        meta.appendChild(button);
        item.appendChild(meta);
        list.appendChild(item);
    });

    container.appendChild(list);
    return container;
}

function createCartTable(state: WidgetState, onRemove: (productId: number) => void, onSubmit: () => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dinlogic-aiw__cart';

    if (!state.cart.length) {
        const empty = document.createElement('div');
        empty.className = 'dinlogic-aiw__empty';
        empty.textContent = 'Koszyk roboczy jest pusty. Dodaj produkty z listy po lewej.';
        container.appendChild(empty);
        return container;
    }

    const table = document.createElement('table');
    table.className = 'dinlogic-aiw__cart-table';

    const head = document.createElement('thead');
    head.innerHTML = '<tr><th>Produkt</th><th>Ilość</th><th>Cena przed rabatem</th><th>Cena po rabacie</th><th></th></tr>';
    table.appendChild(head);

    const body = document.createElement('tbody');

    let totalBefore = 0;
    let totalAfter = 0;

    state.cart.forEach((line) => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = line.product.name;
        row.appendChild(nameCell);

        const qtyCell = document.createElement('td');
        qtyCell.textContent = String(line.qty);
        row.appendChild(qtyCell);

        const beforeValue = (line.product.regular_price ?? line.product.price) * line.qty;
        totalBefore += beforeValue;
        const beforeCell = document.createElement('td');
        beforeCell.textContent = formatMoney(beforeValue);
        row.appendChild(beforeCell);

        const afterValue = line.product.price * line.qty;
        totalAfter += afterValue;
        const afterCell = document.createElement('td');
        afterCell.textContent = formatMoney(afterValue);
        row.appendChild(afterCell);

        const actionsCell = document.createElement('td');
        actionsCell.style.textAlign = 'right';
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Usuń';
        removeButton.style.background = '#ef4444';
        removeButton.style.color = '#fff';
        removeButton.style.border = 'none';
        removeButton.style.padding = '6px 10px';
        removeButton.style.borderRadius = '6px';
        removeButton.style.cursor = 'pointer';
        removeButton.addEventListener('click', () => onRemove(line.product.id));
        actionsCell.appendChild(removeButton);
        row.appendChild(actionsCell);

        body.appendChild(row);
    });

    table.appendChild(body);
    container.appendChild(table);

    const totals = document.createElement('div');
    totals.style.display = 'flex';
    totals.style.justifyContent = 'space-between';
    totals.style.fontWeight = '600';
    totals.innerHTML = `<span>Razem przed rabatem: ${formatMoney(totalBefore)}</span><span>Razem po rabacie: ${formatMoney(totalAfter)}</span>`;
    container.appendChild(totals);

    const actions = document.createElement('div');
    actions.className = 'dinlogic-aiw__cart-actions';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.textContent = state.submitting ? 'Dodawanie…' : 'Wyślij do koszyka';
    submit.disabled = state.submitting;
    submit.addEventListener('click', () => onSubmit());

    actions.appendChild(submit);
    container.appendChild(actions);

    return container;
}

function findLine(cart: WorkingCartLine[], productId: number): WorkingCartLine | undefined {
    return cart.find((line) => line.product.id === productId);
}

function initWidget() {
    const root = document.getElementById('dinlogic-ai-order-widget');
    if (!root) {
        return;
    }

    root.innerHTML = '';

    const state: WidgetState = {
        query: '',
        results: [],
        loading: false,
        cart: [],
        submitting: false,
        message: null,
        transcriptLines: [],
    };

    const container = document.createElement('div');
    container.className = 'dinlogic-aiw';
    root.appendChild(container);

    const messageEl = createMessageElement();
    container.appendChild(messageEl);

    const grid = document.createElement('div');
    grid.className = 'dinlogic-aiw__grid';
    container.appendChild(grid);

    const searchPanel = document.createElement('section');
    searchPanel.className = 'dinlogic-aiw__panel';
    grid.appendChild(searchPanel);

    const cartPanel = document.createElement('section');
    cartPanel.className = 'dinlogic-aiw__panel';
    grid.appendChild(cartPanel);

    const searchTitle = document.createElement('h2');
    searchTitle.textContent = 'Wyszukiwarka i lista propozycji';
    searchPanel.appendChild(searchTitle);

    const searchField = document.createElement('div');
    searchField.className = 'dinlogic-aiw__field';
    searchPanel.appendChild(searchField);

    const searchLabel = document.createElement('label');
    searchLabel.textContent = 'Wpisz nazwę produktu';
    searchLabel.setAttribute('for', 'dinlogic-aiw-search-input');
    searchField.appendChild(searchLabel);

    const searchInputWrapper = document.createElement('div');
    searchInputWrapper.className = 'dinlogic-aiw__search-input';
    searchField.appendChild(searchInputWrapper);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'dinlogic-aiw-search-input';
    searchInput.placeholder = 'np. „YDYp 3×2,5” lub „wago 221”';
    searchInputWrapper.appendChild(searchInput);

    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.textContent = 'Szukaj';
    searchInputWrapper.appendChild(searchButton);

    const actionRow = document.createElement('div');
    actionRow.className = 'dinlogic-aiw__actions';
    searchPanel.appendChild(actionRow);

    const voiceButton = document.createElement('button');
    voiceButton.type = 'button';
    voiceButton.textContent = hasBrowserSTT() ? '🎙️ Komenda głosowa' : '🎙️ Brak wsparcia';
    voiceButton.disabled = !hasBrowserSTT();
    actionRow.appendChild(voiceButton);

    const fileLabel = document.createElement('label');
    fileLabel.textContent = '📷 Wczytaj listę';
    fileLabel.style.cursor = 'pointer';
    actionRow.appendChild(fileLabel);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf';
    fileLabel.appendChild(fileInput);

    const resultsContainer = document.createElement('div');
    searchPanel.appendChild(resultsContainer);

    const transcriptContainer = document.createElement('div');
    searchPanel.appendChild(transcriptContainer);

    const cartTitle = document.createElement('h2');
    cartTitle.textContent = 'Koszyk roboczy i podsumowanie';
    cartPanel.appendChild(cartTitle);

    const cartContainer = document.createElement('div');
    cartPanel.appendChild(cartContainer);

    let recognition: ReturnType<typeof createRecognition> | null = null;

    function setState(patch: Partial<WidgetState>) {
        Object.assign(state, patch);
        render();
    }

    function addToWorkingCart(product: ProductSummary, qty: number) {
        const existing = findLine(state.cart, product.id);
        if (existing) {
            existing.qty += qty;
        } else {
            state.cart.push({ product, qty });
        }
        setState({ cart: state.cart, message: { text: `Dodano ${qty} × ${product.name} do koszyka roboczego.`, type: 'success' } });
    }

    function removeFromCart(productId: number) {
        state.cart = state.cart.filter((line) => line.product.id !== productId);
        setState({ cart: state.cart, message: { text: 'Usunięto pozycję z koszyka roboczego.', type: 'info' } });
    }

    async function submitCart() {
        if (!state.cart.length) {
            setState({ message: { text: 'Koszyk roboczy jest pusty.', type: 'info' } });
            return;
        }

        try {
            setState({ submitting: true, message: { text: 'Dodaję pozycje do koszyka…', type: 'info' } });
            const payload = state.cart.map((line) => ({
                product_id: line.product.id,
                qty: line.qty,
                variation: line.variation,
            }));
            const response = await addLinesToCart(payload);
            const result = await response.json();
            const errors = (result.results || []).filter((item: any) => item.status === 'error');
            if (errors.length) {
                setState({
                    submitting: false,
                    message: { text: `Dodano z błędami (${errors.length}). Sprawdź szczegóły w koszyku WooCommerce.`, type: 'error' },
                });
                return;
            }

            setState({
                submitting: false,
                cart: [],
                message: { text: 'Pozycje zostały dodane do koszyka WooCommerce.', type: 'success' },
            });
        } catch (error: any) {
            setState({ submitting: false, message: { text: error?.message || 'Wystąpił błąd podczas dodawania do koszyka.', type: 'error' } });
        }
    }

    async function performSearch(query: string) {
        const trimmed = query.trim();
        setState({ query, loading: !!trimmed });

        if (!trimmed) {
            setState({ results: [], loading: false });
            return;
        }

        try {
            const response = await searchProducts(trimmed, 1, 10);
            setState({ results: response.items, loading: false });
        } catch (error: any) {
            setState({
                loading: false,
                message: { text: error?.message || 'Nie udało się pobrać wyników wyszukiwania.', type: 'error' },
            });
        }
    }

    function render() {
        updateMessage(messageEl, state.message);
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(createResultsList(state, addToWorkingCart));

        transcriptContainer.innerHTML = '';
        transcriptContainer.appendChild(createTranscriptPreview(state, (text) => {
            searchInput.value = text;
            performSearch(text);
        }));

        cartContainer.innerHTML = '';
        cartContainer.appendChild(createCartTable(state, removeFromCart, submitCart));
    }

    let debounceTimeout: number | undefined;

    function handleDebouncedSearch(value: string) {
        if (debounceTimeout) {
            window.clearTimeout(debounceTimeout);
        }
        debounceTimeout = window.setTimeout(() => performSearch(value), 300);
    }

    searchInput.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        handleDebouncedSearch(target.value);
    });

    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch(searchInput.value);
        }
    });

    voiceButton.addEventListener('click', async () => {
        if (!hasBrowserSTT()) {
            return;
        }

        if (!recognition) {
            recognition = createRecognition(
                async (transcript) => {
                    setState({ message: { text: `Rozpoznano: ${transcript}`, type: 'info' } });
                    searchInput.value = transcript;
                    performSearch(transcript);
                    try {
                        const lines = await parseTranscript(transcript);
                        setState({ transcriptLines: lines });
                    } catch (error: any) {
                        setState({ message: { text: error?.message || 'Nie udało się zinterpretować komendy.', type: 'error' } });
                    }
                },
                (error) => {
                    setState({ message: { text: `Błąd rozpoznawania mowy: ${error}`, type: 'error' } });
                }
            );
        }

        if (recognition.active()) {
            recognition.stop();
            voiceButton.textContent = '🎙️ Komenda głosowa';
            return;
        }

        recognition.start();
        voiceButton.textContent = '⏺️ Nagrywam…';
        setState({ message: { text: 'Słucham… wypowiedz nazwę produktu.', type: 'info' } });
    });

    fileInput.addEventListener('change', async () => {
        if (!fileInput.files || !fileInput.files.length) {
            return;
        }

        const file = fileInput.files[0];
        try {
            setState({ message: { text: 'Przetwarzam plik…', type: 'info' } });
            const text = await extractOcrText(file);
            if (text) {
                searchInput.value = text;
                performSearch(text);
                setState({ message: { text: 'Lista została odczytana. Sprawdź wyniki wyszukiwania.', type: 'success' } });
            } else {
                setState({ message: { text: 'Nie udało się odczytać tekstu z pliku.', type: 'error' } });
            }
        } catch (error: any) {
            setState({ message: { text: error?.message || 'Nie udało się przetworzyć pliku.', type: 'error' } });
        } finally {
            fileInput.value = '';
        }
    });

    render();
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
}
