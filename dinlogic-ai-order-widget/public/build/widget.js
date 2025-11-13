(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    var restConfig = window.DinlogicAIWConfig || {
        restUrl: '',
        nonce: '',
        currency: 'PLN',
        locale: 'pl-PL',
        priceDecimals: 2,
    };

    function ensureConfig() {
        if (!restConfig || !restConfig.restUrl) {
            throw new Error('DinlogicAIWConfig is not defined');
        }
        return restConfig;
    }

    var formatter = new Intl.NumberFormat(restConfig.locale || 'pl-PL', {
        style: 'currency',
        currency: restConfig.currency || 'PLN',
        minimumFractionDigits: restConfig.priceDecimals != null ? restConfig.priceDecimals : 2,
        maximumFractionDigits: restConfig.priceDecimals != null ? restConfig.priceDecimals : 2,
    });

    function formatMoney(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return formatter.format(0);
        }
        return formatter.format(value);
    }

    function buildBadge(label) {
        var badge = document.createElement('span');
        badge.className = 'dinlogic-aiw__badge';
        badge.textContent = label;
        return badge;
    }

    function createMessageElement() {
        var el = document.createElement('div');
        el.className = 'dinlogic-aiw__message dinlogic-aiw__message--info';
        el.setAttribute('role', 'status');
        el.style.display = 'none';
        return el;
    }

    function updateMessage(el, message) {
        if (!message) {
            el.style.display = 'none';
            el.textContent = '';
            return;
        }

        el.style.display = 'block';
        el.textContent = message.text;
        el.className = 'dinlogic-aiw__message dinlogic-aiw__message--' + message.type;
    }

    function searchProducts(query, page, perPage) {
        if (page === void 0) {
            page = 1;
        }
        if (perPage === void 0) {
            perPage = 10;
        }

        if (!query.trim()) {
            return Promise.resolve({
                items: [],
                pagination: { page: 1, per_page: perPage, total: 0 },
            });
        }

        var config = ensureConfig();
        var params = new URLSearchParams({ q: query, page: String(page), per_page: String(perPage) });
        return fetch(config.restUrl + '/search?' + params.toString()).then(function (response) {
            if (!response.ok) {
                throw new Error('Nie udało się pobrać wyników wyszukiwania.');
            }
            return response.json();
        });
    }

    function addLinesToCart(lines) {
        var config = ensureConfig();
        return fetch(config.restUrl + '/lines/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': config.nonce,
            },
            body: JSON.stringify({ lines: lines }),
        }).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error(text || 'Nie udało się dodać pozycji do koszyka.');
                });
            }
            return response;
        });
    }

    function parseTranscript(transcript) {
        var config = ensureConfig();
        return fetch(config.restUrl + '/voice/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': config.nonce,
            },
            body: JSON.stringify({ transcript: transcript }),
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('Nie udało się zinterpretować komendy głosowej.');
            }
            return response.json();
        }).then(function (data) {
            return data.lines || [];
        });
    }

    function extractOcrText(file) {
        var config = ensureConfig();
        var formData = new FormData();
        formData.append('file', file);
        return fetch(config.restUrl + '/ocr/extract', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': config.nonce,
            },
            body: formData,
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('Nie udało się przetworzyć pliku.');
            }
            return response.json();
        }).then(function (data) {
            return data.text || '';
        });
    }

    function hasBrowserSTT() {
        return typeof window !== 'undefined' && (!!window.webkitSpeechRecognition || !!window.SpeechRecognition);
    }

    function createRecognition(onResult, onError) {
        if (!hasBrowserSTT()) {
            throw new Error('Speech recognition API is not supported in this browser.');
        }

        var RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = new RecognitionConstructor();
        recognition.lang = (window.DinlogicAIWConfig && window.DinlogicAIWConfig.locale) || 'pl-PL';
        recognition.continuous = false;
        recognition.interimResults = false;

        var isActive = false;

        recognition.onresult = function (event) {
            var transcript = Array.from(event.results)
                .map(function (result) { return result[0]; })
                .map(function (result) { return result.transcript; })
                .join(' ')
                .trim();
            if (transcript) {
                onResult(transcript);
            }
        };

        recognition.onerror = function (event) {
            onError(event.error || 'unknown-error');
        };

        recognition.onstart = function () {
            isActive = true;
        };

        recognition.onend = function () {
            isActive = false;
        };

        return {
            start: function () {
                recognition.start();
            },
            stop: function () {
                recognition.stop();
            },
            active: function () {
                return isActive;
            },
        };
    }

    function createResultsList(state, onAdd) {
        var container = document.createElement('div');
        container.className = 'dinlogic-aiw__results';

        if (state.loading) {
            var loading = document.createElement('div');
            loading.textContent = 'Szukam produktów…';
            container.appendChild(loading);
            return container;
        }

        if (!state.results.length) {
            var empty = document.createElement('div');
            empty.className = 'dinlogic-aiw__empty';
            empty.textContent = 'Brak wyników. Wpisz nazwę produktu, aby rozpocząć.';
            container.appendChild(empty);
            return container;
        }

        var list = document.createElement('ul');
        list.className = 'dinlogic-aiw__result-list';

        state.results.forEach(function (product, index) {
            var item = document.createElement('li');
            item.className = 'dinlogic-aiw__result-item';

            if (index === 0) {
                item.classList.add('dinlogic-aiw__result-item--best');
                var badge = buildBadge('Najlepsze dopasowanie');
                badge.style.alignSelf = 'flex-start';
                item.appendChild(badge);
            }

            var details = document.createElement('div');
            details.className = 'dinlogic-aiw__result-details';

            var title = document.createElement('strong');
            title.textContent = product.name;
            details.appendChild(title);

            if (product.sku) {
                var sku = document.createElement('span');
                sku.textContent = 'SKU: ' + product.sku;
                sku.style.color = '#52606d';
                sku.style.fontSize = '0.85rem';
                details.appendChild(sku);
            }

            if (product.unit) {
                var unit = document.createElement('span');
                unit.textContent = 'Jednostka: ' + product.unit;
                unit.style.fontSize = '0.85rem';
                details.appendChild(unit);
            }

            var prices = document.createElement('div');
            prices.className = 'dinlogic-aiw__result-prices';

            var before = document.createElement('span');
            var beforeValue = product.regular_price != null ? product.regular_price : product.price;
            before.innerHTML = '<span style="color:#52606d;">Przed rabatem:</span> <strong>' + formatMoney(beforeValue) + '</strong>';
            prices.appendChild(before);

            var after = document.createElement('span');
            after.innerHTML = '<span style="color:#0f172a;">Po rabacie:</span> <strong>' + formatMoney(product.price) + '</strong>';
            prices.appendChild(after);

            details.appendChild(prices);

            var actions = document.createElement('div');
            actions.className = 'dinlogic-aiw__result-actions';

            var qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.min = '1';
            qtyInput.value = '1';
            qtyInput.setAttribute('aria-label', 'Ilość dla ' + product.name);
            actions.appendChild(qtyInput);

            var addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.textContent = 'Dodaj do listy';
            addButton.addEventListener('click', function () {
                var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
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

    function createTranscriptPreview(state, onTrySearch) {
        var container = document.createElement('div');
        container.className = 'dinlogic-aiw__transcript';

        if (!state.transcriptLines.length) {
            return container;
        }

        var title = document.createElement('h3');
        title.textContent = 'Rozpoznane linie';
        title.style.margin = '0';
        container.appendChild(title);

        var list = document.createElement('div');
        list.className = 'dinlogic-aiw__transcript-list';

        state.transcriptLines.forEach(function (line) {
            var item = document.createElement('div');
            item.className = 'dinlogic-aiw__transcript-line';

            var text = document.createElement('span');
            text.textContent = line.raw;
            item.appendChild(text);

            var meta = document.createElement('span');
            meta.style.textAlign = 'right';
            meta.style.display = 'flex';
            meta.style.gap = '6px';
            meta.style.alignItems = 'center';

            if (line.family) {
                var family = document.createElement('strong');
                family.textContent = line.family;
                meta.appendChild(family);
            }

            if (typeof line.confidence === 'number') {
                var confidence = document.createElement('span');
                confidence.textContent = Math.round(line.confidence * 100) + '%';
                confidence.style.fontSize = '0.8rem';
                meta.appendChild(confidence);
            }

            var button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Szukaj';
            button.style.background = '#2563eb';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.padding = '4px 10px';
            button.style.borderRadius = '999px';
            button.style.cursor = 'pointer';
            button.addEventListener('click', function () { return onTrySearch(line.raw); });

            meta.appendChild(button);
            item.appendChild(meta);
            list.appendChild(item);
        });

        container.appendChild(list);
        return container;
    }

    function createCartTable(state, onRemove, onSubmit) {
        var container = document.createElement('div');
        container.className = 'dinlogic-aiw__cart';

        if (!state.cart.length) {
            var empty = document.createElement('div');
            empty.className = 'dinlogic-aiw__empty';
            empty.textContent = 'Koszyk roboczy jest pusty. Dodaj produkty z listy po lewej.';
            container.appendChild(empty);
            return container;
        }

        var table = document.createElement('table');
        table.className = 'dinlogic-aiw__cart-table';

        var head = document.createElement('thead');
        head.innerHTML = '<tr><th>Produkt</th><th>Ilość</th><th>Cena przed rabatem</th><th>Cena po rabacie</th><th></th></tr>';
        table.appendChild(head);

        var body = document.createElement('tbody');

        var totalBefore = 0;
        var totalAfter = 0;

        state.cart.forEach(function (line) {
            var row = document.createElement('tr');

            var nameCell = document.createElement('td');
            nameCell.textContent = line.product.name;
            row.appendChild(nameCell);

            var qtyCell = document.createElement('td');
            qtyCell.textContent = String(line.qty);
            row.appendChild(qtyCell);

            var beforeValue = (line.product.regular_price != null ? line.product.regular_price : line.product.price) * line.qty;
            totalBefore += beforeValue;
            var beforeCell = document.createElement('td');
            beforeCell.textContent = formatMoney(beforeValue);
            row.appendChild(beforeCell);

            var afterValue = line.product.price * line.qty;
            totalAfter += afterValue;
            var afterCell = document.createElement('td');
            afterCell.textContent = formatMoney(afterValue);
            row.appendChild(afterCell);

            var actionsCell = document.createElement('td');
            actionsCell.style.textAlign = 'right';
            var removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = 'Usuń';
            removeButton.style.background = '#ef4444';
            removeButton.style.color = '#fff';
            removeButton.style.border = 'none';
            removeButton.style.padding = '6px 10px';
            removeButton.style.borderRadius = '6px';
            removeButton.style.cursor = 'pointer';
            removeButton.addEventListener('click', function () { return onRemove(line.product.id); });
            actionsCell.appendChild(removeButton);
            row.appendChild(actionsCell);

            body.appendChild(row);
        });

        table.appendChild(body);
        container.appendChild(table);

        var totals = document.createElement('div');
        totals.style.display = 'flex';
        totals.style.justifyContent = 'space-between';
        totals.style.fontWeight = '600';
        totals.innerHTML = '<span>Razem przed rabatem: ' + formatMoney(totalBefore) + '</span><span>Razem po rabacie: ' + formatMoney(totalAfter) + '</span>';
        container.appendChild(totals);

        var actions = document.createElement('div');
        actions.className = 'dinlogic-aiw__cart-actions';

        var submit = document.createElement('button');
        submit.type = 'button';
        submit.textContent = state.submitting ? 'Dodawanie…' : 'Wyślij do koszyka';
        submit.disabled = state.submitting;
        submit.addEventListener('click', function () { return onSubmit(); });

        actions.appendChild(submit);
        container.appendChild(actions);

        return container;
    }

    function findLine(cart, productId) {
        return cart.find(function (line) { return line.product.id === productId; });
    }

    function initWidget() {
        var root = document.getElementById('dinlogic-ai-order-widget');
        if (!root) {
            return;
        }

        root.innerHTML = '';

        var state = {
            query: '',
            results: [],
            loading: false,
            cart: [],
            submitting: false,
            message: null,
            transcriptLines: [],
        };

        var container = document.createElement('div');
        container.className = 'dinlogic-aiw';
        root.appendChild(container);

        var messageEl = createMessageElement();
        container.appendChild(messageEl);

        var grid = document.createElement('div');
        grid.className = 'dinlogic-aiw__grid';
        container.appendChild(grid);

        var searchPanel = document.createElement('section');
        searchPanel.className = 'dinlogic-aiw__panel';
        grid.appendChild(searchPanel);

        var cartPanel = document.createElement('section');
        cartPanel.className = 'dinlogic-aiw__panel';
        grid.appendChild(cartPanel);

        var searchTitle = document.createElement('h2');
        searchTitle.textContent = 'Wyszukiwarka i lista propozycji';
        searchPanel.appendChild(searchTitle);

        var searchField = document.createElement('div');
        searchField.className = 'dinlogic-aiw__field';
        searchPanel.appendChild(searchField);

        var searchLabel = document.createElement('label');
        searchLabel.textContent = 'Wpisz nazwę produktu';
        searchLabel.setAttribute('for', 'dinlogic-aiw-search-input');
        searchField.appendChild(searchLabel);

        var searchInputWrapper = document.createElement('div');
        searchInputWrapper.className = 'dinlogic-aiw__search-input';
        searchField.appendChild(searchInputWrapper);

        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'dinlogic-aiw-search-input';
        searchInput.placeholder = 'np. „YDYp 3×2,5” lub „wago 221”';
        searchInputWrapper.appendChild(searchInput);

        var searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.textContent = 'Szukaj';
        searchInputWrapper.appendChild(searchButton);

        var actionRow = document.createElement('div');
        actionRow.className = 'dinlogic-aiw__actions';
        searchPanel.appendChild(actionRow);

        var voiceButton = document.createElement('button');
        voiceButton.type = 'button';
        voiceButton.textContent = hasBrowserSTT() ? '🎙️ Komenda głosowa' : '🎙️ Brak wsparcia';
        voiceButton.disabled = !hasBrowserSTT();
        actionRow.appendChild(voiceButton);

        var fileLabel = document.createElement('label');
        fileLabel.textContent = '📷 Wczytaj listę';
        fileLabel.style.cursor = 'pointer';
        actionRow.appendChild(fileLabel);

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,application/pdf';
        fileLabel.appendChild(fileInput);

        var resultsContainer = document.createElement('div');
        searchPanel.appendChild(resultsContainer);

        var transcriptContainer = document.createElement('div');
        searchPanel.appendChild(transcriptContainer);

        var cartTitle = document.createElement('h2');
        cartTitle.textContent = 'Koszyk roboczy i podsumowanie';
        cartPanel.appendChild(cartTitle);

        var cartContainer = document.createElement('div');
        cartPanel.appendChild(cartContainer);

        var recognition = null;
        var debounceTimeout = null;

        function setState(patch) {
            Object.assign(state, patch);
            render();
        }

        function addToWorkingCart(product, qty) {
            var existing = findLine(state.cart, product.id);
            if (existing) {
                existing.qty += qty;
            } else {
                state.cart.push({ product: product, qty: qty });
            }
            setState({ cart: state.cart, message: { text: 'Dodano ' + qty + ' × ' + product.name + ' do koszyka roboczego.', type: 'success' } });
        }

        function removeFromCart(productId) {
            state.cart = state.cart.filter(function (line) { return line.product.id !== productId; });
            setState({ cart: state.cart, message: { text: 'Usunięto pozycję z koszyka roboczego.', type: 'info' } });
        }

        function submitCart() {
            if (!state.cart.length) {
                setState({ message: { text: 'Koszyk roboczy jest pusty.', type: 'info' } });
                return;
            }

            setState({ submitting: true, message: { text: 'Dodaję pozycje do koszyka…', type: 'info' } });
            var payload = state.cart.map(function (line) {
                return {
                    product_id: line.product.id,
                    qty: line.qty,
                    variation: line.variation,
                };
            });

            addLinesToCart(payload)
                .then(function (response) { return response.json(); })
                .then(function (result) {
                    var errors = (result.results || []).filter(function (item) { return item.status === 'error'; });
                    if (errors.length) {
                        setState({
                            submitting: false,
                            message: { text: 'Dodano z błędami (' + errors.length + '). Sprawdź szczegóły w koszyku WooCommerce.', type: 'error' },
                        });
                        return;
                    }

                    setState({
                        submitting: false,
                        cart: [],
                        message: { text: 'Pozycje zostały dodane do koszyka WooCommerce.', type: 'success' },
                    });
                })
                .catch(function (error) {
                    setState({ submitting: false, message: { text: (error && error.message) || 'Wystąpił błąd podczas dodawania do koszyka.', type: 'error' } });
                });
        }

        function performSearch(query) {
            var trimmed = query.trim();
            setState({ query: query, loading: !!trimmed });

            if (!trimmed) {
                setState({ results: [], loading: false });
                return;
            }

            searchProducts(trimmed, 1, 10)
                .then(function (response) {
                    setState({ results: response.items, loading: false });
                })
                .catch(function (error) {
                    setState({
                        loading: false,
                        message: { text: (error && error.message) || 'Nie udało się pobrać wyników wyszukiwania.', type: 'error' },
                    });
                });
        }

        function render() {
            updateMessage(messageEl, state.message);
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(createResultsList(state, addToWorkingCart));

            transcriptContainer.innerHTML = '';
            transcriptContainer.appendChild(createTranscriptPreview(state, function (text) {
                searchInput.value = text;
                performSearch(text);
            }));

            cartContainer.innerHTML = '';
            cartContainer.appendChild(createCartTable(state, removeFromCart, submitCart));
        }

        function handleDebouncedSearch(value) {
            if (debounceTimeout) {
                window.clearTimeout(debounceTimeout);
            }
            debounceTimeout = window.setTimeout(function () { return performSearch(value); }, 300);
        }

        searchInput.addEventListener('input', function (event) {
            handleDebouncedSearch(event.target.value);
        });

        searchButton.addEventListener('click', function () {
            performSearch(searchInput.value);
        });

        searchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch(searchInput.value);
            }
        });

        voiceButton.addEventListener('click', function () {
            if (!hasBrowserSTT()) {
                return;
            }

            if (!recognition) {
                recognition = createRecognition(function (transcript) {
                    setState({ message: { text: 'Rozpoznano: ' + transcript, type: 'info' } });
                    searchInput.value = transcript;
                    performSearch(transcript);
                    parseTranscript(transcript)
                        .then(function (lines) { setState({ transcriptLines: lines }); })
                        .catch(function (error) {
                            setState({ message: { text: (error && error.message) || 'Nie udało się zinterpretować komendy.', type: 'error' } });
                        });
                }, function (error) {
                    setState({ message: { text: 'Błąd rozpoznawania mowy: ' + error, type: 'error' } });
                });
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

        fileInput.addEventListener('change', function () {
            if (!fileInput.files || !fileInput.files.length) {
                return;
            }

            var file = fileInput.files[0];
            setState({ message: { text: 'Przetwarzam plik…', type: 'info' } });
            extractOcrText(file)
                .then(function (text) {
                    if (text) {
                        searchInput.value = text;
                        performSearch(text);
                        setState({ message: { text: 'Lista została odczytana. Sprawdź wyniki wyszukiwania.', type: 'success' } });
                    } else {
                        setState({ message: { text: 'Nie udało się odczytać tekstu z pliku.', type: 'error' } });
                    }
                })
                .catch(function (error) {
                    setState({ message: { text: (error && error.message) || 'Nie udało się przetworzyć pliku.', type: 'error' } });
                })
                .finally(function () {
                    fileInput.value = '';
                });
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
