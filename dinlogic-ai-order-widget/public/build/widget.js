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
        if (price === null || typeof price === 'undefined') {
            return '';
        }
        const currency = cfg.currency || '';
        return currency + ' ' + Number(price).toFixed(2);
    }

    function message(container, text, type) {
        container.textContent = text;
        container.setAttribute('data-type', type || 'info');
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

        fetchJSON(REST('cart/add'), {
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
        }).catch((err) => {
            if (onFail) {
                onFail(err);
            }
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

    function initWidget(root) {
        const tabs = el('div', 'aiw-tabs');
        const tabSearch = el('button', 'aiw-tab is-active', 'Szukaj');
        const tabVoice = el('button', 'aiw-tab', 'Głos');
        tabs.appendChild(tabSearch);
        tabs.appendChild(tabVoice);

        const panels = el('div', 'aiw-panels');
        const searchPanel = el('div', 'aiw-panel is-active');
        const voicePanel = el('div', 'aiw-panel');
        panels.appendChild(searchPanel);
        panels.appendChild(voicePanel);

        const messageBox = el('div', 'aiw-message');

        root.appendChild(tabs);
        root.appendChild(messageBox);
        root.appendChild(panels);

        tabSearch.addEventListener('click', () => {
            tabSearch.classList.add('is-active');
            tabVoice.classList.remove('is-active');
            searchPanel.classList.add('is-active');
            voicePanel.classList.remove('is-active');
        });

        tabVoice.addEventListener('click', () => {
            tabVoice.classList.add('is-active');
            tabSearch.classList.remove('is-active');
            voicePanel.classList.add('is-active');
            searchPanel.classList.remove('is-active');
        });

        buildSearchPanel(searchPanel, messageBox);
        buildVoicePanel(voicePanel, messageBox);
    }

    function buildSearchPanel(panel, messageBox) {
        clear(panel);

        const form = el('div', 'aiw-search-form');
        const input = el('input', 'aiw-search-input');
        input.type = 'search';
        input.placeholder = 'Szukaj produktów (nazwa, SKU...)';

        const button = el('button', 'aiw-button', 'Szukaj');
        button.type = 'button';

        const results = el('div', 'aiw-results');

        form.appendChild(input);
        form.appendChild(button);
        panel.appendChild(form);
        panel.appendChild(results);

        function renderResults(items) {
            clear(results);
            if (!items || !items.length) {
                const empty = el('div', 'aiw-empty', cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.');
                results.appendChild(empty);
                return;
            }

            items.forEach((item) => {
                const card = el('div', 'aiw-result');

                const title = el('div', 'aiw-result-title', item.name || '');
                const meta = el('div', 'aiw-result-meta');
                meta.appendChild(el('span', 'aiw-result-sku', item.sku ? 'SKU: ' + item.sku : ''));
                meta.appendChild(el('span', 'aiw-result-price', formatPrice(item.price)));
                meta.appendChild(el('span', 'aiw-result-stock', item.stock_status || ''));

                const thumb = el('img', 'aiw-result-thumb');
                thumb.alt = item.name || '';
                if (item.thumb) {
                    thumb.src = item.thumb;
                }

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
            });
        }

        function performSearch() {
            const term = input.value.trim();
            if (!term) {
                renderResults([]);
                return;
            }

            message(messageBox, cfg.i18n && cfg.i18n.searching ? cfg.i18n.searching : 'Szukam…', 'info');
            fetchJSON(REST('search') + '?q=' + encodeURIComponent(term) + '&page=1&per_page=10')
                .then((data) => {
                    renderResults(data);
                    if (!data || !data.length) {
                        message(messageBox, cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.', 'info');
                    } else {
                        messageBox.textContent = '';
                        messageBox.removeAttribute('data-type');
                    }
                })
                .catch(() => {
                    message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                });
        }

        button.addEventListener('click', performSearch);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });
    }

    function buildVoicePanel(panel, messageBox) {
        clear(panel);

        const controls = el('div', 'aiw-voice-controls');
        const startBtn = el('button', 'aiw-button', 'Start');
        const stopBtn = el('button', 'aiw-button', 'Stop');
        const parseBtn = el('button', 'aiw-button aiw-parse-button', 'Parsuj i zaproponuj');
        const interimField = el('div', 'aiw-interim');
        const textarea = document.createElement('textarea');
        textarea.className = 'aiw-transcript';
        textarea.rows = 4;

        controls.appendChild(startBtn);
        controls.appendChild(stopBtn);
        controls.appendChild(parseBtn);

        panel.appendChild(controls);
        panel.appendChild(interimField);
        panel.appendChild(textarea);

        const candidatesWrap = el('div', 'aiw-results');
        panel.appendChild(candidatesWrap);

        let recognition = null;
        let finalTxt = '';

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            startBtn.disabled = true;
            stopBtn.disabled = true;
            interimField.textContent = 'Rozpoznawanie mowy niedostępne w tej przeglądarce.';
        } else {
            recognition = new SpeechRecognition();
            recognition.lang = 'pl-PL';
            recognition.interimResults = true;
            recognition.continuous = true;

            recognition.onstart = function () {
                finalTxt = '';
                textarea.value = '';
                interimField.textContent = '';
                message(messageBox, cfg.i18n && cfg.i18n.analyzing ? cfg.i18n.analyzing : 'Analizuję…', 'info');
            };

            recognition.onerror = function () {
                message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
            };

            recognition.onresult = function (event) {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const res = event.results[i];
                    const text = res[0].transcript;
                    if (res.isFinal) {
                        finalTxt += ' ' + text;
                    } else {
                        interim = text;
                    }
                }
                const out = normalizeTranscript((finalTxt + ' ' + interim).trim());
                textarea.value = out;
                interimField.textContent = interim ? normalizeTranscript(interim) : '';
            };
        }

        startBtn.addEventListener('click', () => {
            if (!recognition) {
                return;
            }
            try {
                recognition.start();
            } catch (err) {
                // ignore restart errors
            }
        });

        stopBtn.addEventListener('click', () => {
            if (!recognition) {
                return;
            }
            recognition.stop();
            messageBox.textContent = '';
            messageBox.removeAttribute('data-type');
        });

        function renderCandidates(lines) {
            clear(candidatesWrap);
            if (!lines || !lines.length) {
                const empty = el('div', 'aiw-empty', cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.');
                candidatesWrap.appendChild(empty);
                return;
            }

            lines.forEach((line) => {
                if (!line.candidates || !line.candidates.length) {
                    return;
                }

                line.candidates.forEach((candidate) => {
                    const card = el('div', 'aiw-result');
                    const title = el('div', 'aiw-result-title', 'Produkt #' + candidate.product_id);
                    const meta = el('div', 'aiw-result-meta');
                    meta.appendChild(el('span', 'aiw-result-qty', 'Ilość: ' + (candidate.qty || 1)));

                    const addBtn = el('button', 'aiw-button aiw-add-button', 'Dodaj');
                    addBtn.type = 'button';
                    addBtn.addEventListener('click', () => {
                        const qty = Math.max(1, parseInt(candidate.qty, 10) || 1);
                        message(messageBox, cfg.i18n && cfg.i18n.analyzing ? cfg.i18n.analyzing : 'Analizuję…', 'info');
                        addToCart(candidate.product_id, qty, () => {
                            message(messageBox, cfg.i18n && cfg.i18n.added ? cfg.i18n.added : 'Dodano do koszyka', 'success');
                        }, () => {
                            message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
                        });
                    });

                    card.appendChild(title);
                    card.appendChild(meta);
                    card.appendChild(addBtn);

                    candidatesWrap.appendChild(card);
                });
            });
        }

        parseBtn.addEventListener('click', () => {
            const transcript = textarea.value.trim();
            if (!transcript) {
                renderCandidates([]);
                return;
            }

            message(messageBox, cfg.i18n && cfg.i18n.analyzing ? cfg.i18n.analyzing : 'Analizuję…', 'info');

            fetchJSON(REST('voice/parse'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': cfg.nonce || '',
                },
                body: JSON.stringify({ transcript }),
            }).then((data) => {
                renderCandidates(data.lines || []);
                if (!data.lines || !data.lines.length || !data.lines[0].candidates.length) {
                    message(messageBox, cfg.i18n && cfg.i18n.noResults ? cfg.i18n.noResults : 'Brak wyników.', 'info');
                } else {
                    messageBox.textContent = '';
                    messageBox.removeAttribute('data-type');
                }
            }).catch(() => {
                message(messageBox, cfg.i18n && cfg.i18n.error ? cfg.i18n.error : 'Błąd', 'error');
            });
        });
    }

    function bootstrap() {
        const nodes = document.querySelectorAll('.aiw-widget');
        nodes.forEach((node) => {
            initWidget(node);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
