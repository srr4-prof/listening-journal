(function () {
  const S = window.JOURNAL_SETTINGS;
  const $ = (id) => document.getElementById(id);
  const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

  let entries = [];
  let query = "";
  let matcher = null;
  function findHit(s) { const m = matcher && matcher.exec(s); return m ? m.index + m[1].length : -1; }
  let current = -1;
  let lastFocus = null;

  // ---- Cover ----
  document.title = S.BOOK_TITLE + " — " + S.PUBLISHER;
  $("cover-publisher").textContent = S.PUBLISHER;
  $("rh-book").textContent = S.BOOK_TITLE;
  $("cover-count").textContent = S.SUBTITLE;
  const words = S.BOOK_TITLE.split(/\s+/);
  $("cover-title").innerHTML = '<span class="visually-hidden">' + esc(S.BOOK_TITLE) + '</span>' + words.map((w, i) => {
    if (i === 0) {
      const amps = [1.25, 0.8, 1.35, 0.9, 1.2, 0.75, 1.3, 0.85, 1.15, 0.95];
      return '<span aria-hidden="true"><span class="listening">' + [...w].map((ch, k) =>
        '<i style="--amp:' + amps[k % amps.length] + ';animation-delay:' + (0.4 + k * 0.06).toFixed(2) + 's">' + esc(ch) + '</i>').join("") + '</span></span>';
    }
    return '<span aria-hidden="true">' + esc(w) + "</span>";
  }).join("");

  // ---- CSV ----
  function parseCSV(text) {
    const rows = []; let row = []; let field = ""; let q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(v => v.trim() !== ""));
  }

  function toEntries(rows) {
    const head = rows[0].map(h => h.trim().toLowerCase());
    const find = (re, fallback) => { const i = head.findIndex(h => re.test(h)); return i >= 0 ? i : fallback; };
    const cKey = find(/no article|sort/, 0);
    const cFull = find(/^full/, 1);
    const cText = find(/entry|text/, 2);
    const cSem = find(/semester|term/, 3);
    return rows.slice(1).map(r => {
      const full = (r[cFull] || r[cKey] || "").trim();
      const key = (r[cKey] || full).trim().replace(/^'/, "");
      return { key, full: full.replace(/^'/, ""), text: (r[cText] || "").replace(/\s+$/, ""), semester: (r[cSem] || "").trim() };
    }).filter(e => e.full);
  }

  function letterOf(key) {
    const ch = key.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^A-Za-z0-9]+/, "").charAt(0).toUpperCase();
    return /[A-Z]/.test(ch) ? ch : "#";
  }

  function slug(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entry";
  }

  // Japanese words in a title are marked as Japanese, so screen readers pronounce them in Japanese.
  function markJa(html) { return html.replace(/[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]+/g, m => '<span lang="ja">' + m + "</span>"); }
  function esc(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  // ---- Load ----
  fetch(S.DATA_URL, { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(t => {
      entries = toEntries(parseCSV(t));
      entries.sort((a, b) => collator.compare(a.key, b.key) || collator.compare(a.full, b.full));
      const seen = {};
      entries.forEach((e, i) => {
        e.n = i + 1; e.letter = letterOf(e.key);
        let s = "entry-" + slug(e.full); while (seen[s]) s += "-2"; seen[s] = 1; e.id = s;
        e.search = (e.full + " " + e.key + " " + e.text).toLowerCase();
      });
      setup();
    })
    .catch(err => {
      $("toc").innerHTML = '<div class="message"><h3>The entries didn’t load.</h3><p>The page couldn’t read the spreadsheet at <i>' + esc(S.DATA_URL) +
        '</i>. Check that the link in the settings is the published CSV link and that the sheet is still published.</p></div>';
      console.error(err);
    });

  // ---- Build ----
  function setup() {
    const season = { winter: 0, spring: 1, summer: 2, fall: 3, autumn: 3 };
    const semOrder = (x) => { const m = x.match(/(\w+)\s+(\d{4})/); return m ? +m[2] * 10 + (season[m[1].toLowerCase()] ?? 5) : 99999; };
    const sems = [...new Set(entries.map(e => e.semester).filter(Boolean))].sort((a, b) => semOrder(a) - semOrder(b));
    $("cover-semester").textContent = S.COVER_DATES || sems.join(", ");
    $("colophon-text").textContent = S.BOOK_TITLE + ", " + S.PUBLISHER + (sems.length ? ", " + sems.join(", ") : "") + ". " + entries.length + " entries.";

    const letters = new Set(entries.map(e => e.letter));
    const nav = $("alphabet");
    const firstOf = {};
    entries.forEach((e, i) => { if (!(e.letter in firstOf)) firstOf[e.letter] = i; });
    ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].forEach(L => {
      if (L === "#" && !letters.has("#")) return;
      const b = document.createElement("button");
      b.type = "button"; b.textContent = L; b.dataset.letter = L;
      b.setAttribute("aria-label", "Start reading at " + (L === "#" ? "titles that start with a number" : L));
      if (!letters.has(L)) { b.disabled = true; b.setAttribute("aria-label", (L === "#" ? "Numbers" : L) + ", no titles"); }
      b.addEventListener("click", () => openEntry(firstOf[L], true));
      nav.appendChild(b);
    });

    $("q").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
    $("random").addEventListener("click", () => openEntry(Math.floor(Math.random() * entries.length), true));
    $("close").addEventListener("click", closeEntry);
    $("prev").addEventListener("click", () => openEntry(current - 1, true, "prev"));
    $("next").addEventListener("click", () => openEntry(current + 1, true, "next"));
    document.addEventListener("keydown", (e) => {
      if (!$("reader").classList.contains("open")) return;
      if (e.key === "Escape") closeEntry();
      else if (e.key === "ArrowLeft" && current > 0) openEntry(current - 1, true);
      else if (e.key === "ArrowRight" && current < entries.length - 1) openEntry(current + 1, true);
    });
    window.addEventListener("hashchange", fromHash);
    render();
    fromHash();
  }

  function snippetFor(e) {
    const i = findHit(e.text);
    if (i < 0) return "";
    const start = Math.max(0, i - 40), end = Math.min(e.text.length, i + query.length + 60);
    const before = e.text.slice(start, i), hit = e.text.slice(i, i + query.length), after = e.text.slice(i + query.length, end);
    return (start > 0 ? "…" : "") + esc(before) + "<mark>" + esc(hit) + "</mark>" + esc(after) + (end < e.text.length ? "…" : "");
  }

  function highlight(s) {
    if (!query) return esc(s);
    const i = findHit(s);
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + query.length)) + "</mark>" + esc(s.slice(i + query.length));
  }

  function render() {
    matcher = query ? new RegExp("(^|[^\\p{L}\\p{N}])" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu") : null;
    const shown = entries.filter(e => !query || matcher.test(e.search));
    const groups = [];
    shown.forEach(e => { const g = groups[groups.length - 1]; if (g && g.letter === e.letter) g.items.push(e); else groups.push({ letter: e.letter, items: [e] }); });
    $("toc").innerHTML = groups.map(g =>
      '<section class="group" aria-label="' + (g.letter === "#" ? "Numbers" : g.letter) + '"><h3 class="group-letter"><button type="button" class="letter-link" data-i="' + entries.findIndex(x => x.letter === g.letter) + '" aria-label="' + (g.letter === "#" ? "Numbers" : g.letter) + ', start reading here">' + g.letter + '</button></h3><ol>' +
      g.items.map(e => {
        const titleHit = !query || matcher.test(e.full + " " + e.key);
        const snip = query && !titleHit ? '<span class="snippet">' + snippetFor(e) + '</span>' : "";
        return '<li><a class="toc-link" href="#' + e.id + '" data-i="' + (e.n - 1) + '"><span class="t">' + markJa(highlight(e.full)) + '</span><span class="leader" aria-hidden="true"></span><span class="n" aria-hidden="true">' + e.n + '</span>' + snip + '</a></li>';
      }).join("") + '</ol></section>').join("");

    let msg = "";
    if (query && !shown.length) msg = "Nothing matches “" + esc(query) + "”. " + '<button type="button" id="clear">Clear the search</button>';
    else if (query) msg = shown.length + (shown.length === 1 ? " entry mentions" : " entries mention") + " “" + esc(query) + "”.";
    else msg = "Pick a letter to start reading there, then use Next to carry on through the alphabet.";
    $("status").innerHTML = msg;
    const clr = $("clear"); if (clr) clr.addEventListener("click", () => { $("q").value = ""; query = ""; render(); $("q").focus(); });
  }

  // ---- Reader ----
  function openEntry(i, push, viaButton) {
    if (i < 0 || i >= entries.length) return;
    const e = entries[i];
    if (!$("reader").classList.contains("open")) lastFocus = document.activeElement;
    current = i;
    $("entry-title").innerHTML = markJa(esc(e.full));
    const lines = e.text.split(/\n/).filter(l => l.trim() !== "");
    const lens = lines.map(l => l.trim().length).sort((a, b) => a - b);
    const isVerse = lines.length >= 4 && lens[Math.floor(lens.length / 2)] < 70;
    $("entry-body").innerHTML = isVerse ? '<div class="verse">' + esc(e.text) + '</div>' : e.text.split(/\n+/).filter(p => p.trim() !== "").map(p => {
      const figure = /\|/.test(p) || /^[Ii|*\s]+$/.test(p);
      const verbatim = !figure && (/^\s/.test(p) || / {3,}/.test(p));
      const cls = figure ? ' class="figure" role="img" tabindex="0" aria-label="Text drawing made of lines and letters"' : verbatim ? ' class="verbatim"' : "";
      return "<p" + cls + ">" + esc(figure || verbatim ? p : p.trim()) + "</p>";
    }).join("");
    $("folio").textContent = String(e.n);
    $("folio").setAttribute("aria-label", "Entry " + e.n + " of " + entries.length);
    $("rh-book").textContent = S.BOOK_TITLE + (e.semester ? ", " + e.semester : "");
    const p = entries[i - 1], n = entries[i + 1];
    $("prev").disabled = !p; $("prev-title").textContent = p ? p.full : "";
    $("next").disabled = !n; $("next-title").textContent = n ? n.full : "";
    $("prev").setAttribute("aria-label", p ? "Previous entry: " + p.full : "No previous entry");
    $("next").setAttribute("aria-label", n ? "Next entry: " + n.full : "No next entry");
    setBackground(true);
    $("reader").classList.add("open");
    $("reader").scrollTop = 0;
    document.body.style.overflow = "hidden";
    document.title = e.full + " — " + S.BOOK_TITLE;
    if (push && location.hash !== "#" + e.id) { try { history.pushState(null, "", "#" + e.id); } catch (_) { location.hash = e.id; } }
    if (viaButton && !$(viaButton).disabled) {
      $(viaButton).focus({ preventScroll: true });
      announce(e.full + ". Entry " + e.n + " of " + entries.length + ".");
    } else {
      $("entry-title").focus({ preventScroll: true });
    }
  }

  // While a page is open, the cover and contents behind it are taken out of reach
  // of the keyboard and screen readers, so nobody gets lost behind the page.
  function setBackground(off) {
    ["top", "contents"].forEach(id => { const el = $(id); if (off) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
  }
  function announce(msg) { const a = $("announcer"); a.textContent = ""; setTimeout(() => { a.textContent = msg; }, 60); }

  function closeEntry() {
    $("reader").classList.remove("open");
    setBackground(false);
    document.body.style.overflow = "";
    document.title = S.BOOK_TITLE + " — " + S.PUBLISHER;
    if (location.hash.startsWith("#entry-")) { try { history.pushState(null, "", "#contents"); } catch (_) { location.hash = "contents"; } }
    const link = document.querySelector('.toc-link[data-i="' + current + '"]');
    (link || lastFocus || $("q")).focus({ preventScroll: false });
  }

  // ---- Contributors ----
  let contributors = [];
  fetch(S.CONTRIBUTORS_URL, { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(t => {
      const rows = parseCSV(t);
      const head = rows[0].map(h => h.trim().toLowerCase());
      const col = (re, f) => { const i = head.findIndex(h => re.test(h)); return i >= 0 ? i : f; };
      const cN = col(/name/, 0), cV = col(/vol/, 1), cS = col(/semester|term/, 2);
      contributors = rows.slice(1).map(r => ({ name: (r[cN] || "").trim(), vol: (r[cV] || "").trim(), sem: (r[cS] || "").trim() })).filter(c => c.name);
      if (!contributors.length) return;
      const groups = [];
      contributors.forEach(c => { const k = c.vol + "|" + c.sem; let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, vol: c.vol, sem: c.sem, names: [] }); g.names.push(c.name); });
      $("contrib-body").innerHTML = groups.map(g =>
        '<section class="vol"><h2>' + esc(g.vol || g.sem) + (g.vol && g.sem ? '<span>' + esc(g.sem) + '</span>' : "") + '</h2><ul>' +
        g.names.map(n => "<li>" + esc(n) + "</li>").join("") + "</ul></section>").join("");
      $("contrib-rh").textContent = S.BOOK_TITLE + ", " + S.PUBLISHER;
      $("contrib-foot").textContent = S.ORGANIZED_BY || "";
      $("open-contrib").hidden = false;
      $("open-contrib").addEventListener("click", () => openContrib(true));
      $("contrib-close").addEventListener("click", closeContrib);
      if (location.hash === "#contributors") openContrib(false);
    })
    .catch(err => console.warn("Contributors not loaded:", err));

  function openContrib(push) {
    lastFocus = document.activeElement;
    $("contrib").classList.add("open"); $("contrib").scrollTop = 0;
    setBackground(true);
    document.body.style.overflow = "hidden";
    document.title = "Contributors — " + S.BOOK_TITLE;
    if (push) { try { history.pushState(null, "", "#contributors"); } catch (_) {} }
    $("contrib-title").focus({ preventScroll: true });
  }
  function closeContrib() {
    $("contrib").classList.remove("open");
    setBackground(false);
    document.body.style.overflow = "";
    document.title = S.BOOK_TITLE + " — " + S.PUBLISHER;
    if (location.hash === "#contributors") { try { history.pushState(null, "", "#contents"); } catch (_) {} }
    ($("open-contrib")).focus({ preventScroll: true });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("contrib").classList.contains("open")) closeContrib(); });

  function fromHash() {
    const h = location.hash.slice(1);
    if (h === "contributors" && contributors.length) { openContrib(false); return; }
    if ((h === "contents" || h === "top") && $("contrib").classList.contains("open")) { $("contrib").classList.remove("open"); setBackground(false); document.body.style.overflow = ""; }
    if (h.startsWith("entry-")) {
      const i = entries.findIndex(e => e.id === h);
      if (i >= 0) { openEntry(i, false); return; }
    }
    // Only close the page when the address points back to the contents or cover,
    // so a host page that rewrites the address can't snap the book shut.
    if ((h === "contents" || h === "top") && $("reader").classList.contains("open")) { $("reader").classList.remove("open"); setBackground(false); document.body.style.overflow = ""; }
  }

  document.addEventListener("click", (ev) => {
    const L = ev.target.closest(".letter-link");
    if (L) { openEntry(+L.dataset.i, true); return; }
    const a = ev.target.closest(".toc-link");
    if (!a) return;
    ev.preventDefault();
    openEntry(+a.dataset.i, true);
  });
})();
