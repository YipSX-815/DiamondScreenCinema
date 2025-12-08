let selectedMovieData = null;

document.addEventListener("DOMContentLoaded", () => {
    initMovieDropdown();

    const movieSelect = document.getElementById("movieSelect");
    const previewPoster = document.getElementById("previewPoster");
    const previewTitle = document.getElementById("previewTitle");
    const previewGenre = document.getElementById("previewGenre");
    const previewLanguage = document.getElementById("previewLanguage");
    const previewStatus = document.getElementById("previewStatus");

    const startDateEl = document.getElementById("startDate");
    const endDateEl = document.getElementById("endDate");

    const windowsEl = document.getElementById("windows");
    const generateBtn = document.getElementById("generate");
    const messagesEl = document.getElementById("messages");
    const timelineArea = document.getElementById("timelineArea");
    const timeScale = document.getElementById("timeScale");
    const rightColumn = document.getElementById("rightColumn");
    const notifSummary = document.getElementById("notifSummary");
    const hallsGrid = document.getElementById("halls");

    if (!movieSelect) return;

    const OP_START = 480;
    const OP_END_NORMAL = 180;
    const OP_END = 1440 + OP_END_NORMAL;
    const SNAP_MINUTES = 5;

    const HALLS = [
        { id: 1, name: "Hall 1", capacity: 120 },
        { id: 2, name: "Hall 2", capacity: 120 },
        { id: 3, name: "Hall 3", capacity: 120 },
        { id: 4, name: "Hall 3", capacity: 120 },
        { id: 5, name: "Hall 3", capacity: 120 },
        { id: 6, name: "Hall 3", capacity: 120 },
        { id: 7, name: "Hall 3", capacity: 120 },
        { id: 8, name: "Hall 3", capacity: 120 },
        { id: 9, name: "Hall 3", capacity: 120 },
        { id: 10, name: "Hall 3", capacity: 120 },
        { id: 11, name: "Hall 3", capacity: 120 },
        { id: 12, name: "Hall 3", capacity: 120 },
    ];

    let pxPerMin = 1;
    let timelinePxWidth = 1600;
    let pendingChanges = [];
    let undoStack = [];
    let redoStack = [];
    let dragState = null;

    function parseHHMM(h) {
        if (!h) return null;
        const [a, b] = h.split(":").map(Number);
        return Number.isNaN(a) ? null : a * 60 + b;
    }

    function mapToTimelineMinutes(m) {
        return m <= OP_END_NORMAL ? m + 1440 : m;
    }

    function hhmmToTimelineMinutes(h) {
        const v = parseHHMM(h);
        return v == null ? null : mapToTimelineMinutes(v);
    }

    function formatTimelineMins(m) {
        if (m >= 1440) m -= 1440;
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        return `${hh}:${mm}`;
    }

    function minutesToPx(m) { return Math.round((m - OP_START) * pxPerMin); }
    function pxToMinutes(px) { return Math.round(px / pxPerMin + OP_START); }
    function snapMinutes(m) { return Math.round(m / SNAP_MINUTES) * SNAP_MINUTES; }

    function normalizePosterPath(p) {
        if (!p || p === "null" || p === "undefined") return "/images/no-poster.png";
        if (p.startsWith("http") || p.startsWith("/")) return p;
        return "/" + p;
    }

    function createWindowItem(a = "08:00", b = "22:00") {
        const x = document.createElement("div");
        x.className = "time-window-item";
        x.innerHTML = `
            <button type="button" class="remove-window-btn">×</button>
            <div class="time-window-inputs">
                <div class="time-input-block">
                    <label class="control-label">Start</label>
                    <input type="time" class="input-field start-time" value="${a}">
                </div>
                <div class="time-input-block">
                    <label class="control-label">End</label>
                    <input type="time" class="input-field end-time" value="${b}">
                </div>
            </div>`;
        x.querySelector(".remove-window-btn").addEventListener("click", () => {
            x.remove();
            if (!windowsEl.children.length) addDefaultWindow();
        });
        return x;
    }

    function addDefaultWindow() {
        windowsEl.innerHTML = "";
        windowsEl.appendChild(createWindowItem("08:00", "22:00"));
    }

    function initHalls() {
        hallsGrid.innerHTML = "";
        HALLS.forEach(h => {
            const d = document.createElement("div");
            d.className = "hall-option selected";
            d.dataset.hallId = h.id;
            d.innerHTML = `<div class="hall-name">${h.name}</div><div class="hall-info">${h.capacity} seats</div>`;
            d.addEventListener("click", () => d.classList.toggle("selected"));
            hallsGrid.appendChild(d);
        });
    }

    function updatePreview() {
        if (!selectedMovieData) return;

        previewPoster.src = selectedMovieData.poster || "/images/no-poster.png";
        previewTitle.textContent = selectedMovieData.title;
        previewGenre.textContent = selectedMovieData.genre;
        previewLanguage.textContent = selectedMovieData.language;
        previewStatus.textContent = selectedMovieData.status;

        if (selectedMovieData.date) {
            startDateEl.value = selectedMovieData.date;
        }
    }

    function clearMessages() { messagesEl.innerHTML = ""; }
    function showError(t) { messagesEl.innerHTML += `<div class="message message-error">⚠️ ${t}</div>`; }
    function showSuccess(t) { messagesEl.innerHTML += `<div class="message message-success">✔ ${t}</div>`; }
    function showInfo(t) { messagesEl.innerHTML += `<div class="message message-info">ℹ️ ${t}</div>`; }

    function buildTimeScale() {
        timeScale.innerHTML = "";
        for (let t = OP_START; t <= OP_END; t += 60) {
            const l = minutesToPx(t);
            const a = document.createElement("div");
            a.className = "time-tick";
            a.style.left = `${l}px`;
            const b = document.createElement("div");
            b.className = "tick-label";
            b.style.left = `${l}px`;
            b.textContent = formatTimelineMins(t);
            timeScale.appendChild(a);
            timeScale.appendChild(b);
        }
    }

    function collectWindows() {
        const out = [];
        windowsEl.querySelectorAll(".time-window-item").forEach((w, i) => {
            const s = w.querySelector(".start-time").value;
            const e = w.querySelector(".end-time").value;
            if (!s || !e) return;
            let sm = hhmmToTimelineMinutes(s);
            let em = hhmmToTimelineMinutes(e);
            if (em <= sm) em += 1440;
            out.push({ start: sm, end: em });
        });
        return out;
    }

    function validateSchedule() {
        const errors = [];
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;

        if (!startDate || !endDate) errors.push("Start date and End date are required.");
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push("End date cannot be earlier than start date.");
        }

        if (!selectedMovieData || !selectedMovieData.id) {
            errors.push("Please select a movie.");
        }

        const selectedHalls = document.querySelectorAll(".hall-option.selected");
        if (selectedHalls.length === 0) errors.push("Please select at least one hall.");

        const windows = windowsEl.querySelectorAll(".time-window-item");
        if (windows.length === 0) {
            errors.push("You must add at least one time window.");
        } else {
            windows.forEach((window, index) => {
                const startTime = window.querySelector(".start-time").value;
                const endTime = window.querySelector(".end-time").value;
                if (!startTime || !endTime) {
                    errors.push(`Window ${index + 1}: Start time and End time are required.`);
                    return;
                }

                const startMinutes = parseHHMM(startTime);
                const endMinutes = parseHHMM(endTime);
                if (startMinutes === null || endMinutes === null) {
                    errors.push(`Window ${index + 1}: Invalid time format.`);
                    return;
                }

                if (!((startMinutes >= OP_START) || (startMinutes <= OP_END_NORMAL))) {
                    errors.push(`Window ${index + 1}: Start time is outside operating hours (8AM – 3AM).`);
                }
                if (!((endMinutes >= OP_START) || (endMinutes <= OP_END_NORMAL))) {
                    errors.push(`Window ${index + 1}: End time is outside operating hours (8AM – 3AM).`);
                }

                let correctedEndMinutes = endMinutes;
                if (endMinutes <= startMinutes) correctedEndMinutes += 1440;
                if (correctedEndMinutes <= startMinutes) {
                    errors.push(`Window ${index + 1}: End time must be later than Start time.`);
                }
            });
        }

        return errors;
    }

    function buildTimeline(windows, duration, buffer) {
        timelineArea.innerHTML = "";
        const total = OP_END - OP_START;

        pxPerMin = 0.75;
        timelinePxWidth = total * pxPerMin;

        buildTimeScale();

        const selected = [...document.querySelectorAll(".hall-option.selected")]
            .map(x => HALLS.find(h => h.id === parseInt(x.dataset.hallId)))
            .filter(Boolean);

        const title = selectedMovieData?.title || "Untitled";

        const popularity = document.querySelector(".popularity-option.selected")?.dataset.value || "medium";

        selected.forEach(h => {
            const row = document.createElement("div");
            row.className = "timeline-row";
            row.dataset.hallId = h.id;

            const label = document.createElement("div");
            label.className = "timeline-hall-label";
            label.textContent = h.name;

            const wrap = document.createElement("div");
            wrap.className = "timeline-track-wrapper";

            const track = document.createElement("div");
            track.className = "timeline-track";
            track.dataset.hallId = h.id;
            track.style.width = timelinePxWidth + "px";

            wrap.appendChild(track);
            row.appendChild(label);
            row.appendChild(wrap);
            timelineArea.appendChild(row);

            let c = 0;
            windows.forEach(w => {
                const ws = w.start;
                const we = Math.min(w.end, OP_END);
                const av = we - ws;
                if (av <= 0) return;

                let n = popularity === "high" ? 7 : popularity === "low" ? 3 : 5;
                const max = Math.floor((av + buffer) / (duration + buffer));
                n = Math.min(n, max);
                if (!n) return;

                const occ = n * duration + (n - 1) * buffer;
                const free = av - occ;
                const gaps = n + 1;
                const gap = Math.floor(free / gaps);

                let p = ws + gap;
                for (let i = 0; i < n; i++) {
                    const end = p + duration;
                    const left = minutesToPx(p);

                    const b = document.createElement("div");
                    b.className = "show-block";
                    b.style.left = left + "px";
                    b.style.width = Math.max(30, Math.round(duration * pxPerMin)) + "px";
                    b.dataset.id = `show-${h.id}-${c++}`;
                    b.dataset.hallId = h.id;
                    b.dataset.start = p;
                    b.dataset.duration = duration;
                    b.dataset.title = title;

                    b.innerHTML = `
                        <div class="show-title">${title}</div>
                        <div class="show-time">${formatTimelineMins(p)} - ${formatTimelineMins(end)}</div>
                    `;

                    track.appendChild(b);
                    p += duration;
                    if (i < n - 1) p += buffer + gap;
                }
            });

            for (let t = OP_START + 60; t <= OP_END - 60; t += 60) {
                const l = minutesToPx(t);
                if (l <= minutesToPx(OP_END) + 100) {
                    const d = document.createElement("div");
                    d.className = "timeline-hour-divider";
                    d.style.left = `${l}px`;
                    track.appendChild(d);
                }
            }
        });

        pendingChanges = [];
        refreshNotifSummary();
        enableDragAndDrop();
    }

    function generateSchedulePreview() {
        clearMessages();
        const e = validateSchedule();
        if (e.length) {
            e.forEach(showError);
            return;
        }

        if (!selectedMovieData) {
            showError("Please select a movie first.");
            return;
        }

        const duration = parseInt(selectedMovieData.duration) || 120;
        const clean = parseInt(document.getElementById("cleanBuffer").value) || 0;
        const prep = parseInt(document.getElementById("prepBuffer").value) || 0;
        const buffer = clean + prep;

        const w = collectWindows();
        if (!w.length) {
            showError("No valid time windows defined.");
            return;
        }

        buildTimeline(w, duration, buffer);

        document.getElementById("scheduleCard").classList.remove("schedule-hidden");
        showSuccess("Schedule generated!");
        timelineArea.scrollLeft = 0;

        rebindPopularityOptions();
    }

    generateBtn.addEventListener("click", generateSchedulePreview);

    function refreshNotifSummary() {
        if (!notifSummary) return;
        if (!pendingChanges.length) {
            notifSummary.textContent = "No pending changes";
            notifSummary.style.color = "";
            return;
        }
        notifSummary.textContent = `${pendingChanges.length} pending change(s)`;
        notifSummary.style.color = "#d97706";
    }

    function pushUndo() {
        undoStack.push(createSnapshot());
        redoStack = [];
    }

    function createSnapshot() {
        return {
            timelineHTML: timelineArea.innerHTML,
            floatingHTML: document.getElementById("floatingBlocks")?.innerHTML || "",
            pending: JSON.parse(JSON.stringify(pendingChanges)),
            px: pxPerMin
        };
    }

    function restoreSnapshot(s) {
        if (!s) return;

        document.querySelectorAll(".drag-ghost").forEach(x => x.remove());
        dragState = null;

        timelineArea.innerHTML = s.timelineHTML || "";

        const f = document.getElementById("floatingBlocks");
        if (f) f.innerHTML = s.floatingHTML || "";

        pendingChanges = Array.isArray(s.pending) ? s.pending.slice() : [];
        pxPerMin = s.px || pxPerMin;

        attachDragToAllBlocks();
        refreshNotifSummary();
        rebindPopularityOptions();
    }

    document.getElementById("undoBtn").addEventListener("click", () => {
        if (!undoStack.length) return;
        const last = undoStack.pop();
        redoStack.push(createSnapshot());
        restoreSnapshot(last);
    });

    document.getElementById("redoBtn").addEventListener("click", () => {
        if (!redoStack.length) return;
        const next = redoStack.pop();
        undoStack.push(createSnapshot());
        restoreSnapshot(next);
    });

    function createGhost(b) {
        const r = b.getBoundingClientRect();
        const g = b.cloneNode(true);
        g.classList.add("drag-ghost");
        g.style.pointerEvents = "none";
        g.style.position = "fixed";
        g.style.left = r.left + "px";
        g.style.top = r.top + "px";
        g.style.width = r.width + "px";
        g.style.height = r.height + "px";
        g.style.zIndex = 100000;
        return g;
    }

    function enableDragAndDrop() {
        document.querySelectorAll(".show-block").forEach(bindBlock);
    }

    function bindBlock(b) {
        b.removeEventListener("mousedown", onBlockMouseDown);
        b.removeEventListener("touchstart", onBlockTouchStart);
        b.addEventListener("mousedown", onBlockMouseDown);
        b.addEventListener("touchstart", onBlockTouchStart, { passive: false });
    }

    function attachDragToAllBlocks() {
        document.querySelectorAll(".drag-ghost").forEach(x => x.remove());
        dragState = null;

        document.querySelectorAll(".show-block").forEach(b => {
            b.classList.remove("dragging");
            b.style.pointerEvents = "auto";
            b.style.visibility = "";
            b.style.zIndex = 10;
            b.style.top = "7px";

            const d = parseInt(b.dataset.duration) || 0;
            const s = parseInt(b.dataset.start);

            if (!Number.isNaN(d)) {
                b.style.width = Math.max(30, Math.round((pxPerMin || 1) * d)) + "px";
            }

            if (!Number.isNaN(s)) {
                b.style.left = minutesToPx(s) + "px";
            }

            b.style.position = "absolute";
            b.style.minWidth = "";
            b.style.maxWidth = "";

            b.removeEventListener("mousedown", onBlockMouseDown);
            b.removeEventListener("touchstart", onBlockTouchStart);
            b.addEventListener("mousedown", onBlockMouseDown);
            b.addEventListener("touchstart", onBlockTouchStart, { passive: false });
        });
    }

    function onBlockMouseDown(e) {
        e.preventDefault();
        startDragSession(e, false);
    }

    function onBlockTouchStart(e) {
        e.preventDefault();
        startDragSession(e, true);
    }

    function startDragSession(e, isTouch) {
        const t = (isTouch ? e.touches[0] : e).target;
        const b = t.closest(".show-block");
        if (!b) return;

        const g = createGhost(b);
        b.style.visibility = "hidden";
        b.classList.add("dragging");

        const r = b.getBoundingClientRect();
        const cx = isTouch ? e.touches[0].clientX : e.clientX;
        const cy = isTouch ? e.touches[0].clientY : e.clientY;

        dragState = {
            block: b,
            ghost: g,
            origHall: b.dataset.hallId,
            origRowEl: document.querySelector(`.timeline-row[data-hall-id="${b.dataset.hallId}"]`),
            duration: parseInt(b.dataset.duration) || 0,
            startOriginal: parseInt(b.dataset.start) || OP_START,
            offsetX: cx - r.left,
            offsetY: cy - r.top,
            widthPx: r.width,
            lastHoverRow: null
        };

        document.body.appendChild(g);
        pushUndo();
    }

    document.addEventListener("mousemove", onGlobalMove);
    document.addEventListener("touchmove", onGlobalMove, { passive: false });
    document.addEventListener("mouseup", onGlobalUp);
    document.addEventListener("touchend", onGlobalUp);

    function onGlobalMove(e) {
        if (!dragState) return;
        e.preventDefault();

        const isTouch = !!e.touches;
        const cx = isTouch ? e.touches[0].clientX : e.clientX;
        const cy = isTouch ? e.touches[0].clientY : e.clientY;

        const g = dragState.ghost;

        g.style.left = (cx - dragState.offsetX) + "px";
        g.style.top = (cy - dragState.offsetY) + "px";

        document.querySelectorAll(".timeline-row").forEach(r => r.classList.remove("row-hover"));
        dragState.lastHoverRow = null;

        document.querySelectorAll(".timeline-row").forEach(r => {
            const rect = r.getBoundingClientRect();
            if (cy >= rect.top && cy <= rect.bottom) {
                r.classList.add("row-hover");
                dragState.lastHoverRow = r;
            }
        });

        if (dragState.lastHoverRow) {
            const track = dragState.lastHoverRow.querySelector(".timeline-track");
            const newStart = computeStartFromCursor(track, cx, dragState.offsetX, dragState.widthPx);
            const lbl = dragState.ghost.querySelector(".show-time");
            if (lbl) lbl.textContent = `${formatTimelineMins(newStart)} - ${formatTimelineMins(newStart + dragState.duration)}`;
        }
    }

    function onGlobalUp(e) {
        if (!dragState) return;

        const isTouch = !!e.changedTouches;
        const cx = isTouch ? e.changedTouches[0].clientX : e.clientX;
        const cy = isTouch ? e.changedTouches[0].clientY : e.clientY;

        const b = dragState.block;
        const g = dragState.ghost;
        const lastRow = dragState.lastHoverRow;

        document.querySelectorAll(".timeline-row").forEach(r => r.classList.remove("row-hover"));

        const tRect = document.querySelector(".timeline-container").getBoundingClientRect();

        if (cx < tRect.left || cx > tRect.right || cy < tRect.top || cy > tRect.bottom) {
            g.remove();
            b.remove();

            pendingChanges.push({
                id: b.dataset.id,
                old: { hall: dragState.origHall, start: dragState.startOriginal },
                new: null
            });

            refreshNotifSummary();
            dragState = null;
            return;
        }

        const track = lastRow.querySelector(".timeline-track");
        const newStart = computeStartFromCursor(track, cx, dragState.offsetX, dragState.widthPx);

        b.dataset.start = newStart;

        if (isOverlapping(b, track)) {
            const safe = findNearestSafeSlot(track, newStart, dragState.duration, b);
            if (safe !== null) {
                placeBlock(b, track, safe, dragState.duration);
                recordPendingChange(b, dragState.origHall, b.dataset.hallId, dragState.startOriginal, safe);
            } else {
                g.remove();
                b.style.visibility = "";
                b.classList.remove("dragging");
                restoreOriginal(b);
                dragState = null;
                return;
            }
        } else {
            placeBlock(b, track, newStart, dragState.duration);
            recordPendingChange(b, dragState.origHall, b.dataset.hallId, dragState.startOriginal, newStart);
        }

        g.remove();
        dragState = null;
    }

    function computeStartFromCursor(track, cx, ox, w) {
        const r = track.getBoundingClientRect();
        let x = cx - r.left - ox;
        x = Math.max(0, Math.min(x, r.width - w));
        let start = snapMinutes(pxToMinutes(x));
        if (start + dragState.duration > OP_END)
            start = snapMinutes(OP_END - dragState.duration);
        return start;
    }

    function placeBlock(b, track, start, d) {
        b.style.position = "absolute";
        b.style.top = "7px";
        b.style.left = minutesToPx(start) + "px";
        b.dataset.start = start;
        b.dataset.hallId = track.dataset.hallId;
        b.style.visibility = "";
        b.classList.remove("dragging");
        updateLabel(b, start, d);
        track.appendChild(b);
    }

    function updateLabel(b, s, d) {
        const lbl = b.querySelector(".show-time");
        if (lbl) lbl.textContent = `${formatTimelineMins(s)} - ${formatTimelineMins(s + d)}`;
    }

    function isOverlapping(b, track) {
        const s = parseInt(b.dataset.start);
        const e = s + parseInt(b.dataset.duration);
        return [...track.querySelectorAll(".show-block")].filter(x => x !== b).some(x => {
            const as = parseInt(x.dataset.start);
            const ae = as + parseInt(x.dataset.duration);
            return !(e <= as || s >= ae);
        });
    }

    function findNearestSafeSlot(track, start, d, exclude) {
        const blocks = [...track.querySelectorAll(".show-block")]
            .filter(x => x !== exclude)
            .sort((a, b) => parseInt(a.dataset.start) - parseInt(b.dataset.start));

        const range = 60;
        for (let off = 0; off <= range; off += SNAP_MINUTES) {
            const c = [start + off, start - off];
            for (let s of c) {
                if (s < OP_START || s + d > OP_END) continue;
                let overlap = blocks.some(b => {
                    const bs = parseInt(b.dataset.start);
                    const be = bs + parseInt(b.dataset.duration);
                    return !(s + d <= bs || s >= be);
                });
                if (!overlap) return s;
            }
        }
        return null;
    }

    function restoreOriginal(b) {
        const h = dragState && dragState.origHall ? dragState.origHall : b.dataset.hallId;
        const row = dragState?.origRowEl || document.querySelector(`.timeline-row[data-hall-id="${h}"]`);
        if (!row) return;
        const track = row.querySelector(".timeline-track");
        const s = dragState ? dragState.startOriginal : parseInt(b.dataset.start);
        placeBlock(b, track, s, dragState ? dragState.duration : parseInt(b.dataset.duration));
    }

    function recordPendingChange(b, oldHall, newHall, oldStart, newStart) {
        pendingChanges.push({
            id: b.dataset.id || `tmp-${Date.now()}`,
            old: { hall: oldHall, start: oldStart },
            new: { hall: newHall, start: newStart }
        });
        refreshNotifSummary();
    }

    document.getElementById("addBlockBtn").addEventListener("click", () => {
        if (!selectedMovieData) {
            alert("Select a movie first.");
            return;
        }

        const d = parseInt(selectedMovieData.duration) || 60;
        const title = selectedMovieData.title || "Untitled";

        const b = document.createElement("div");
        b.className = "show-block new-block";
        b.dataset.duration = d;
        b.dataset.title = title;
        b.dataset.start = "-1";
        b.innerHTML = `<div class="show-title">${title}</div><div class="show-time">Not placed</div>`;

        b.style.position = "absolute";
        b.style.left = "30px";
        b.style.top = "20px";
        b.style.width = Math.round(d * pxPerMin) + "px";
        b.style.zIndex = 99999;

        rightColumn.appendChild(b);

        pushUndo();
        bindBlock(b);
    });

    document.getElementById("clear").addEventListener("click", () => {
        timeScale.innerHTML = "";
        timelineArea.innerHTML = "";
        pendingChanges = [];
        refreshNotifSummary();
        clearMessages();
        showInfo("Timeline cleared.");
        document.getElementById("scheduleCard").classList.add("schedule-hidden");
    });

    document.getElementById("save").addEventListener("click", () => {
        if (!pendingChanges.length) {
            showInfo("No changes to save.");
            return;
        }
        console.log("Would send to server:", pendingChanges);
        showSuccess("Saved (demo)");
        pendingChanges = [];
        refreshNotifSummary();
    });

    function popularityClick(e) {
        document.querySelectorAll(".popularity-option").forEach(a => a.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
    }

    function rebindPopularityOptions() {
        document.querySelectorAll(".popularity-option").forEach(o => {
            o.removeEventListener("click", popularityClick);
            o.addEventListener("click", popularityClick);
        });
    }

    rebindPopularityOptions();

    window.addEventListener("resize", () => {
        clearTimeout(window._rt);
        window._rt = setTimeout(() => {
            if (timelineArea.querySelector(".timeline-track"))
                generateSchedulePreview();
        }, 200);
    });

    function initScale() {
        const rect = timelineArea.getBoundingClientRect();
        let width = rect.width - 120 - 8;
        width = Math.max(600, width);
        document.documentElement.style.setProperty("--timeline-width", width + "px");
    }

    initScale();
    initHalls();
    addDefaultWindow();
    updatePreview();
    movieSelect.addEventListener("change", updatePreview);
    document.getElementById("scheduleCard").classList.add("schedule-hidden");

    function initMovieDropdown() {
        const dropdown = document.getElementById("movieSelectDropdown");
        if (!dropdown) return;

        const header = dropdown.querySelector(".dropdown-header");
        const list = dropdown.querySelector(".dropdown-list");
        const selectedValue = dropdown.querySelector(".selected-value");
        const items = dropdown.querySelectorAll(".dropdown-item");
        const hiddenInput = document.getElementById("movieSelect");

        header.addEventListener("click", (e) => {
            e.stopPropagation();
            list.classList.toggle("active");
            header.classList.toggle("active");
        });

        items.forEach(item => {
            item.addEventListener("click", () => {

                selectedValue.textContent = item.dataset.title;
                hiddenInput.value = item.dataset.value;

                selectedMovieData = {
                    id: item.dataset.value,
                    title: item.dataset.title,
                    genre: item.dataset.genre,
                    language: item.dataset.language,
                    status: item.dataset.status,
                    poster: item.dataset.poster,
                    date: item.dataset.date,
                    duration: item.dataset.duration
                };

                updatePreview();

                list.classList.remove("active");
                header.classList.remove("active");

                items.forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
            });
        });

        document.addEventListener("click", () => {
            list.classList.remove("active");
            header.classList.remove("active");
        });
    }
});