/* ==========================================================================
   曜石智能科技 · 全站通用腳本
   --------------------------------------------------------------------------
   質感參數依據：康陶集團官網_視覺與交互復刻設計參數報告.md §5
     - 粒子：N=70，速度 (Math.random()-0.5)*0.25，5 色池，rAF驅動
     - 過渡：統一 ease，卡片 0.4s
     - 錨點：攔截 a[href^="#"] → scrollIntoView({behavior:'smooth'})
     - 時鍾：日期固定 + 實時時分，每分鐘刷新
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     粒子背景（報告 §4/§5）
     ----------------------------------------------------------------------
     注：此為康陶復刻版粒子層（70 顆 + 連線）。
     全站主菜單視覺層上線後，由 obsidianBg() 統一接管背景，
     本層僅在 body 無 .obsidian-bg 時啟用，避免雙層疊加與 rAF 超預算。
     ====================================================================== */
  (function particles() {
    var canvas = document.getElementById('particles');
    if (!canvas || reduceMotion) return;
    /* 新背景層已注入則跳過，避免兩個粒子系統同時運行 */
    if (document.querySelector('.obsidian-bg')) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* 報告 §5：顏色池 5 色 */
    var COLORS = [
      [0, 212, 184],   /* 青 */
      [0, 160, 200],   /* 深青 */
      [123, 47, 255],  /* 紫 */
      [200, 168, 75],  /* 金 */
      [255, 45, 85]    /* 紅 */
    ];

    var N = 70;
    var pts = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      pts = [];
      for (var i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          /* 報告 §5：速度 ±0.125 */
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.4,
          c: COLORS[(Math.random() * COLORS.length) | 0]
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];

        p.x += p.vx;
        p.y += p.vy;

        /* 邊界回彈 */
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',0.7)';
        ctx.fill();

        /* 近距離連線 */
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);

          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(0,212,184,' + (0.12 * (1 - d / 130)).toFixed(3) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      window.requestAnimationFrame(frame);
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(init, 200);
    });

    init();
    frame();
  })();

  /* ======================================================================
     移動端導航（雙固定條 → 展開佔位 nav-total）
     ====================================================================== */
  var toggle = document.querySelector('.nav__toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-locked', open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
      }
    });
  }

  /* ======================================================================
     當前頁導航高亮
     ====================================================================== */
  var here = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav__link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ======================================================================
     錨點平滑滾動（報告 §5：攔截預設行為 → scrollIntoView）
     ====================================================================== */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href');
    if (!id || id === '#') return;

    var target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    /* 同步 hash 但不跳動 */
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ======================================================================
     跑馬燈速度反算（報告 §5 / 計劃書 §9.5）
     ----------------------------------------------------------------------
     軌道已由 CSS 固定為 flex:0 0 auto + width:max-content，寬度不再隨
     視口伸縮，故「duration = 一份內容寬 ÷ 目標速度」與視口無關。
     內容複製兩份（副本 aria-hidden="true"），逐幀位移量恆為一份內容寬
     （--mq-shift 由 JS 反算為負百分比，向左位移），循環回溯無跳變；
     「軌道寬 − 一份內容寬」小於容器可見寬時自動補足副本（保持偶數份）。
     目標速度唯一來源：CSS 變量 --mq-speed-*（12 / 8 / 40 px/s）。
     ====================================================================== */
  var OBSIDIAN_MARQUEE = (function marquee() {
    var ctx = document.documentElement;
    var items = [];
    var rafId = 0;
    var booted = false;

    /* 三條軌道：選擇器 + duration 變量名 + 目標速度變量名 */
    var SPECS = [
      {
        sels: ['[data-nb-ticker]', '.nb-ticker-track'],
        varName: '--ticker-nb', speedVar: '--mq-speed-nb', speedFallback: 8
      },
      {
        sels: ['[data-hero-ticker]', '.hero-ticker-track'],
        varName: '--ticker-hero', speedVar: '--mq-speed-hero', speedFallback: 40
      },
      {
        sels: ['.ann-bar__track'],
        varName: '--ticker-ann', speedVar: '--mq-speed-ann', speedFallback: 12
      }
    ];

    function pick(spec) {
      for (var i = 0; i < spec.sels.length; i++) {
        var el = document.querySelector(spec.sels[i]);
        if (el && el !== document.body && el !== document.documentElement) return el;
      }
      return null;
    }

    function specOf(el) {
      for (var i = 0; i < SPECS.length; i++) {
        for (var j = 0; j < SPECS[i].sels.length; j++) {
          if (el.matches && el.matches(SPECS[i].sels[j])) return SPECS[i];
        }
      }
      return null;
    }

    function speedOf(spec) {
      var v = parseFloat(
        window.getComputedStyle(ctx).getPropertyValue(spec.speedVar)
      );
      return v > 0 ? v : spec.speedFallback;
    }

    /* 建結構：原內容包進 .mq-frame → 再複製一份 aria-hidden 的副本 */
    function build(el, spec) {
      if (!el || el.dataset.mqReady === '1') return null;

      var kids = Array.prototype.slice.call(el.children);
      if (!kids.length) return null;

      var cs = window.getComputedStyle(el);
      var gapPx = parseFloat(cs.columnGap) || 0;

      /* ① 軌道不被拉伸/壓縮，只按內容自然寬排版；間距改為逐項 margin
            （含每份末尾那一項），使複製後的接縫間距與其他間距一致；
            首縮進保留在軌道自身 padding-left，不進入「一份內容寬」丈量，
            避免接縫處出現雙倍間距 */
      el.style.flex = '0 0 auto';
      el.style.width = 'max-content';
      el.style.gap = '0px';

      kids.forEach(function (k) {
        if (gapPx) k.style.marginRight = gapPx + 'px';
      });

      var frame = document.createElement('div');
      frame.className = 'mq-frame';
      frame.style.cssText =
        'display:flex;flex:0 0 auto;width:max-content;align-items:center;';
      kids.forEach(function (k) { frame.appendChild(k); });

      var clone = frame.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');

      var inner = document.createElement('div');
      inner.className = 'mq-inner';
      inner.style.cssText =
        'display:flex;flex:0 0 auto;width:max-content;align-items:center;';
      inner.appendChild(frame);
      inner.appendChild(clone);
      el.appendChild(inner);

      el.dataset.mqReady = '1';

      var item = {
        el: el, frame: frame, inner: inner,
        varName: spec.varName, speed: speedOf(spec)
      };
      el.__mqItem = item;
      return item;
    }

    /* 丈量：臨時把容器壓到 1px，分別讀「一份內容寬」與軌道實際寬 */
    function measure(item) {
      var el = item.el;
      var host = el.parentNode;
      var prevWidth = host.style.width;
      var prevAnim = el.style.animation;

      el.style.animation = 'none';
      host.style.width = '1px';

      var one = item.frame.getBoundingClientRect().width;
      var track = item.inner.getBoundingClientRect().width;

      host.style.width = prevWidth;
      el.style.animation = prevAnim;

      return { one: one, track: track };
    }

    /* ③ 位移量恆為一份內容寬，故無縫條件是
          「軌道寬 − 一份內容寬 ≥ 容器可見寬」；不滿足時補足副本
          （每次補 2 份，保持偶數份），避免循環末段右側露白 */
    function padUp(item, m) {
      var visible = item.el.parentNode.clientWidth || 0;
      var padded = false;
      var guard = 0;

      while (m.one > 0 && (m.track - m.one) < visible && guard < 12) {
        for (var k = 0; k < 2; k++) {
          var extra = item.frame.cloneNode(true);
          extra.setAttribute('aria-hidden', 'true');
          item.inner.appendChild(extra);
          m.track += m.one;
        }
        padded = true;
        guard++;
      }
      return padded;
    }

    /* ④ 重置動畫：flash 一次使新的 duration 立即生效，位移基準歸零 */
    function restart(item) {
      var el = item.el;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    }

    function apply(item, m, padded) {
      if (!(m.one > 0)) return;

      var duration = m.one / item.speed;
      var changed = padded || !item.lastDuration ||
        Math.abs(item.lastDuration - duration) > 0.01;

      /* duration = 一份內容寬 ÷ 目標速度（秒），實測速度嚴格等於目標值；
         --mq-shift = 負的「一份內容寬」像素值（向左位移）—— 逐幀位移恆等
         於一份內容寬，與軌道 padding-left / 副本份數 / 視口寬度均無關，
         故循環閉合處零跳變。

         v1.3 修正：舊實現寫 `-(one / track * 100)%`，而 translateX(%) 的
         基準是元素自身 border-box（軌道 padding-left:24px 被計入被除數），
         實際循環位移 = 一份寬 + 約 6px，導致 nb（78s）/ hero（29.35s）
         每週期在閉合處瞬跳約 6px、速度同源偏高 0.5%~0.95%。 */
      ctx.style.setProperty(item.varName, duration.toFixed(2) + 's');
      item.el.style.setProperty('--mq-shift', (-m.one).toFixed(2) + 'px');
      item.lastDuration = duration;

      if (changed) restart(item);
    }

    function refreshItem(item) {
      var m = measure(item);
      var padded = padUp(item, m);
      apply(item, m, padded);
    }

    function runAll() {
      if (!items.length || document.hidden) return;
      items.forEach(refreshItem);
    }

    function schedule() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        runAll();
      });
    }

    function init() {
      if (booted || reduceMotion) return;
      booted = true;

      SPECS.forEach(function (spec) {
        var el = pick(spec);
        if (!el) return;
        var item = build(el, spec);
        if (item) items.push(item);
      });

      runAll();
    }

    /* 內容被動態改寫後：重建結構 → 重算 duration → 重置動畫 */
    function refresh(el, html) {
      if (!el) return;

      if (el.__mqItem) {
        var idx = items.indexOf(el.__mqItem);
        if (idx >= 0) items.splice(idx, 1);
        el.__mqItem = null;
      }
      delete el.dataset.mqReady;

      if (typeof html === 'string') el.innerHTML = html;

      /* 內聯樣式還原，避免與重新包裝後的取值疊加 */
      el.style.flex = '0 0 auto';
      el.style.width = 'max-content';
      el.style.gap = '';
      el.style.paddingLeft = '';

      var spec = specOf(el);
      var item = spec ? build(el, spec) : null;
      if (item) {
        items.push(item);
        refreshItem(item);
      }
    }

    function boot() {
      init();
      schedule();
      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);
    }

    function onLoad(fn) {
      if (document.readyState === 'complete') fn();
      else window.addEventListener('load', fn);
    }

    /* 時機：load 之後 + 字體就緒之後各算一次，讀數最準 */
    onLoad(function () {
      boot();
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () {
          if (booted) schedule();
          else boot();
        });
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) schedule();
    });

    return {
      refresh: refresh,
      recalc: schedule
    };
  })();

  window.OBSIDIAN_MARQUEE = OBSIDIAN_MARQUEE;

  /* ======================================================================
     全息展臺掃描線行程（v1.3）
     ----------------------------------------------------------------------
     掃描線絕對定位於 .holo-showcase（該元素無 overflow:hidden，位移需
     限制在面板高度內），故其掃描行程必須等於面板實際高度。這裡把高度
     寫入 --holo-scan-travel，使 holo-scan 真正從上掃到下，而不是隻擺動
     8px。週期與 holo-float 統一為 8s、同相位起止，消除 3s/8s 異週期
     持續錯位帶來的"抖動/呼吸不均"觀感。
     ====================================================================== */
  (function holoScan() {
    var showcase = document.querySelector('.holo-showcase');
    if (!showcase) return;

    function sync() {
      var travel = showcase.getBoundingClientRect().height;
      if (travel > 0) {
        showcase.style.setProperty('--holo-scan-travel', travel.toFixed(2) + 'px');
      }
    }

    function schedule() {
      window.requestAnimationFrame(sync);
    }

    if (document.readyState === 'complete') sync();
    else window.addEventListener('load', sync);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
  })();

  /* ======================================================================
     新聞演播室：頻道切換 + 實時時鍾
     ====================================================================== */
  (function newsDesk() {
    var wrap = document.querySelector('[data-nb-channels]');
    if (!wrap) return;

    var btns = wrap.querySelectorAll('[data-nb-ch]');
    var leadTitle = document.querySelector('[data-nb-lead-title]');
    var leadDesc = document.querySelector('[data-nb-lead-desc]');
    var ticker = document.querySelector('[data-nb-ticker]');
    var channel = document.querySelector('[data-nb-channel]');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ch = btn.getAttribute('data-nb-ch');

        btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });

        var payload = window.OBSIDIAN_NEWS && window.OBSIDIAN_NEWS[ch];
        if (!payload) return;

        if (channel) channel.textContent = payload.label;
        if (leadTitle) leadTitle.textContent = payload.lead.title;
        if (leadDesc) leadDesc.textContent = payload.lead.desc;
        if (ticker) {
          /* 內容改寫後重算 duration 並重置動畫（計劃書 §9.5.2） */
          if (OBSIDIAN_MARQUEE && OBSIDIAN_MARQUEE.refresh) {
            OBSIDIAN_MARQUEE.refresh(ticker, payload.ticker);
          } else {
            ticker.innerHTML = payload.ticker;
          }
        }

        /* 報告 §6.4：每頻道獨立列表 */
        var list = document.getElementById('nbList');
        if (list) {
          list.innerHTML = payload.list.map(function (row) {
            return '<li class="nb-item"><span class="nb-item-date">' + row[0] +
              '</span><span class="nb-item-title">' + row[1] + '</span></li>';
          }).join('');
        }
      });
    });

    /* 時鍾：日期固定 + 實時時分，每分鐘刷新（報告 §2/§5） */
    var clock = document.querySelector('[data-nb-ts]');
    if (!clock) return;

    var WORLD_DATE = '2077.05.28';

    function tick() {
      var d = new Date();
      function pad(n) { return n < 10 ? '0' + n : String(n); }
      clock.textContent =
        WORLD_DATE + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    tick();
    setInterval(tick, 60000);
  })();

  /* ======================================================================
     通用 Tab 切換（聯系我們）
     ====================================================================== */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var btns = group.querySelectorAll('[data-tab]');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');

        btns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.classList.toggle('is-active--danger', active && b.hasAttribute('data-danger'));
          b.setAttribute('aria-selected', String(active));
        });

        document.querySelectorAll('[data-panel]').forEach(function (panel) {
          panel.classList.toggle('is-active', panel.getAttribute('data-panel') === target);
        });
      });
    });
  });

  /* ======================================================================
     進場動畫（報告 §5：fadeUp，逐個延遲）
     ====================================================================== */
  (function reveal() {
    var items = document.querySelectorAll('[data-reveal]');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.style.animation = 'none';
        el.style.opacity = '1';
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal'), 10) || 0;
        el.style.animationDelay = delay + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     Toast
     ====================================================================== */
  var toast = document.querySelector('.toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-in');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-in');
    }, 2600);
  }

  window.OBSIDIAN_TOAST = showToast;

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-pending]');
    if (!link) return;
    e.preventDefault();
    showToast(link.getAttribute('data-pending') || '該頁面正在建設中');
  });

  /* ======================================================================
     頁腳年份
     ====================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
/* ==========================================================================
   全站主菜單式視覺層 · 背景注入
   --------------------------------------------------------------------------
   由本模組單點注入 .obsidian-bg，不逐頁改 HTML。
   效能硬約束：
     - 單例 canvas，devicePixelRatio 上限 2
     - 幀率節流 24fps
     - 持續運行的 rAF 迴圈僅 1 個（粒子），與舊粒子層互斥
     - visibilitychange 隱藏時暫停
     - prefers-reduced-motion 下停掉所有位移，僅留靜態紋理
   ========================================================================== */

