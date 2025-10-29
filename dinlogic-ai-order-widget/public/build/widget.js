(function () {
    if (typeof window === 'undefined') {
        return;
    }

    const cfg = window.DinlogicAIWConfig || {};
    const REST = (endpoint) => (cfg.restBase || '').replace(/\/?$/, '/') + endpoint.replace(/^\//, '');

    function el(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (typeof text === 'string') {
            element.textContent = text;
        }
        return element;
    }

    function clear(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function formatPrice(price) {
        if (price === null || typeof price === 'undefined' || price === '') {
            return '';
        }
        const currency = cfg.currency || '';
        return currency + ' ' + Number(price).toFixed(2);
    }

    function message(container, text, type) {
        if (!container) {
            return;
        }
        container.textContent = text || '';
        if (text) {
            container.setAttribute('data-type', type || 'info');
        } else {
            container.removeAttribute('data-type');
        }
    }

    function fetchJSON(url, options) {
        return fetch(url, Object.assign({
            credentials: 'same-origin',
        }, options || {})).then((response) => {
            if (!response.ok) {
                return response.json().catch(() => ({})).then((data) => {
                    const error = new Error(data && data.message ? data.message : 'Request failed');
                    error.status = response.status;
                    throw error;
                });
            }
            return response.json();
        });
    }

    function addToCart(productId, qty, onDone, onFail) {
        const body = {
            product_id: productId,
            qty: qty || 1,
        };

        return fetchJSON(REST('cart/add'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': cfg.nonce || '',
            },
            body: JSON.stringify(body),
        }).then((data) => {
            if (onDone) {
                onDone(data);
            }
            return data;
        }).catch((err) => {
            if (onFail) {
                onFail(err);
            }
            throw err;
        });
    }

    function normalizeTranscript(input) {
        if (!input) {
            return '';
        }
        let output = String(input);
        output = output.replace(/([\p{L}])\1{2,}/gu, '$1$1');
        output = output.replace(/([\p{L}]{3,})\1+/gu, '$1');
        output = output.replace(/\s+/g, ' ').trim();
        if (!output) {
            return '';
        }
        const words = output.split(' ');
        const deduped = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word) {
                continue;
            }
            const last = deduped[deduped.length - 1];
            if (!last || last.toLowerCase() !== word.toLowerCase()) {
                deduped.push(word);
            }
        }
        return deduped.join(' ');
    }

    function stripDiacritics(value) {
        if (!value) {
            return '';
        }
        if (typeof value.normalize === 'function') {
            return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return value;
    }

    const NUMBER_WORDS = {
        jeden: 1,
        jedna: 1,
        jedno: 1,
        dwie: 2,
        dwa: 2,
        trzy: 3,
        cztery: 4,
        piec: 5,
        szesc: 6,
        siedem: 7,
        osiem: 8,
        dziewiec: 9,
        dziesiec: 10,
    };

    function extractQuantity(phrase) {
        if (!phrase) {
            return 1;
        }
        const digitMatches = phrase.match(/(\d+)/g);
        if (digitMatches && digitMatches.length) {
            const raw = parseInt(digitMatches[digitMatches.length - 1], 10);
            if (!isNaN(raw) && raw > 0) {
                return raw;
            }
        }
        const tokens = phrase.split(/\s+/).filter(Boolean);
        for (let i = tokens.length - 1; i >= 0; i--) {
            const ascii = stripDiacritics(tokens[i].toLowerCase());
            if (NUMBER_WORDS[ascii]) {
                return NUMBER_WORDS[ascii];
            }
        }
        return 1;
    }

    function isQuantityToken(token) {
        if (!token) {
            return false;
        }
        const ascii = stripDiacritics(token.toLowerCase());
        if (/^\d+[,.]?\d*$/.test(ascii)) {
            return true;
        }
        if (NUMBER_WORDS[ascii]) {
            return true;
        }
        return ascii === 'szt' || ascii === 'sztuk' || ascii === 'sztuki' || ascii === 'sztuke' || ascii === 'sztuka' || ascii === 'x';
    }

    function buildWidget(root) {
        const messageBox = el('div', 'aiw-message');
        const form = el('div', 'aiw-search-form');
        const inputWrap = el('div', 'aiw-input-wrap');
        const input = el('input', 'aiw-search-input');
        input.type = 'search';
        input.placeholder = 'Szukaj produktów (nazwa, SKU...)';

        const micBtn = el('button', 'aiw-mic-button');
        micBtn.type = 'button';
        micBtn.setAttribute('aria-label', 'Dyktuj');
        micBtn.innerHTML = '<span aria-hidden="true">🎤</span>';

        const searchBtn = el('button', 'aiw-button', 'Szukaj');
        searchBtn.type = 'button';

        inputWrap.appendChild(input);
        inputWrap.appendChild(micBtn);
        form.appendChild(inputWrap);
        form.appendChild(searchBtn);

        const results = el('div', 'aiw-results');

        root.appendChild(messageBox);
        root.appendChild(form);
        root.appendChild(results);

        let lastResults = [];
        let lastSearchTerm = '';
        let searchTimer = null;
        let searchSequence = 0;
        const qtyInputs = new Map();

        function renderResults(items) {
            clear(results);
            qtyInputs.clear();

            if (!items || !items.length) {
                const empty = el('div', 'aiw-empty', cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.');
                results.appendChild(empty);
                return;
            }

            items.forEach((item, index) => {
                const card = el('div', 'aiw-result' + (index === 0 ? ' is-primary' : ''));

                const thumb = el('img', 'aiw-result-thumb');
                thumb.alt = item.name || '';
                if (item.thumb) {
                    thumb.src = item.thumb;
                }

                const title = el('div', 'aiw-result-title', item.name || '');
                const meta = el('div', 'aiw-result-meta');
                meta.appendChild(el('span', 'aiw-result-sku', item.sku ? 'SKU: ' + item.sku : ''));
                meta.appendChild(el('span', 'aiw-result-price', formatPrice(item.price)));
                meta.appendChild(el('span', 'aiw-result-stock', item.stock_status || ''));

                const qtyWrap = el('div', 'aiw-result-qty');
                const qtyInput = el('input', 'aiw-qty-input');
                qtyInput.type = 'number';
                qtyInput.min = '1';
                qtyInput.value = '1';

                const addBtn = el('button', 'aiw-button aiw-add-button', 'Dodaj');
                addBtn.type = 'button';

                qtyWrap.appendChild(qtyInput);
                qtyWrap.appendChild(addBtn);

                card.appendChild(thumb);
                card.appendChild(title);
                card.appendChild(meta);
                card.appendChild(qtyWrap);

                addBtn.addEventListener('click', () => {
                    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
                    message(messageBox, cfg.i18n && cfg.i18n.searching ? cfg.i18n.searching : 'Szukam…', 'info');
                    addToCart(item.id, qty, () => {
                        message(messageBox, cfg.i18n && cfg.i18n.added ? cfg.i18n.added : 'Dodano do koszyka', 'success');
                    }, () => {
                        message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                    });
                });

                results.appendChild(card);
                qtyInputs.set(item.id, qtyInput);
            });
        }

        function performSearch(term, options) {
            const rawTerm = typeof term === 'string' ? term : input.value;
            const searchTerm = rawTerm ? rawTerm.trim() : '';
            if (!searchTerm) {
                lastResults = [];
                lastSearchTerm = '';
                renderResults([]);
                return Promise.resolve([]);
            }

            if (options && options.skipIfSame && searchTerm === lastSearchTerm && lastResults.length) {
                return Promise.resolve(lastResults);
            }

            const requestId = ++searchSequence;
            lastSearchTerm = searchTerm;
            message(messageBox, cfg.i18n && cfg.i18n.searching ? cfg.i18n.searching : 'Szukam…', 'info');

            return fetchJSON(REST('search') + '?q=' + encodeURIComponent(searchTerm) + '&page=1&per_page=10')
                .then((data) => {
                    if (requestId !== searchSequence) {
                        return lastResults;
                    }
                    lastResults = Array.isArray(data) ? data : [];
                    renderResults(lastResults);
                    if (!lastResults.length) {
                        message(messageBox, cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.', 'info');
                    } else {
                        message(messageBox, '', 'info');
                    }
                    return lastResults;
                })
                .catch(() => {
                    if (requestId === searchSequence) {
                        message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                    }
                    return [];
                });
        }

        function performSearchDebounced(term) {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
            searchTimer = setTimeout(() => {
                performSearch(term);
            }, 300);
        }

        searchBtn.addEventListener('click', () => {
            performSearch();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });

        input.addEventListener('input', () => {
            performSearchDebounced();
        });

        let recognition = null;
        let listening = false;
        let voiceBuffer = '';
        let silenceTimer = null;
        const commandQueue = [];
        let processingCommand = false;

        function clearSilenceTimer() {
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
        }

        function resetSilenceTimer() {
            if (!listening) {
                return;
            }
            clearSilenceTimer();
            silenceTimer = setTimeout(() => {
                stopListening();
            }, 5000);
        }

        function enqueueCommand(phrase) {
            if (!phrase) {
                return;
            }
            commandQueue.push(phrase);
            if (!processingCommand) {
                processNextCommand();
            }
        }

        function cleanSearchPhrase(phrase) {
            if (!phrase) {
                return '';
            }
            const tokens = phrase.split(/\s+/).filter(Boolean);
            const kept = [];
            for (let i = 0; i < tokens.length; i++) {
                const cleaned = tokens[i].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
                if (!cleaned) {
                    continue;
                }
                if (!isQuantityToken(cleaned)) {
                    kept.push(cleaned);
                }
            }
            return kept.join(' ');
        }

        function processNextCommand() {
            if (!commandQueue.length) {
                processingCommand = false;
                return;
            }
            processingCommand = true;
            const phrase = commandQueue.shift();
            const qty = extractQuantity(phrase);
            const term = cleanSearchPhrase(phrase);
            if (!term) {
                message(messageBox, cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.', 'info');
                processingCommand = false;
                processNextCommand();
                return;
            }

            input.value = term;
            performSearch(term, { skipIfSame: true }).then((items) => {
                if (!items || !items.length) {
                    message(messageBox, cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.', 'info');
                    return;
                }
                const product = items[0];
                const qtyField = qtyInputs.get(product.id);
                const finalQty = Math.max(1, qty || 1);
                if (qtyField) {
                    qtyField.value = String(finalQty);
                }
                message(messageBox, cfg.i18n && cfg.i18n.analyzing ? cfg.i18n.analyzing : 'Analizuję…', 'info');
                return addToCart(product.id, finalQty, () => {
                    message(messageBox, cfg.i18n && cfg.i18n.added ? cfg.i18n.added : 'Dodano do koszyka', 'success');
                }, () => {
                    message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                });
            }).finally(() => {
                processingCommand = false;
                processNextCommand();
            });
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            micBtn.disabled = true;
            micBtn.classList.add('is-disabled');
        } else {
            recognition = new SpeechRecognition();
            recognition.lang = 'pl-PL';
            recognition.interimResults = true;
            recognition.continuous = true;

            recognition.onstart = function () {
                listening = true;
                micBtn.classList.add('is-listening');
                voiceBuffer = normalizeTranscript(input.value || '');
                resetSilenceTimer();
            };

            recognition.onerror = function () {
                message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                stopListening();
            };

            recognition.onend = function () {
                listening = false;
                micBtn.classList.remove('is-listening');
                clearSilenceTimer();
            };

            recognition.onresult = function (event) {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const res = event.results[i];
                    const text = res[0].transcript;
                    if (res.isFinal) {
                        voiceBuffer = (voiceBuffer + ' ' + text).trim();
                        const normalized = normalizeTranscript(voiceBuffer).trim();
                        const lower = stripDiacritics(normalized.toLowerCase());
                        const keyword = 'zatwierdz';
                        let remainder = normalized;
                        let cursor = lower.indexOf(keyword);
                        while (cursor !== -1) {
                            const before = remainder.slice(0, cursor).trim();
                            if (before) {
                                enqueueCommand(before);
                            }
                            remainder = remainder.slice(cursor + keyword.length).trim();
                            const newLower = stripDiacritics(remainder.toLowerCase());
                            cursor = newLower.indexOf(keyword);
                        }
                        voiceBuffer = remainder;
                    } else {
                        interim = text;
                    }
                }

                const combined = normalizeTranscript((voiceBuffer + ' ' + interim).trim());
                if (combined !== input.value) {
                    input.value = combined;
                }
                if (combined) {
                    performSearchDebounced(combined);
                }
                resetSilenceTimer();
            };
        }

        function startListening() {
            if (!recognition || listening) {
                return;
            }
            try {
                recognition.start();
            } catch (err) {
                // ignore if already started
            }
        }

        function stopListening() {
            if (!recognition || !listening) {
                clearSilenceTimer();
                return;
            }
            clearSilenceTimer();
            try {
                recognition.stop();
            } catch (err) {
                // ignore
            }
        }

        micBtn.addEventListener('click', () => {
            if (!recognition) {
                return;
            }
            if (listening) {
                stopListening();
            } else {
                startListening();
            }
        });
    }

    function bootstrap() {
        const nodes = document.querySelectorAll('.aiw-widget');
        nodes.forEach((node) => {
            if (!node.__aiwInitialized) {
                node.__aiwInitialized = true;
                buildWidget(node);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
