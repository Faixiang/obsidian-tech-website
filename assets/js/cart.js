/* ==========================================================================
   曜石智能科技 · 購物車與訂單模擬
   職責：加入購物車、數量增減、金額合計、結算、訂單寫入
   說明：課程要求「無真實購買」，此處僅在瀏覽器內模擬交易流程。
   ========================================================================== */

(function (OBSIDIAN) {
  'use strict';

  var KEY_CART = 'obsidian.cart';

  var catalog = {
    S1: {
      code: 'S1',
      name: '環境感測終端 S1',
      price: 1280,
      spec: '溫濕度 / CO₂ / PM2.5 四合一',
      lead: '7 個工作日'
    },
    G2: {
      code: 'G2',
      name: '智能網關 G2',
      price: 3680,
      spec: '8 設備並發 / 本地邊緣儲存',
      lead: '10 個工作日'
    },
    E3: {
      code: 'E3',
      name: '能耗管理套件 E3',
      price: 8900,
      spec: '12 迴路 / 分時計價 / 報表導出',
      lead: '14 個工作日'
    }
  };

  function cart() {
    return OBSIDIAN.read(KEY_CART, []);
  }

  function save(list) {
    OBSIDIAN.write(KEY_CART, list);
    render();
  }

  function count() {
    return cart().reduce(function (n, i) {
      return n + i.qty;
    }, 0);
  }

  function add(code, qty) {
    var item = catalog[code];
    if (!item) return;

    var list = cart();
    var line = list.filter(function (i) {
      return i.code === code;
    })[0];

    if (line) {
      line.qty += qty || 1;
    } else {
      list.push({
        code: item.code,
        name: item.name,
        price: item.price,
        spec: item.spec,
        lead: item.lead,
        qty: qty || 1
      });
    }

    save(list);
  }

  function setQty(code, qty) {
    var list = cart().filter(function (i) {
      return i.code !== code;
    });

    if (qty > 0) {
      var item = catalog[code];
      list.push({
        code: item.code,
        name: item.name,
        price: item.price,
        spec: item.spec,
        lead: item.lead,
        qty: qty
      });
    }

    save(list);
  }

  function remove(code) {
    save(
      cart().filter(function (i) {
        return i.code !== code;
      })
    );
  }

  function clear() {
    save([]);
  }

  function subtotal() {
    return cart().reduce(function (sum, i) {
      return sum + i.price * i.qty;
    }, 0);
  }

  /** 滿5000 免運費，否則 120 */
  function shipping() {
    var sub = subtotal();
    if (sub === 0 || sub >= 5000) return 0;
    return 120;
  }

  function total() {
    return subtotal() + shipping();
  }

  /* ---------- 渲染購物車頁 ---------- */
  function render() {
    var list = cart();

    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = String(count());
    });

    var tbody = document.querySelector('[data-cart-body]');
    var wrap = document.querySelector('[data-cart-table]');
    var empty = document.querySelector('[data-cart-empty]');
    var summary = document.querySelector('[data-cart-summary]');

    if (!tbody) return;

    if (!list.length) {
      if (wrap) wrap.hidden = true;
      if (summary) summary.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }

    if (wrap) wrap.hidden = false;
    if (summary) summary.hidden = false;
    if (empty) empty.hidden = true;

    tbody.innerHTML = list
      .map(function (i) {
        return (
          '<tr>' +
          '<td><span class="mono">' +
          OBSIDIAN.esc(i.code) +
          '</span><br /><span class="caption">' +
          OBSIDIAN.esc(i.spec) +
          '</span></td>' +
          '<td>' +
          OBSIDIAN.esc(i.name) +
          '</td>' +
          '<td class="mono">' +
          OBSIDIAN.money(i.price) +
          '</td>' +
          '<td>' +
          '<div class="qty">' +
          '<button type="button" class="qty__btn" data-dec="' +
          OBSIDIAN.esc(i.code) +
          '" aria-label="減少數量">&minus;</button>' +
          '<span class="qty__num">' +
          i.qty +
          '</span>' +
          '<button type="button" class="qty__btn" data-inc="' +
          OBSIDIAN.esc(i.code) +
          '" aria-label="增加數量">+</button>' +
          '</div></td>' +
          '<td class="mono">' +
          OBSIDIAN.money(i.price * i.qty) +
          '</td>' +
          '<td><button type="button" class="link-danger" data-rm="' +
          OBSIDIAN.esc(i.code) +
          '">移除</button></td>' +
          '</tr>'
        );
      })
      .join('');

    var sub = subtotal();
    var ship = shipping();

    var elSub = document.querySelector('[data-sum-subtotal]');
    var elShip = document.querySelector('[data-sum-shipping]');
    var elTotal = document.querySelector('[data-sum-total]');

    if (elSub) elSub.textContent = OBSIDIAN.money(sub);
    if (elShip) elShip.textContent = ship ? OBSIDIAN.money(ship) : '免運費';
    if (elTotal) elTotal.textContent = OBSIDIAN.money(total());
  }

  /* ---------- 事件綁定 ---------- */
  document.addEventListener('click', function (e) {
    var inc = e.target.closest('[data-inc]');
    var dec = e.target.closest('[data-dec]');
    var rm = e.target.closest('[data-rm]');

    if (inc) {
      var c = inc.getAttribute('data-inc');
      var line = cart().filter(function (i) {
        return i.code === c;
      })[0];
      if (line) setQty(c, line.qty + 1);
      return;
    }

    if (dec) {
      var c2 = dec.getAttribute('data-dec');
      var l2 = cart().filter(function (i) {
        return i.code === c2;
      })[0];
      if (l2) setQty(c2, l2.qty - 1);
      return;
    }

    if (rm) {
      remove(rm.getAttribute('data-rm'));
    }
  });

  /* ---------- 結算 ---------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-checkout]');
    if (!form) return;

    e.preventDefault();

    var res = OBSIDIAN.validateForm(form);
    if (!res.ok) return;

    var s = OBSIDIAN.session();
    var list = cart();
    if (!list.length) return;

    OBSIDIAN.setLastOrder({
      no: OBSIDIAN.orderNo(),
      placedAt: new Date().toISOString(),
      items: list,
      subtotal: subtotal(),
      shipping: shipping(),
      total: total(),
      customer: {
        name: res.data.name || (s ? s.name : ''),
        email: res.data.email || (s ? s.name : ''),
        phone: res.data.phone || '',
        address: res.data.address || '',
        note: res.data.note || ''
      }
    });

    clear();
    location.href = 'order-confirm.html';
  });

  /* ---------- 購買按鈕（詳情頁跳轉） ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-buy]');
    if (!btn) return;
    e.preventDefault();
    add(btn.getAttribute('data-buy'), 1);
    location.href = 'cart.html';
  });

  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();

  window.OBSIDIAN_CART = {
    catalog: catalog,
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    list: cart,
    count: count,
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    render: render
  };
})(window.OBSIDIAN);