(function obsidianBg() {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 參數（依交付要求） --- */
  var PARTICLE_COUNT = 24;      /* ≤ 40 */
  var PARTICLE_MAX_R = 1;       /* 直徑 ≤ 2px → 半徑 ≤ 1 */
  var PARTICLE_MAX_V = 6;       /* 速度 ≤ 8 px/s */
  var FPS = 24;                 /* ≤ 30fps */
  var FRAME_MS = 1000 / FPS;
  var DPR_CAP = 2;

  /* 單例：已存在則不重複注入 */
  if (document.querySelector('.obsidian-bg')) return;

  var bg = document.createElement('div');
  bg.className = 'obsidian-bg';
  bg.setAttribute('aria-hidden', 'true');

  /* a. 霧狀光暈 ×3 */
  bg.innerHTML =
    '<div class="obsidian-bg__glow obsidian-bg__glow--a"></div>' +
    '<div class="obsidian-bg__glow obsidian-bg__glow--b"></div>' +
    '<div class="obsidian-bg__glow obsidian-bg__glow--c"></div>' +
    '<div class="obsidian-bg__grid"></div>' +
    '<canvas class="obsidian-bg__canvas"></canvas>' +
    '<div class="obsidian-bg__noise"></div>' +
    '<div class="obsidian-bg__vignette"></div>';

  document.body.insertBefore(bg, document.body.firstChild);

  var canvas = bg.querySelector('.obsidian-bg__canvas');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var pts = [];
  var w = 0, h = 0;

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    pts = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2 * PARTICLE_MAX_V,
        vy: (Math.random() - 0.5) * 2 * PARTICLE_MAX_V,
        r: Math.random() * PARTICLE_MAX_R * 0.6 + 0.3
      });
    }
  }

  sizeCanvas();
  initParticles();

  /* --- 降級：僅靜態紋理，不啟動 rAF --- */
  if (reduce) {
    ctx.clearRect(0, 0, w, h);
    /* 靜態點綴：只畫一次，不動 */
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,184,0.35)';
      ctx.fill();
    }
    return;
  }

  /* --- 24fps 節流 + 單一 rAF 迴圈 --- */
  var last = 0;
  var running = true;
  var rafId = null;

  function frame(ts) {
    rafId = window.requestAnimationFrame(frame);

    if (!running) return;
    if (ts - last < FRAME_MS) return;
    last = ts;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      q.x += q.vx / FPS;
      q.y += q.vy / FPS;

      if (q.x < 0) q.x = w;
      else if (q.x > w) q.x = 0;
      if (q.y < 0) q.y = h;
      else if (q.y > h) q.y = 0;

      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,184,0.5)';
      ctx.fill();
    }
  }

  rafId = window.requestAnimationFrame(frame);

  /* --- 可見性暫停 --- */
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) last = 0;
  });

  /* --- 視窗改變（防抖重繪） --- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      sizeCanvas();
      initParticles();
    }, 200);
  });
})();

/* ==========================================================================
   全站版本小字（統一注入，不逐頁改 HTML）
   ========================================================================== */

