/* ==========================================================================
   曜石智能科技 · 会话与表單校驗
   职责：登入/註冊（localStorage 模擬，無伺服器）、
        註冊資訊与訂單數據读写、表單校驗、登入態渲染
   說明：课程要求「無伺服器儲存」，此处用 localStorage 承接跳轉數據。
        真實產品環境必須改為後端 + 雜湊儲存，见 docs/报告大纲.md 安全章节。
   ========================================================================== */

var OBSIDIAN = (function () {
  'use strict';

  var KEY_SESSION = 'obsidian.session';
  var KEY_MEMBER = 'obsidian.members';
  var KEY_REG = 'obsidian.lastRegister';
  var KEY_ORDER = 'obsidian.lastOrder';

  /* ---------- 儲存读写（localStorage 不可用時降級為記憶體） ---------- */
  var memory = {};

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return Object.prototype.hasOwnProperty.call(memory, key)
        ? memory[key]
        : fallback;
    }
  }

  function write(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* 隱私模式或配额满：記憶體態仍可支撑当次演示 */
    }
  }

  function remove(key) {
    delete memory[key];
    try {
      localStorage.removeItem(key);
    } catch (err) {
      /* 忽略 */
    }
  }

  /* ---------- 校驗 ---------- */
  var RULES = {
    required: function (v) {
      return v.trim().length > 0;
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    },
    phone: function (v) {
      return /^[0-9]{8}$/.test(v.trim());
    },
    minLen: function (n) {
      return function (v) {
        return v.trim().length >= n;
      };
    },
    match: function (field) {
      return function (v, data) {
        return v === data[field];
      };
    }
  };

  var MESSAGES = {
    required: '此项為必填',
    email: '請輸入有效的電郵地址',
    phone: '請輸入8 位數字的香港手機号码',
    minLen: '長度不足',
    match: '兩次输入不一致'
  };

  /**
   * 校驗單個字段
   * @param {HTMLInputElement} el
   * @param {Object} data 同表單其余字段值，用于 match 规则
   * @returns {boolean}
   */
  function validateField(el, data) {
    var rule = el.getAttribute('data-rule');
    if (!rule) return true;

    var ok = true;

    rule.split('|').forEach(function (token) {
      var parts = token.split(':');
      var name = parts[0];
      var fn = RULES[name];

      if (!fn) return;
      if (!fn(parts[1] || null)(el.value, data || {})) ok = false;
    });

    var box = el.closest('.field');
    var err = box ? box.querySelector('.field__error') : null;

    if (err) {
      err.textContent = ok ? '' : errorMessage(rule);
    }
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (box) box.classList.toggle('is-error', !ok);

    return ok;
  }

  function errorMessage(rule) {
    for (var i = 0; i < rule.split('|').length; i++) {
      var name = rule.split('|')[i].split(':')[0];
      if (MESSAGES[name]) return MESSAGES[name];
    }
    return '输入無效';
  }

  /** 校驗整個表單，返回 {ok, data} */
  function validateForm(form) {
    var fields = form.querySelectorAll('[data-rule]');
    var data = {};

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.name) data[el.name] = el.value;
    });

    var ok = true;
    var firstBad = null;

    fields.forEach(function (el) {
      if (!validateField(el, data)) {
        ok = false;
        if (!firstBad) firstBad = el;
      }
    });

    if (firstBad) firstBad.focus();
    return { ok: ok, data: data };
  }

  /** 失焦時即時校驗（跳过未触碰字段） */
  function liveValidate(form) {
    form.querySelectorAll('[data-rule]').forEach(function (el) {
      el.addEventListener('blur', function () {
        validateField(el, form.elements);
      });
    });
  }

  /* ---------- 会话 ---------- */
  function login(role, name) {
    write(KEY_SESSION, { role: role, name: name, at: Date.now() });
  }

  function session() {
    return read(KEY_SESSION, null);
  }

  function logout() {
    remove(KEY_SESSION);
  }

  /* ---------- 会员 ---------- */
  function members() {
    return read(KEY_MEMBER, []);
  }

  function addMember(member) {
    var list = members();
    list.push(member);
    write(KEY_MEMBER, list);
  }

  function findMember(email) {
    var key = String(email).trim().toLowerCase();
    return (
      members().filter(function (m) {
        return m.email === key;
      })[0] || null
    );
  }

  /* ---------- 跨頁數據 ---------- */
  function setLastRegister(data) {
    write(KEY_REG, data);
  }

  function getLastRegister() {
    return read(KEY_REG, null);
  }

  function setLastOrder(data) {
    write(KEY_ORDER, data);
  }

  function getLastOrder() {
    return read(KEY_ORDER, null);
  }

  function clearLastRegister() {
    remove(KEY_REG);
  }

  function clearLastOrder() {
    remove(KEY_ORDER);
  }

  /* ---------- 格式化 ---------- */
  function money(n) {
    return 'HK$' + Number(n || 0).toFixed(2);
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  /** 生成訂單号：OB-YYYYMMDD-XXXX */
  function orderNo() {
    var d = new Date();

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    var stamp =
      d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var tail = Math.floor(Math.random() * 9000 + 1000);

    return 'OB-' + stamp + '-' + tail;
  }

  /** HTML 转义，防止用戶输入注入頁面 */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 從 URL query 取参數 */
  function qs(key) {
    var m = new RegExp('[?&]' + key + '=([^&#]*)').exec(
      location.search
    );
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /* ---------- 登入態渲染 ---------- */
  function renderSession() {
    var s = session();
    document.querySelectorAll('[data-session-name]').forEach(function (el) {
      el.textContent = s ? s.name : '訪客';
    });

    document.querySelectorAll('[data-session-box]').forEach(function (el) {
      el.hidden = !s;
    });

    document.querySelectorAll('[data-guest-box]').forEach(function (el) {
      el.hidden = !!s;
    });
  }

  return {
    read: read,
    write: write,
    remove: remove,
    validateField: validateField,
    validateForm: validateForm,
    liveValidate: liveValidate,
    login: login,
    session: session,
    logout: logout,
    members: members,
    addMember: addMember,
    findMember: findMember,
    setLastRegister: setLastRegister,
    getLastRegister: getLastRegister,
    setLastOrder: setLastOrder,
    getLastOrder: getLastOrder,
    clearLastRegister: clearLastRegister,
    clearLastOrder: clearLastOrder,
    money: money,
    formatDate: formatDate,
    orderNo: orderNo,
    esc: esc,
    qs: qs,
    renderSession: renderSession
  };
})();