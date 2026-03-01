"use strict";

const STORAGE_KEY = "bus237_inventory";
let inventory = [];
let chart = null;

// DOM
const form = document.getElementById("inventoryForm");
const nameInput = document.getElementById("itemName");
const qtyInput = document.getElementById("itemQty");
const messageEl = document.getElementById("message");
const tbody = document.getElementById("inventoryBody");
const clearBtn = document.getElementById("clearBtn");
const chartCanvas = document.getElementById("inventoryChart");

// ---------- Utilities ----------
function normalizeName(name) {
  return name.trim().toLowerCase();
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("ok", "err");
  if (type === "ok") messageEl.classList.add("ok");
  if (type === "err") messageEl.classList.add("err");
}

function loadInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(x =>
      x && typeof x.name === "string" && typeof x.qty === "number"
    );
  } catch {
    return [];
  }
}

function saveInventory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderTable(items) {
  tbody.innerHTML = "";
  for (const item of items) {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = item.name;

    const tdQty = document.createElement("td");
    tdQty.textContent = String(item.qty);

    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tbody.appendChild(tr);
  }
}

// ---------- Chart (Option B: Low stock < 10 red) ----------
function renderChart(items) {
  const labels = items.map(i => i.name);
  const data = items.map(i => i.qty);

  const colors = items.map(i =>
    i.qty < 10 ? "rgba(220, 38, 38, 0.8)" : "rgba(37, 99, 235, 0.8)"
  );

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantity",
        data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// ---------- Validation ----------
function validateInputs(name, qtyStr) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, msg: "Item name cannot be empty." };

  const qtyNum = Number(qtyStr);
  if (!Number.isFinite(qtyNum)) return { ok: false, msg: "Quantity must be a number." };
  if (!Number.isInteger(qtyNum)) return { ok: false, msg: "Quantity must be a whole number." };
  if (qtyNum < 0) return { ok: false, msg: "Quantity cannot be negative." };

  return { ok: true, name: trimmed, qty: qtyNum };
}

// ---------- Core actions ----------
function addItem(name, qty) {
  const key = normalizeName(name);
  const exists = inventory.some(i => normalizeName(i.name) === key);

  if (exists) {
    showMessage("Duplicate item: that name already exists.", "err");
    return;
  }

  inventory.push({ name, qty });
  saveInventory(inventory);
  renderTable(inventory);
  renderChart(inventory);

  showMessage("Item added.", "ok");
}

function clearAll() {
  inventory = [];
  localStorage.removeItem(STORAGE_KEY);
  renderTable(inventory);
  renderChart(inventory);
  showMessage("Inventory cleared.", "ok");
}

// ---------- Events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const validation = validateInputs(nameInput.value, qtyInput.value);
  if (!validation.ok) {
    showMessage(validation.msg, "err");
    return;
  }

  addItem(validation.name, validation.qty);
  form.reset();
  nameInput.focus();
});

clearBtn.addEventListener("click", () => {
  clearAll();
});

// ---------- Init ----------
inventory = loadInventory();
renderTable(inventory);
renderChart(inventory);