(function versionStamp() {
  'use strict';

  if (document.querySelector('.mn-version')) return;

  var v = 'v1.1.1 / © 2026 OBSIDIAN';
  var el = document.createElement('div');
  el.className = 'mn-version';
  el.textContent = v;

  var foot = document.querySelector('.site-footer .ft-inner') ||
             document.querySelector('.site-footer');

  if (foot && foot.parentNode) {
    foot.parentNode.insertBefore(el, foot);
  } else {
    document.body.appendChild(el);
  }
})();

/* ==========================================================================
   T-01 新增組件：Accordion / Hero Slider
   2026-10-23 · 決策層規格 docs/提示詞_T01_三項JS組件.md
   ========================================================================== */

/* --- 1. Accordion（單開，aria-expanded / hidden 三態同步） ------------------ */
(function accordion() {
  'use strict';

  var root = document.querySelector('[data-accordion]');
  if (!root) return;

  var items = Array.prototype.slice.call(root.querySelectorAll('.acc__item'));
  if (!items.length) return;

  function setOpen(item, open) {
    var btn = item.querySelector('.acc__trigger');
    var panel = item.querySelector('.acc__panel');
    if (!btn || !panel) return;

    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('is-open', open);
    if (open) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.acc__trigger');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      items.forEach(function (other) { setOpen(other, false); });
      if (willOpen) setOpen(item, true);
    });
  });

  /* 預設全部收起 */
  items.forEach(function (item) { setOpen(item, false); });
})();

