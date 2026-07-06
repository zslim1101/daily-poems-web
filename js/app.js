(function () {
  "use strict";

  var DAY_MS = 86400000;
  // Epoch anchor: day 0. Poem index = days since anchor, wrapped by list length.
  var ANCHOR = Date.UTC(2024, 0, 1);

  // Milestone dates (local time).
  var MET = new Date(2026, 0, 3);        // first met — 3 Jan 2026
  var TOGETHER = new Date(2026, 0, 24);  // officially together — 24 Jan 2026

  // "Send love back" → opens Telegram to this user with a prefilled message.
  var TG_USER = "zs_lim";
  var DEFAULT_MESSAGES = ["Thinking of you and smiling. I love you 💗"];

  var els = {
    date: document.getElementById("date"),
    poem: document.getElementById("poem"),
    title: document.getElementById("poem-title"),
    body: document.getElementById("poem-body"),
    author: document.getElementById("poem-author"),
    anniv: document.getElementById("anniv"),
    bg: document.getElementById("bg"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    today: document.getElementById("today"),
    love: document.getElementById("love"),
    modal: document.getElementById("modal"),
    modalHearts: document.getElementById("modal-hearts"),
    modalEyebrow: document.getElementById("modal-eyebrow"),
    modalTitle: document.getElementById("modal-title"),
    modalSub: document.getElementById("modal-sub")
  };

  var poems = [];
  var backgrounds = [];
  var messages = DEFAULT_MESSAGES;
  var offset = 0; // 0 = today, -1 = yesterday, +1 = tomorrow...

  function dayNumber(date) {
    var utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((utc - ANCHOR) / DAY_MS);
  }

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function daysBetween(from, to) {
    var a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    var b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / DAY_MS);
  }

  // Whole months + leftover days from `from` up to `to`. Assumes to >= from.
  function monthsAndDays(from, to) {
    var months =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth());
    var ref = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
    if (ref > to) {
      months -= 1;
      ref = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
    }
    return { months: months, days: daysBetween(ref, to) };
  }

  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  // Is `date` a milestone of the together-date? Returns null, or the
  // celebration copy for a monthly / yearly turn (or day zero).
  function getMilestone(date) {
    var togetherDays = daysBetween(TOGETHER, date);
    if (togetherDays === 0) {
      return {
        type: "first",
        banner: "The day it all began 💗",
        title: "The day it all began",
        sub: "Today, we became us."
      };
    }
    if (togetherDays > 0 && date.getDate() === TOGETHER.getDate()) {
      var md = monthsAndDays(TOGETHER, date);
      if (md.months <= 0) return null;
      if (md.months % 12 === 0) {
        var y = md.months / 12;
        return {
          type: "year",
          banner: "Happy " + plural(y, "year") + " together 💗",
          title: "Happy " + plural(y, "year") + "!",
          sub: plural(y, "year") + " of you and me."
        };
      }
      return {
        type: "month",
        banner: "Happy " + plural(md.months, "month") + " together 💗",
        title: "Happy " + plural(md.months, "month") + "!",
        sub: plural(md.months, "month") + " of you and me."
      };
    }
    return null;
  }

  function renderAnniversary(date) {
    if (!els.anniv) return;
    els.anniv.innerHTML = "";

    var togetherDays = daysBetween(TOGETHER, date);

    var milestone = getMilestone(date);
    if (milestone) {
      var b = document.createElement("p");
      b.className = "anniv__banner";
      b.textContent = milestone.banner;
      els.anniv.appendChild(b);
    }

    if (togetherDays >= 0) els.anniv.appendChild(pill("Together", togetherDays));
  }

  var lastCelebrated = null;

  function celebrate(date, milestone) {
    var key = date.toDateString();
    if (lastCelebrated === key) return; // don't re-pop on re-render of same day
    lastCelebrated = key;

    els.modalEyebrow.textContent = formatDate(date);
    els.modalTitle.textContent = milestone.title;
    els.modalSub.textContent = milestone.sub;

    makeHearts();
    els.modal.classList.add("open");
    els.modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    els.modal.classList.remove("open");
    els.modal.setAttribute("aria-hidden", "true");
  }

  function makeHearts() {
    var host = els.modalHearts;
    host.innerHTML = "";
    var glyphs = ["♥", "♡", "❤"];
    for (var i = 0; i < 16; i++) {
      var s = document.createElement("span");
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = Math.random() * 100 + "%";
      s.style.fontSize = 0.9 + Math.random() * 1.4 + "rem";
      s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      s.style.opacity = "0";
      host.appendChild(s);
    }
  }

  function pill(label, days) {
    var el = document.createElement("span");
    el.className = "anniv__pill";
    el.innerHTML = label + " <b>" + days + "</b> " + (days === 1 ? "day" : "days");
    return el;
  }

  function applyBackground(date) {
    if (!els.bg || !backgrounds.length) {
      if (els.bg) els.bg.classList.remove("show");
      return;
    }
    var name = backgrounds[mod(dayNumber(date), backgrounds.length)];
    var url = "assets/img/" + name;
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      els.bg.style.backgroundImage = "url('" + url + "')";
      els.bg.classList.add("show");
      themeFromImage(img);
    };
    img.onerror = function () {
      els.bg.classList.remove("show");
    };
    img.src = url;
  }

  // --- Dynamic theme: derive an accent colour from the day's photo ---

  var themeCanvas = document.createElement("canvas");
  var CARD_RGB = [255, 250, 246];

  function relLum(c) {
    var v = c.map(function (x) {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) {
    var l1 = relLum(a) + 0.05, l2 = relLum(b) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  function themeFromImage(img) {
    var rgb = averageColor(img);
    if (!rgb) return;
    var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    // Keep the photo's hue, but force a saturated accent that stays
    // readable on the cream card — darken until contrast is enough.
    var h = hsl[0];
    var s = clamp(hsl[1], 0.42, 0.8);
    var l = 0.46;
    var accent = hslToRgb(h, s, l);
    while (contrast(accent, CARD_RGB) < 4.2 && l > 0.24) {
      l -= 0.02;
      accent = hslToRgb(h, s, l);
    }
    var accentDark = hslToRgb(h, s, Math.max(0.16, l - 0.12));
    var root = document.documentElement.style;
    root.setProperty("--accent", rgbCss(accent));
    root.setProperty("--accent-dark", rgbCss(accentDark));
    root.setProperty(
      "--accent-soft",
      "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + ",0.12)"
    );
  }

  function averageColor(img) {
    try {
      var w = 24, h = 24;
      themeCanvas.width = w;
      themeCanvas.height = h;
      var ctx = themeCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      var data = ctx.getImageData(0, 0, w, h).data;
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    } catch (e) {
      // Tainted canvas (cross-origin) — keep the default theme.
      console.warn("Colour sample skipped:", e.message);
      return null;
    }
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function rgbCss(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function render() {
    if (!poems.length) return;

    var date = new Date();
    date.setDate(date.getDate() + offset);

    var idx = mod(dayNumber(date), poems.length);
    var p = poems[idx];

    els.date.textContent =
      (offset === 0 ? "Today · " : "") + formatDate(date);

    els.title.textContent = p.title;
    els.author.textContent = p.author;
    els.body.innerHTML = "";
    p.lines.forEach(function (line) {
      var span = document.createElement("span");
      span.textContent = line;
      els.body.appendChild(span);
    });

    renderAnniversary(date);
    applyBackground(date);

    var milestone = getMilestone(date);
    if (milestone) celebrate(date, milestone);

    // replay fade animation
    els.poem.classList.remove("fade");
    void els.poem.offsetWidth;
    els.poem.classList.add("fade");
  }

  function go(delta) {
    offset += delta;
    render();
  }

  function makePetals() {
    var host = document.querySelector(".petals");
    if (!host) return;
    var glyphs = ["❀", "✿", "❁", "❃", "♡"];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("span");
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = 9 + Math.random() * 10 + "s";
      s.style.animationDelay = -Math.random() * 12 + "s";
      s.style.fontSize = 0.8 + Math.random() * 1.1 + "rem";
      s.style.color =
        "rgba(255, " + (180 + Math.floor(Math.random() * 60)) + ", 210, 0.8)";
      host.appendChild(s);
    }
  }

  function bind() {
    els.prev.addEventListener("click", function () { go(-1); });
    els.next.addEventListener("click", function () { go(1); });
    els.today.addEventListener("click", function () { offset = 0; render(); });
    document.addEventListener("keydown", function (e) {
      if (els.modal.classList.contains("open")) {
        if (e.key === "Escape") closeModal();
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
    els.modal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeModal();
    });
    if (els.love) els.love.addEventListener("click", sendLove);
  }

  function sendLove() {
    var msg = messages[Math.floor(Math.random() * messages.length)];
    var url =
      "https://t.me/" + TG_USER + "?text=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  }

  function loadJson(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + path);
      return r.json();
    });
  }

  function boot() {
    makePetals();
    bind();

    // Backgrounds are optional — never block the poem on them.
    loadJson("data/backgrounds.json")
      .then(function (list) {
        backgrounds = Array.isArray(list) ? list : [];
        preloadBackgrounds();
        if (poems.length) applyBackground(currentDate());
      })
      .catch(function (err) {
        console.warn("No backgrounds loaded:", err);
      });

    loadJson("data/messages.json")
      .then(function (list) {
        if (Array.isArray(list) && list.length) messages = list;
      })
      .catch(function (err) {
        console.warn("Using default love messages:", err);
      });

    loadJson("data/poems.json")
      .then(function (data) {
        poems = data;
        render();
      })
      .catch(function (err) {
        els.title.textContent = "A poem is on its way…";
        els.body.textContent =
          "Open this page through a local server to load the collection.";
        console.error("Failed to load poems:", err);
      });
  }

  function currentDate() {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }

  // Fetch every background once so day-switches swap from cache instantly.
  function preloadBackgrounds() {
    backgrounds.forEach(function (name) {
      var img = new Image();
      img.src = "assets/img/" + name;
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
