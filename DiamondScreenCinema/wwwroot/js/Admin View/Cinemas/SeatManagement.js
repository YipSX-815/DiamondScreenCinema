document.addEventListener('DOMContentLoaded', function () {
    const seatGrid = document.getElementById('seat-grid');
    const editPanel = document.getElementById('edit-panel');
    const viewModeBtn = document.getElementById('view-mode');
    const editModeBtn = document.getElementById('edit-mode');
    const resetBtn = document.getElementById('reset-layout');
    let saveBtn = document.getElementById('save-layout');
    const seatTypeBtns = document.querySelectorAll('.seat-type-btn');

    let isEditMode = false;
    let currentSeatType = 'available';
    let currentHall = 'hall1';

    const hallConfigs = {
        hall1: { name: 'Hall 1 - Main Theater', type: 'standard', rows: 12, cols: 20 },
        hall2: { name: 'Hall 2 - Premium Lounge', type: 'premium', rows: 8, cols: 16 },
        hall3: { name: 'Hall 3 - Standard', type: 'half', rows: 10, cols: 15 },
        hall4: { name: 'Hall 4 - IMAX', type: 'imax', rows: 15, cols: 25 }
    };

    const seatLayouts = {
        hall1: createEmptyGrid(hallConfigs.hall1.rows, hallConfigs.hall1.cols),
        hall2: createEmptyGrid(hallConfigs.hall2.rows, hallConfigs.hall2.cols),
        hall3: createEmptyGrid(hallConfigs.hall3.rows, hallConfigs.hall3.cols),
        hall4: createEmptyGrid(hallConfigs.hall4.rows, hallConfigs.hall4.cols)
    };

    initDropdowns();
    bindUi();
    loadHallLayout(currentHall);

    function bindUi() {
        const oldSaveBtn = saveBtn;
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        saveBtn = newSaveBtn;

        viewModeBtn.addEventListener('click', () => setEditMode(false));
        editModeBtn.addEventListener('click', () => setEditMode(true));

        resetBtn.addEventListener('click', function () {
            if (!confirm('Are you sure you want to reset this hall layout?')) return;
            const cfg = hallConfigs[currentHall];
            seatLayouts[currentHall] = createEmptyGrid(cfg.rows, cfg.cols);
            renderSeatLayout(seatLayouts[currentHall]);
            setEditMode(false);
        });

        let isSaving = false;
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (isSaving) {
                return;
            }

            isSaving = true;
            await saveLayoutToServer();
            isSaving = false;
        });

        seatTypeBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                seatTypeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentSeatType = this.dataset.type;
            });
        });
    }

    function createEmptyGrid(rows, cols) {
        const layout = { rows: [] };
        for (let r = 0; r < rows; r++) {
            const row = { seats: [] };
            for (let c = 0; c < cols; c++) {
                row.seats.push({ type: 'empty' });
            }
            layout.rows.push(row);
        }
        return layout;
    }

    function rebuildGridFromDB(HallId, seatsFromDb) {
        const cfg = hallConfigs[HallId];
        if (!cfg) return;
        const grid = createEmptyGrid(cfg.rows, cfg.cols);

        seatsFromDb.forEach(s => {
            if (!s.row || !s.number) return;
            const rowIdx = s.row.charCodeAt(0) - 65;
            const colIdx = s.number - 1;
            if (rowIdx >= 0 && rowIdx < cfg.rows && colIdx >= 0 && colIdx < cfg.cols) {
                grid.rows[rowIdx].seats[colIdx].type = (s.type || 'available').toLowerCase();
            }
        });

        seatLayouts[HallId] = grid;
    }

    async function loadHallLayout(HallId) {
        renderSeatLayout(seatLayouts[HallId]);
        updateGridVisibility();

        try {
            const res = await fetch(`/Admin/GetSeatLayout?HallId=${encodeURIComponent(HallId)}`);
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                rebuildGridFromDB(HallId, data);
                renderSeatLayout(seatLayouts[HallId]);
                updateGridVisibility();
            }
        } catch (err) {
            console.error('Error loading hall layout:', err);
        }
    }

    async function saveLayoutToServer() {
        try {
            let payload = {
                HallId: currentHall,
                rows: seatLayouts[currentHall].rows.map((r, i) => ({
                    rowLabel: String.fromCharCode(65 + i),
                    seats: r.seats.map((s, idx) => ({
                        number: idx + 1,
                        type: s.type
                    }))
                }))
            };

            const response = await fetch('/Admin/SaveSeatLayout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${text}`);
            }

            const data = await response.json();
            if (data.success) alert("Seat layout saved successfully!");
            else alert("Error saving layout: " + (data.error || "Unknown error"));

        } catch (err) {
            console.error("Error saving layout:", err);
            alert("Error saving layout: " + err.message);
        }
    }

    function renderSeatLayout(layout) {
        seatGrid.innerHTML = '';

        layout.rows.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'seat-row';

            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            rowLabel.textContent = String.fromCharCode(65 + rowIndex);
            rowElement.appendChild(rowLabel);

            const seatsGroup = document.createElement('div');
            seatsGroup.className = 'seats-group';

            for (let seatIndex = 0; seatIndex < row.seats.length; seatIndex++) {
                const seat = row.seats[seatIndex];

                const seatElement = document.createElement('div');
                seatElement.className = 'seat';
                seatElement.dataset.row = rowIndex;
                seatElement.dataset.seat = seatIndex;
                seatElement.dataset.type = seat.type;

                if (seat.type === 'empty') {
                    seatElement.classList.add('empty-cell');
                } else if (seat.type === 'couple') {
                    seatElement.classList.add('couple');
                    seatElement.textContent = 'C';
                    seatElement.style.width = '76px';
                    seatsGroup.appendChild(seatElement);

                    (function (rIdx, sIdx) {
                        seatElement.addEventListener('click', () => handleSeatClick(seatElement, rIdx, sIdx));
                    })(rowIndex, seatIndex);

                    seatIndex++;
                    continue;
                } else {
                    seatElement.classList.add(seat.type);
                    if (seat.type === 'vip') seatElement.textContent = 'V';
                }

                (function (el, rIdx, sIdx) {
                    el.addEventListener('click', () => handleSeatClick(el, rIdx, sIdx));
                })(seatElement, rowIndex, seatIndex);

                seatsGroup.appendChild(seatElement);
            }

            rowElement.appendChild(seatsGroup);
            seatGrid.appendChild(rowElement);
        });
    }

    function handleSeatClick(seatElement, rowIndex, seatIndex) {
        const modelType = seatLayouts[currentHall].rows[rowIndex].seats[seatIndex].type;

        if (!isEditMode) {
            if (modelType !== 'empty') {
                seatElement.classList.toggle('selected');
            }
            return;
        }

        if (currentSeatType === 'couple') {
            if (modelType === 'empty') {
                if (canCreateCoupleSeat(rowIndex, seatIndex)) {
                    createCoupleSeat(rowIndex, seatIndex);
                } else {
                    alert('Need two consecutive empty cells for couple seat.');
                }
            } else if (modelType === 'couple') {
                convertCoupleToIndividual(rowIndex, seatIndex);
            }
        } else if (currentSeatType === 'aisle') {
            if (modelType === 'empty') {
                updateSeatType(rowIndex, seatIndex, 'available');
            } else {
                updateSeatType(rowIndex, seatIndex, 'empty');
            }
        } else {
            if (modelType === 'empty') {
                updateSeatType(rowIndex, seatIndex, currentSeatType);
            } else if (modelType === currentSeatType) {
                updateSeatType(rowIndex, seatIndex, 'empty');
            } else {
                updateSeatType(rowIndex, seatIndex, currentSeatType);
            }
        }
    }

    function canCreateCoupleSeat(rowIndex, seatIndex) {
        const row = seatLayouts[currentHall].rows[rowIndex];
        return seatIndex < row.seats.length - 1 &&
            row.seats[seatIndex].type === 'empty' &&
            row.seats[seatIndex + 1].type === 'empty';
    }

    function createCoupleSeat(rowIndex, seatIndex) {
        const row = seatLayouts[currentHall].rows[rowIndex];
        row.seats[seatIndex].type = 'couple';
        row.seats[seatIndex + 1].type = 'couple';
        renderSeatLayout(seatLayouts[currentHall]);
        updateGridVisibility();
    }

    function convertCoupleToIndividual(rowIndex, seatIndex) {
        const row = seatLayouts[currentHall].rows[rowIndex];
        row.seats[seatIndex].type = 'empty';
        row.seats[seatIndex + 1].type = 'empty';
        renderSeatLayout(seatLayouts[currentHall]);
        updateGridVisibility();
    }

    function updateSeatType(rowIndex, seatIndex, newType) {
        const row = seatLayouts[currentHall].rows[rowIndex];
        row.seats[seatIndex].type = newType;
        renderSeatLayout(seatLayouts[currentHall]);
        updateGridVisibility();
    }

    function setEditMode(edit) {
        isEditMode = edit;
        editPanel.classList.toggle('active', edit);

        if (edit) {
            viewModeBtn.classList.add('btn-secondary');
            viewModeBtn.classList.remove('btn-primary');
            editModeBtn.classList.add('btn-primary');
            editModeBtn.classList.remove('btn-secondary');
        } else {
            viewModeBtn.classList.add('btn-primary');
            viewModeBtn.classList.remove('btn-secondary');
            editModeBtn.classList.add('btn-secondary');
            editModeBtn.classList.remove('btn-primary');
        }

        updateGridVisibility();
    }

    function updateGridVisibility() {
        const emptyCells = seatGrid.querySelectorAll('.empty-cell');
        emptyCells.forEach(cell => {
            if (isEditMode) {
                cell.style.background = '#f8fafc';
                cell.style.border = '1px dashed #cbd5e1';
            } else {
                cell.style.background = 'transparent';
                cell.style.border = 'none';
            }
        });

        if (isEditMode) seatGrid.classList.add('edit-mode');
        else seatGrid.classList.remove('edit-mode');
    }

    function initDropdowns() {
        const dropdowns = document.querySelectorAll('.custom-dropdown');

        dropdowns.forEach(dropdown => {
            const header = dropdown.querySelector('.dropdown-header');
            const list = dropdown.querySelector('.dropdown-list');
            const items = dropdown.querySelectorAll('.dropdown-item');
            const selectedValue = dropdown.querySelector('.selected-value');

            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = list.classList.contains('active');

                document.querySelectorAll('.dropdown-list.active').forEach(activeList => {
                    if (activeList !== list) {
                        activeList.classList.remove('active');
                        activeList.previousElementSibling.classList.remove('active');
                    }
                });

                list.classList.toggle('active', !isActive);
                header.classList.toggle('active', !isActive);
            });

            items.forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.getAttribute('data-value');
                    const text = item.querySelector('.item-text').textContent;
                    selectedValue.textContent = text;

                    const hallNumber = value.match(/\d+/)[0];
                    currentHall = `hall${hallNumber}`;

                    items.forEach(i => i.classList.remove("selected"));
                    item.classList.add("selected");
                    list.classList.remove("active");

                    loadHallLayout(currentHall);
                });
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.dropdown-list.active').forEach(list => {
                    list.classList.remove('active');
                    list.previousElementSibling.classList.remove('active');
                });
            }
        });
    }

    function $(id) { return document.getElementById(id); }
});