/* --- 2. Hero Slider（三幀，4000ms，懸停/聚焦暫停，reduced-motion 靜止） ----- */
(function heroSlider() {
  'use strict';

  var root = document.querySelector('[data-slider]');
  if (!root) return;

  var track = root.querySelector('[data-slider-track]');
  if (!track) return;

  var slides = track.children;
  var count = slides.length;
  if (count < 2) return;

  var dots = Array.prototype.slice.call(root.querySelectorAll('.slider__dot'));
  var prev = root.querySelector('[data-slider-prev]');
  var next = root.querySelector('[data-slider-next]');
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  var INTERVAL = 4000;
  var index = 0;
  var timer = null;
  var hovering = false;
  var focusing = false;

  function render() {
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    dots.forEach(function (dot, i) {
      var on = i === index;
      dot.classList.toggle('is-active', on);
      dot.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function go(i) {
    index = (i % count + count) % count;
    render();
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (reduce && reduce.matches) return;
    /* 懸停或聚焦期間不得恢復自動播放 —— 手動切換後仍須保持暫停 */
    if (hovering || focusing) return;
    timer = window.setInterval(function () { go(index + 1); }, INTERVAL);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { go(i); start(); });
  });

  if (prev) prev.addEventListener('click', function () { go(index - 1); start(); });
  if (next) next.addEventListener('click', function () { go(index + 1); start(); });

  root.addEventListener('mouseenter', function () { hovering = true; stop(); });
  root.addEventListener('mouseleave', function () { hovering = false; start(); });

  root.addEventListener('focusin', function () { focusing = true; stop(); });
  root.addEventListener('focusout', function (e) {
    if (e.relatedTarget && root.contains(e.relatedTarget)) return;
    focusing = false;
    start();
  });

  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      if (reduce.matches) { stop(); } else { start(); }
    });
  }

  render();
  start();
})();

