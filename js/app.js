(function () {
  "use strict";

  var DAY_MS = 86400000;
  // Epoch anchor: day 0. Poem index = days since anchor, wrapped by list length.
  var ANCHOR = Date.UTC(2024, 0, 1);

  // Milestone dates (local time).
  var MET = new Date(2026, 0, 3);        // first met — 3 Jan 2026
  var TOGETHER = new Date(2026, 0, 24);  // officially together — 24 Jan 2026

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
    today: document.getElementById("today")
  };

  var poems = [];
  var backgrounds = [];
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

  function renderAnniversary(date) {
    if (!els.anniv) return;
    els.anniv.innerHTML = "";

    var togetherDays = daysBetween(TOGETHER, date);
    var metDays = daysBetween(MET, date);

    // Special banner: the day itself, or a monthly / yearly turn.
    var banner = "";
    if (togetherDays === 0) banner = "The day it all began 💗";
    else if (togetherDays > 0) {
      var md = monthsAndDays(TOGETHER, date);
      if (date.getDate() === TOGETHER.getDate() && togetherDays > 0) {
        if (md.months % 12 === 0)
          banner = "Happy " + plural(md.months / 12, "year") + " together 💗";
        else
          banner = "Happy " + plural(md.months, "month") + " together 💗";
      }
    }
    if (banner) {
      var b = document.createElement("p");
      b.className = "anniv__banner";
      b.textContent = banner;
      els.anniv.appendChild(b);
    }

    if (togetherDays >= 0) els.anniv.appendChild(pill("Together", togetherDays));
    if (metDays >= 0) els.anniv.appendChild(pill("Since we met", metDays));
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
    img.onload = function () {
      els.bg.style.backgroundImage = "url('" + url + "')";
      els.bg.classList.add("show");
    };
    img.onerror = function () {
      els.bg.classList.remove("show");
    };
    img.src = url;
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
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
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
