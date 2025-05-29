const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
let data = [];
let assets = [];
let selectedYear = null;
let localYears = [];

const tooltip = document.getElementById('tooltip');
const inputContainer = document.getElementById('inputContainer');
const yearSelect = document.getElementById('yearSelect');
const addYearBtn = document.getElementById('addYearBtn');
const addAssetBtn = document.getElementById('addAssetBtn');
const saveBtn = document.getElementById('saveBtn');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

async function loadYears() {
  const res = await fetch('/api/years');
  const years = await res.json();
  localYears = years.sort((a,b)=>b-a);
  renderYearDropdown();
  if (localYears.length > 0) {
    selectedYear = localYears[0];
    yearSelect.value = selectedYear;
    await loadYearData();
  }
}

function renderYearDropdown() {
  yearSelect.innerHTML = '';
  localYears.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });
}

function addNextYearToDropdown() {
  if (localYears.length === 0) {
    // First year case: initialize with current year - next year format
    const currentYear = new Date().getFullYear();
    const newFY = `${currentYear}-${currentYear + 1}`;
    localYears.unshift(newFY);
    selectedYear = newFY;
    assets = [];
    data = [];
    renderYearDropdown();
    yearSelect.value = newFY;
    renderInputTable();
    drawChart();
    return;
  }

  // Extract the latest fiscal year string like "2022-2023"
  const lastFY = localYears[0];
  const years = lastFY.split('-').map(y => parseInt(y, 10));
  if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
    alert('Invalid fiscal year format in existing data');
    return;
  }

  // Compute next fiscal year string
  const nextFY = `${years[0] + 1}-${years[1] + 1}`;

  if (!localYears.includes(nextFY)) {
    localYears.unshift(nextFY);
    selectedYear = nextFY;

    // Copy assets from previous fiscal year but reset data
    data = [];
    // No balances yet for next fiscal year, so initialize empty for each asset
    assets = [...new Set(data.map(d => d.asset))];
    // If no data in new FY, copy asset names from previous FY (local copy)
    if (assets.length === 0 && previousAssets.length > 0) {
      assets = [...previousAssets];
    }

    renderYearDropdown();
    yearSelect.value = nextFY;
    loadYearData();
    renderInputTable();
    drawChart();
  }
}

let previousAssets = [];

async function loadYearData() {
  const res = await fetch(`/api/data?year=${selectedYear}`);
  data = await res.json();
  assets = [...new Set(data.map(d => d.asset))];
  if (assets.length === 0) {
    assets = ['Asset1', 'Asset2'];
  }
  renderInputTable();
  drawChart();
}

function getDataValue(asset, month) {
  const rec = data.find(d => d.asset === asset && d.month === month);
  return rec ? rec.balance : '';
}

function renderInputTable() {
  inputContainer.innerHTML = '';
  const table = document.createElement('table');
  if (body.classList.contains('dark')) table.classList.add('dark');

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Asset</th>';
  months.forEach(m => {
    const th = document.createElement('th');
    th.textContent = m;
    th.className = 'month';
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  assets.forEach(asset => {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = asset;

    const btn = document.createElement('button');
    btn.className = 'removeAsset';
    btn.textContent = '−';
    btn.onclick = () => removeAsset(asset);
    td.appendChild(btn);

    row.appendChild(td);
    months.forEach(m => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.value = getDataValue(asset, m) ?? '';
      td.appendChild(input);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  inputContainer.appendChild(table);
}

async function saveData() {
  const rows = inputContainer.querySelectorAll('tbody tr');
  let payload = [];

  rows.forEach(row => {
    const asset = row.cells[0].childNodes[0].nodeValue.trim();
    months.forEach((month, idx) => {
      const val = row.cells[idx+1].querySelector('input').value.trim();
      if (val !== '') {
        payload.push({ asset, month, balance: +val });
      }
    });
  });

  const res = await fetch(`/api/save?year=${selectedYear}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('Saved!');
    await loadYearData(); // reload data and graph
  } else {
    alert('Save failed!');
  }
}

async function removeAsset(asset) {
  const confirmDelete = confirm(`Delete asset "${asset}" for fiscal year ${selectedYear}?`);
  if (!confirmDelete) return;

  const res = await fetch(`/api/asset?year=${selectedYear}&asset=${asset}`, { method: 'DELETE' });
  if (res.ok) {
    alert('Asset deleted');
    await loadYearData();
  } else {
    alert('Delete failed');
  }
}

addAssetBtn.onclick = () => {
  const name = prompt("Enter asset name:");
  if (!name || assets.includes(name)) return;
  assets.push(name);
  renderInputTable();
};

saveBtn.onclick = () => saveData();
yearSelect.onchange = async () => {
  selectedYear = yearSelect.value;
  await loadYearData();
};
addYearBtn.onclick = () => addNextYearToDropdown();

themeToggle.onclick = () => {
  if (body.classList.contains('light')) {
    body.classList.replace('light', 'dark');
    themeToggle.textContent = 'Light Mode';
  } else {
    body.classList.replace('dark', 'light');
    themeToggle.textContent = 'Dark Mode';
  }
  renderInputTable();
  drawChart();
};

// D3 Chart
const svg = d3.select("#chart").append("svg")
  .attr("width", 900)
  .attr("height", 400)
  .append("g")
  .attr("transform", "translate(60,30)");

const x = d3.scalePoint().domain(months).range([0, 780]).padding(0.5);
const y = d3.scaleLinear().range([300, 0]);
const color = d3.scaleOrdinal(d3.schemeCategory10);

function drawChart() {
  svg.selectAll("*").remove();
  if (!data || data.length === 0) return;

  const assetMap = {};
  assets.forEach(a => {
    const arr = months.map(m => {
      const rec = data.find(d => d.asset === a && d.month === m);
      return rec ? rec.balance : null;
    });
    // forward fill
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === null && arr[i - 1] != null) {
        arr[i] = arr[i - 1];
      }
    }
    assetMap[a] = months.map((m, i) => ({ month: m, balance: arr[i] || 0 }));
  });

  y.domain([0, d3.max(Object.values(assetMap).flat(), d => d.balance) * 1.1]);

  svg.append("g").attr("transform", "translate(0,300)").call(d3.axisBottom(x));
  svg.append("g").call(d3.axisLeft(y));

  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.balance))
    .curve(d3.curveMonotoneX);

  Object.entries(assetMap).forEach(([asset, points]) => {
    svg.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", color(asset))
      .attr("stroke-width", 2)
      .attr("d", line);

    svg.selectAll(`circle-${asset}`)
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.balance))
      .attr("r", 4)
      .attr("fill", color(asset))
      .on("mousemove", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY - 25 + "px";
        tooltip.innerHTML = `<b>${asset}</b><br>${d.month} ${selectedYear}<br>Balance: ${d.balance}`;
        tooltip.className = body.classList.contains("dark") ? "tooltip dark" : "tooltip light";
      })
      .on("mouseout", () => tooltip.style.opacity = 0);
  });
}

(async () => await loadYears())();