/* ==========================================================================
   導航功能區（T-02）
   --------------------------------------------------------------------------
   購物車入口（角標件數）與登入身分（會員名 / 登出）
   直接讀寫 localStorage，不依賴 cart.js / auth.js，
   故無需在 16 頁新增 <script> 標籤。
   儲存格式：
     obsidian.cart    → 陣列，每項含 { code, qty, ... }
     obsidian.session → 物件 { role, name, at }，未登入時不存在
   ========================================================================== */

(function headerActions() {
  'use strict';

  var KEY_CART = 'obsidian.cart';
  var KEY_SESSION = 'obsidian.session';

  /* 安全解析：資料損壞時視為空，不讓整頁腳本中斷 */
  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return val === null || val === undefined ? fallback : val;
    } catch (err) {
      return fallback;
    }
  }

  /* --- 購物車角標 --- */
  function renderCart() {
    var items = readJSON(KEY_CART, []);
    var qty = 0;

    if (Object.prototype.toString.call(items) === '[object Array]') {
      for (var i = 0; i < items.length; i++) {
        var n = parseInt(items[i] && items[i].qty, 10);
        if (!isNaN(n) && n > 0) qty += n;
      }
    }

    var badges = document.querySelectorAll('[data-cart-count]');
    for (var j = 0; j < badges.length; j++) {
      var el = badges[j];
      if (qty > 0) {
        el.textContent = String(qty);
        el.removeAttribute('hidden');
      } else {
        el.textContent = '0';
        el.setAttribute('hidden', '');
      }
    }
  }

  /* --- 登入身分 --- */
  function renderIdentity() {
    var s = readJSON(KEY_SESSION, null);
    var logged = !!(s && s.name);

    var guestBoxes = document.querySelectorAll('[data-guest-box]');
    for (var i = 0; i < guestBoxes.length; i++) {
      if (logged) {
        guestBoxes[i].setAttribute('hidden', '');
      } else {
        guestBoxes[i].removeAttribute('hidden');
      }
    }

    var sessionBoxes = document.querySelectorAll('[data-session-box]');
    for (var j = 0; j < sessionBoxes.length; j++) {
      if (logged) {
        sessionBoxes[j].removeAttribute('hidden');
      } else {
        sessionBoxes[j].setAttribute('hidden', '');
      }
    }

    var names = document.querySelectorAll('[data-session-name]');
    for (var k = 0; k < names.length; k++) {
      names[k].textContent = logged ? s.name : '';
    }
  }

  function renderAll() {
    renderCart();
    renderIdentity();
  }

  /* --- 跨頁籤同步 --- */
  window.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (e.key === KEY_CART || e.key === KEY_SESSION) renderAll();
  });

  /* --- 登出 --- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-logout]');
    if (!btn) return;

    try {
      window.localStorage.removeItem(KEY_SESSION);
    } catch (err) {
      /* 儲存不可用時仍以重新整理回到未登入狀態 */
    }
    location.reload();
  });

  renderAll();
})();
