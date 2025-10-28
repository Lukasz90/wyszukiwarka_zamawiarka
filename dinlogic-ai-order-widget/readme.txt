=== Dinlogic AI Order Widget ===
Contributors: dinlogic
Requires at least: 6.0
Tested up to: 6.4
Stable tag: 0.2.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Description ==

Lightweight order widget for WooCommerce that enables quick product search and simple voice-assisted ordering. The widget exposes two tabs: classic search (name and SKU) and a voice mode powered by the browser speech recognition API.

== Installation ==

1. Upload the `dinlogic-ai-order-widget` folder to the `/wp-content/plugins/` directory or install via the WordPress admin.
2. Activate the plugin through the "Plugins" menu in WordPress.
3. Ensure WooCommerce is active and configured.
4. Add the `[ai_order_widget]` shortcode to any page or use the block inserter to place the widget.

== Usage ==

* **Search tab** – Type any part of the product name or SKU, press **Szukaj**, and add items directly to the cart without leaving the page.
* **Voice tab** – Click **Start** to begin speech recognition (Chrome recommended), then **Stop** once the transcript appears. Use **Parsuj i zaproponuj** to fetch cart suggestions and add them in a single click.

== REST API ==

All endpoints live under the `aiw/v1` namespace.

* `GET /search?q=` – Returns matching products with basic metadata.
* `POST /cart/add` – Adds a product to the WooCommerce cart. Requires the `X-WP-Nonce` header.
* `POST /voice/parse` – Normalises transcripts and offers top product candidates.
* `POST /lines/add` – Batch add of product lines to the cart.
* `POST /ocr/extract` – Currently returns HTTP `501 Not Implemented`.

== Frequently Asked Questions ==

= Do I need additional build tooling? =

No. The plugin ships with prebuilt assets located in `public/build/` and does not rely on npm or bundlers.

= Which browsers support the voice features? =

The widget relies on the Web Speech API, available primarily in Chromium-based browsers. Unsupported browsers disable the voice controls automatically.

== Changelog ==

= 0.2.0 =
* Initial public release of the simplified widget with REST endpoints and vanilla JS frontend.
