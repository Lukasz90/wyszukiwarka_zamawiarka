export function initWidget() {
    const el = document.getElementById('dinlogic-ai-order-widget');
    if (!el) {
        return;
    }

    el.innerText = 'Dinlogic AI Order Widget placeholder';
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
}
