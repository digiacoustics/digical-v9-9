// Tabs logic
document.getElementById('tabCalc').onclick = function () {
  document.getElementById('calcSection').style.display = '';
  document.getElementById('projectsSection').style.display = 'none';
  this.classList.add('active');
  document.getElementById('tabProjects').classList.remove('active');
};
document.getElementById('tabProjects').onclick = function () {
  document.getElementById('projectsSection').style.display = '';
  document.getElementById('calcSection').style.display = 'none';
  this.classList.add('active');
  document.getElementById('tabCalc').classList.remove('active');
  loadSavedProjects();
  updateProjectInfo();
};

// Timestamp
function updateTimestamp() {
  const now = new Date();
  const opts = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  document.getElementById('timestamp').textContent = 'Date & Time: ' + now.toLocaleString('en-IN', opts);
}
updateTimestamp();

// Data Structures
let rooms = [];
let currentRoom = 0;

// Room Object template
function createRoom(name = '', l = '', w = '', h = '', doors = 0) {
  return {
    roomName: name,
    length: l,
    width: w,
    height: h,
    doors: doors,
    deductions: [],
    pricing: { wall: '', ceil: '', floor: '', door: '' },
  };
}

function addRoom() {
  rooms.push(createRoom(''));
  currentRoom = rooms.length - 1;
  renderRoomTabs();
  renderRoomForm();
  renderResults();
}
function switchRoom(idx) {
  currentRoom = idx;
  renderRoomTabs();
  renderRoomForm();
  renderResults();
}
function removeRoom(idx) {
  rooms.splice(idx, 1);
  if (currentRoom >= rooms.length) currentRoom = rooms.length - 1;
  renderRoomTabs();
  renderRoomForm();
  renderResults();
}
function renderRoomTabs() {
  let html = '';
  rooms.forEach((r, i) => {
    html += `<button class="room-tab${i === currentRoom ? ' active' : ''}" onclick="switchRoom(${i})" title="Switch to room">${r.roomName ? r.roomName : `Room ${i + 1}`}</button>`;
    if (rooms.length > 1) {
      html += `<button class="remove-deduction" style="margin-top:-15px" onclick="removeRoom(${i})" title="Remove Room">&times;</button>`;
    }
  });
  document.getElementById('roomTabs').innerHTML = html;
}
function renderRoomForm() {
  if (rooms.length == 0) {
    document.getElementById('roomForm').innerHTML = '';
    return;
  }
  const r = rooms[currentRoom];
  let html = `
    <div class="input-row">
      <label>Room Name</label>
      <input type="text" value="${r.roomName}" onchange="rooms[${currentRoom}].roomName=this.value; renderRoomTabs();">
    </div>
    <div class="input-row">
      <label>Length (ft)</label>
      <input type="number" min="1" value="${r.length}" onchange="rooms[${currentRoom}].length=this.value;">
      <label>Width (ft)</label>
      <input type="number" min="1" value="${r.width}" onchange="rooms[${currentRoom}].width=this.value;">
      <label>Height (ft)</label>
      <input type="number" min="1" value="${r.height}" onchange="rooms[${currentRoom}].height=this.value;">
    </div>
    <div class="input-row">
      <label>Acoustic Doors (Qty)</label>
      <input type="number" min="0" value="${r.doors}" onchange="rooms[${currentRoom}].doors=this.value;">
    </div>
    <div>
      <h3 style="color:var(--accent4)">Deductions <button class="add-room-btn" style="padding:3px 15px;font-size:1em" onclick="addDeduction(event,${currentRoom})">+ Add</button></h3>
      <div class="deductions-list" id="deductions${currentRoom}">
        ${r.deductions
          .map(
            (d, i) => `<div class="deduction-row">
            <input type="text" placeholder="" value="${d.name || ''}" onchange="rooms[${currentRoom}].deductions[${i}].name=this.value">
            <input type="number" min="0" placeholder="" value="${d.len || ''}" onchange="rooms[${currentRoom}].deductions[${i}].len=this.value">
            <input type="number" min="0" placeholder="" value="${d.ht || ''}" onchange="rooms[${currentRoom}].deductions[${i}].ht=this.value">
            <button class="remove-deduction" onclick="removeDeduction(event,${currentRoom},${i})">&times;</button>
          </div>`
          )
          .join('')}
      </div>
    </div>
    <hr style="margin:1.5em 0 0.7em 0; border:1px solid #f6f6f6">
    <div class="input-row" style="gap:0.8em">
      <label for="wallPrice">Wall Area Price (INR/sqft)</label>
      <input id="wallPrice" type="number" min="0" placeholder="" value="${r.pricing.wall || ''}" onchange="rooms[${currentRoom}].pricing.wall=this.value;">
      <label for="ceilPrice">Ceiling Price (INR/sqft)</label>
      <input id="ceilPrice" type="number" min="0" placeholder="" value="${r.pricing.ceil || ''}" onchange="rooms[${currentRoom}].pricing.ceil=this.value;">
      <label for="floorPrice">Floor Price (INR/sqft)</label>
      <input id="floorPrice" type="number" min="0" placeholder="" value="${r.pricing.floor || ''}" onchange="rooms[${currentRoom}].pricing.floor=this.value;">
      <label for="doorPrice">Acoustic Door Price (INR/each)</label>
      <input id="doorPrice" type="number" min="0" placeholder="" value="${r.pricing.door || ''}" onchange="rooms[${currentRoom}].pricing.door=this.value;">
    </div>
  `;
  document.getElementById('roomForm').innerHTML = html;
}
function addDeduction(e, roomIdx) {
  e.preventDefault();
  rooms[roomIdx].deductions.push({ name: '', len: '', ht: '' });
  renderRoomForm();
}
function removeDeduction(e, roomIdx, idx) {
  e.preventDefault();
  rooms[roomIdx].deductions.splice(idx, 1);
  renderRoomForm();
}
function calcRoomAreas(r) {
  const l = parseFloat(r.length) || 0;
  const w = parseFloat(r.width) || 0;
  const h = parseFloat(r.height) || 0;
  const wall1 = l * h, wall2 = w * h, wall3 = l * h, wall4 = w * h;
  const totalWall = wall1 + wall2 + wall3 + wall4;
  const ceilArea = l * w;
  const floorArea = l * w;
  let deductionArea = 0;
  for (const d of r.deductions) {
    let dl = parseFloat(d.len) || 0, dh = parseFloat(d.ht) || 0;
    deductionArea += dl * dh;
  }
  let netWall = totalWall - deductionArea;
  if (netWall < 0) netWall = 0;
  let wallPrice = parseFloat(r.pricing.wall) || 0;
  let ceilPrice = parseFloat(r.pricing.ceil) || 0;
  let floorPrice = parseFloat(r.pricing.floor) || 0;
  let doorPrice = parseFloat(r.pricing.door) || 0;
  let doors = parseInt(r.doors) || 0;
  return {
    wall1, wall2, wall3, wall4,
    ceilArea, floorArea, totalWall, deductionArea, netWall,
    wallCost: wallPrice && netWall > 0 ? netWall * wallPrice : null,
    ceilCost: ceilPrice && ceilArea > 0 ? ceilArea * ceilPrice : null,
    floorCost: floorPrice && floorArea > 0 ? floorArea * floorPrice : null,
    doorCost: doorPrice && doors > 0 ? doorPrice * doors : null,
    fullCost:
      (wallPrice && netWall > 0 ? netWall * wallPrice : 0) +
      (ceilPrice && ceilArea > 0 ? ceilArea * ceilPrice : 0) +
      (floorPrice && floorArea > 0 ? floorArea * floorPrice : 0) +
      (doorPrice && doors > 0 ? doorPrice * doors : 0),
    doors, wallPrice, ceilPrice, floorPrice, doorPrice,
  };
}
function calculateAll() {
  renderResults();
  renderTotalSummary();
  updateTimestamp();
}
function renderResults() {
  let html = '';
  rooms.forEach((r, i) => {
    const calc = calcRoomAreas(r);
    const borderColor =
      i % 4 === 0
        ? 'var(--accent4)'
        : i % 4 === 1
        ? 'var(--accent3)'
        : i % 4 === 2
        ? 'var(--accent2)'
        : 'var(--accent1)';
    html += `<div class="card room-summary" style="border-color:${borderColor}">
      <h3 style="margin-top:0">${r.roomName || `Room ${i + 1}`}</h3>
      <div><b>Wall 1:</b> ${r.length || '0'}ft x ${r.height || '0'}ft = ${calc.wall1.toFixed(2)} sq ft</div>
      <div><b>Wall 2:</b> ${r.width || '0'}ft x ${r.height || '0'}ft = ${calc.wall2.toFixed(2)} sq ft</div>
      <div><b>Wall 3:</b> ${r.length || '0'}ft x ${r.height || '0'}ft = ${calc.wall3.toFixed(2)} sq ft</div>
      <div><b>Wall 4:</b> ${r.width || '0'}ft x ${r.height || '0'}ft = ${calc.wall4.toFixed(2)} sq ft</div>
      <div style="margin:10px 0 3px 0"><b>Ceiling Area:</b> ${r.length || '0'}ft x ${r.width || '0'}ft = ${calc.ceilArea.toFixed(2)} sq ft</div>
      <div><b>Floor Area:</b> ${r.length || '0'}ft x ${r.width || '0'}ft = ${calc.floorArea.toFixed(2)} sq ft</div>
      <div style="margin-top:8px"><b>Total Wall Area (Gross):</b> ${calc.totalWall.toFixed(2)} sq ft</div>
      <div><b>Total Deduction Area:</b> ${calc.deductionArea.toFixed(2)} sq ft</div>
      <div><b>Net Wall Area (After Deductions):</b> ${calc.netWall.toFixed(2)} sq ft</div>
      <hr>
      <div><b>Wall Price:</b> ${
        calc.wallPrice && calc.netWall > 0 ? `₹${(calc.netWall * calc.wallPrice).toLocaleString('en-IN')}` : 'N/A'
      }</div>
      <div><b>Ceiling Price:</b> ${
        calc.ceilPrice && calc.ceilArea > 0 ? `₹${(calc.ceilArea * calc.ceilPrice).toLocaleString('en-IN')}` : 'N/A'
      }</div>
      <div><b>Floor Price:</b> ${
        calc.floorPrice && calc.floorArea > 0 ? `₹${(calc.floorArea * calc.floorPrice).toLocaleString('en-IN')}` : 'N/A'
      }</div>
      <div><b>Acoustic Door Price (${calc.doors}):</b> ${
        calc.doorPrice && calc.doors > 0 ? `₹${(calc.doorPrice * calc.doors).toLocaleString('en-IN')}` : 'N/A'
      }</div>
      <div style="font-weight:bold;font-size:1.1em;color:var(--main);margin-top:10px;">Room Total Cost: ₹${
        calc.fullCost ? calc.fullCost.toLocaleString('en-IN') : 'N/A'
      }</div>
    </div>`;
  });
  document.getElementById('results').innerHTML = html;
}
function renderTotalSummary() {
  if (rooms.length == 0) {
    document.getElementById('total-summary').innerHTML = '';
    return;
  }
  let totalWall = 0,
    totalDed = 0,
    netWall = 0,
    totalCeil = 0,
    totalFloor = 0,
    totalDoors = 0;
  let wallCost = 0,
    ceilCost = 0,
    floorCost = 0,
    doorCost = 0,
    projectCost = 0;
  rooms.forEach(r => {
    const c = calcRoomAreas(r);
    totalWall += c.totalWall;
    totalDed += c.deductionArea;
    netWall += c.netWall;
    totalCeil += c.ceilArea;
    totalFloor += c.floorArea;
    totalDoors += c.doors || 0;
    wallCost += c.wallCost || 0;
    ceilCost += c.ceilCost || 0;
    floorCost += c.floorCost || 0;
    doorCost += c.doorCost || 0;
    projectCost += c.fullCost || 0;
  });
  const pname = document.getElementById('projectName').value || '(No Project)';
  let html = `<div class="card total-summary">
    <h2 style="color:var(--accent1);margin-top:0">${pname} – Project Summary</h2>
    <div><b>All Rooms Total Net Wall Areas:</b> ${netWall.toFixed(2)} sq ft</div>
    <div><b>All Rooms Total Ceiling Areas:</b> ${totalCeil.toFixed(2)} sq ft</div>
    <div><b>All Rooms Total Floor Areas:</b> ${totalFloor.toFixed(2)} sq ft</div>
    <div><b>All Rooms Total Acoustic Doors:</b> ${totalDoors}</div>
    <hr>
    <div><b>Wall Area Price:</b> ${wallCost > 0 ? `₹${wallCost.toLocaleString('en-IN')}` : 'N/A'}</div>
    <div><b>Ceiling Area Price:</b> ${ceilCost > 0 ? `₹${ceilCost.toLocaleString('en-IN')}` : 'N/A'}</div>
    <div><b>Floor Area Price:</b> ${floorCost > 0 ? `₹${floorCost.toLocaleString('en-IN')}` : 'N/A'}</div>
    <div><b>Acoustic Door Price:</b> ${doorCost > 0 ? `₹${doorCost.toLocaleString('en-IN')}` : 'N/A'}</div>
    <div style="font-weight:bold;font-size:1.2em;color:var(--main);margin-top:10px;">Total Project Cost: ₹${
      projectCost > 0 ? projectCost.toLocaleString('en-IN') : 'N/A'
    }</div>
  </div>`;
  document.getElementById('total-summary').innerHTML = html;
}

function saveProject() {
  const projectName = document.getElementById('projectName').value.trim();
  if (!projectName) {
    alert('Please enter a Project Name before saving.');
    return;
  }
  const data = {
    projectName,
    clientName: document.getElementById('clientName').value,
    projectLocation: document.getElementById('projectLocation').value,
    rooms,
  };
  localStorage.setItem('DIGICAL_PROJECT_' + projectName, JSON.stringify(data));
  alert(`Project '${projectName}' saved!`);
  loadSavedProjects();
}
function loadSavedProjects() {
  const select = document.getElementById('savedProjects');
  select.innerHTML = `<option value="">-- Select project --</option>`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('DIGICAL_PROJECT_')) {
      const projectName = key.replace('DIGICAL_PROJECT_', '');
      const option = document.createElement('option');
      option.value = projectName;
      option.textContent = projectName;
      select.appendChild(option);
    }
  }
  updateProjectInfo();
}
function loadProject(name) {
  if (!name) {
    alert('Please select a project.');
    return;
  }
  const json = localStorage.getItem('DIGICAL_PROJECT_' + name);
  if (!json) {
    alert('Selected project data not found!');
    return;
  }
  try {
    const data = JSON.parse(json);
    document.getElementById('projectName').value = data.projectName || '';
    document.getElementById('clientName').value = data.clientName || '';
    document.getElementById('projectLocation').value = data.projectLocation || '';
    rooms = data.rooms || [];
    currentRoom = 0;
    renderRoomTabs();
    renderRoomForm();
    renderResults();
    renderTotalSummary();
    updateTimestamp();
    // Bounce to calculator tab
    document.getElementById('tabCalc').click();
    alert("Project loaded!");
  } catch (e) {
    alert('Failed to load project data: ' + e.message);
  }
}

function deleteProject() {
  const select = document.getElementById('savedProjects');
  const name = select.value;
  if (!name) {
    alert('Select a project to delete.');
    return;
  }
  if (confirm(`Are you sure you want to delete project '${name}'? This cannot be undone.`)) {
    localStorage.removeItem('DIGICAL_PROJECT_' + name);
    alert(`Project '${name}' deleted.`);
    loadSavedProjects();
    updateProjectInfo();
  }
}

function updateProjectInfo() {
  const sel = document.getElementById('savedProjects');
  const name = sel.value;
  const infoDiv = document.getElementById('projectMeta');
  if (!name) {
    infoDiv.textContent = "";
    return;
  }
  // Show project meta-preview
  const json = localStorage.getItem('DIGICAL_PROJECT_' + name);
  if (!json) {
    infoDiv.textContent = "(Not found)";
    return;
  }
  try {
    const data = JSON.parse(json);
    const roomsN = data.rooms ? data.rooms.length : 0;
    infoDiv.textContent = `Saved: ${data.projectName || name}; Client: ${data.clientName || '-'}; Location: ${data.projectLocation || '-'}; Rooms: ${roomsN}`;
  } catch (e) {
    infoDiv.textContent = "(Failed to preview project details)";
  }
}

function shareResults() {
  if (rooms.length === 0) {
    alert('No results to share!');
    return;
  }
  let txt = '';
  const pname = document.getElementById('projectName').value || '(No Project)';
  const client = document.getElementById('clientName').value || '';
  const loc = document.getElementById('projectLocation').value || '';

  txt += `DIGICAL Project Report\n`;
  txt += `Project Name: ${pname}\nClient Name: ${client}\nLocation: ${loc}\n\n`;

  rooms.forEach((r, i) => {
    const c = calcRoomAreas(r);
    txt += `Room ${i+1}: ${r.roomName || `Room ${i+1}`}\n`;
    txt += `  Wall 1: ${r.length||'0'}ft x ${r.height||'0'}ft = ${c.wall1.toFixed(2)} sq ft\n`;
    txt += `  Wall 2: ${r.width||'0'}ft x ${r.height||'0'}ft = ${c.wall2.toFixed(2)} sq ft\n`;
    txt += `  Wall 3: ${r.length||'0'}ft x ${r.height||'0'}ft = ${c.wall3.toFixed(2)} sq ft\n`;
    txt += `  Wall 4: ${r.width||'0'}ft x ${r.height||'0'}ft = ${c.wall4.toFixed(2)} sq ft\n`;
    txt += `  Ceiling Area: ${r.length||'0'}ft x ${r.width||'0'}ft = ${c.ceilArea.toFixed(2)} sq ft\n`;
    txt += `  Floor Area: ${r.length||'0'}ft x ${r.width||'0'}ft = ${c.floorArea.toFixed(2)} sq ft\n`;
    txt += `  Total Wall Area (Gross): ${c.totalWall.toFixed(2)} sq ft\n`;
    txt += `  Total Deduction Area: ${c.deductionArea.toFixed(2)} sq ft\n`;
    txt += `  Net Wall Area: ${c.netWall.toFixed(2)} sq ft\n`;
    txt += `  Acoustic Doors: ${c.doors}\n`;
    txt += `  Wall Price: ${c.wallPrice && c.netWall>0 ? `₹${(c.netWall*c.wallPrice).toLocaleString('en-IN')}` : 'N/A'}\n`;
    txt += `  Ceiling Price: ${c.ceilPrice && c.ceilArea>0 ? `₹${(c.ceilArea*c.ceilPrice).toLocaleString('en-IN')}` : 'N/A'}\n`;
    txt += `  Floor Price: ${c.floorPrice && c.floorArea>0 ? `₹${(c.floorArea*c.floorPrice).toLocaleString('en-IN')}` : 'N/A'}\n`;
    txt += `  Acoustic Door Price: ${c.doorPrice && c.doors>0 ? `₹${(c.doorPrice*c.doors).toLocaleString('en-IN')}` : 'N/A'}\n`;
    txt += `  Room Total: ₹${c.fullCost ? c.fullCost.toLocaleString('en-IN') : 'N/A'}\n\n`;
  });

  let totalWall=0, totalDed=0, netWall=0, totalCeil=0, totalFloor=0, totalDoors=0;
  let wallCost=0, ceilCost=0, floorCost=0, doorCost=0, projectCost=0;
  rooms.forEach(r => {
    const c = calcRoomAreas(r);
    totalWall += c.totalWall;
    totalDed += c.deductionArea;
    netWall += c.netWall;
    totalCeil += c.ceilArea;
    totalFloor += c.floorArea;
    totalDoors += c.doors||0;
    wallCost += c.wallCost||0;
    ceilCost += c.ceilCost||0;
    floorCost += c.floorCost||0;
    doorCost += c.doorCost||0;
    projectCost += c.fullCost||0;
  });
  txt += `---\nPROJECT SUMMARY\n`;
  txt += `All Rooms Total Net Wall Areas: ${netWall.toFixed(2)} sq ft\n`;
  txt += `All Rooms Total Ceiling Areas: ${totalCeil.toFixed(2)} sq ft\n`;
  txt += `All Rooms Total Floor Areas: ${totalFloor.toFixed(2)} sq ft\n`;
  txt += `All Rooms Total Acoustic Doors: ${totalDoors}\n`;
  txt += `Wall Area Price: ${wallCost>0 ? `₹${wallCost.toLocaleString('en-IN')}` : 'N/A'}\n`;
  txt += `Ceiling Area Price: ${ceilCost>0 ? `₹${ceilCost.toLocaleString('en-IN')}` : 'N/A'}\n`;
  txt += `Floor Area Price: ${floorCost>0 ? `₹${floorCost.toLocaleString('en-IN')}` : 'N/A'}\n`;
  txt += `Acoustic Door Price: ${doorCost>0 ? `₹${doorCost.toLocaleString('en-IN')}` : 'N/A'}\n`;
  txt += `TOTAL PROJECT COST: ₹${projectCost>0 ? projectCost.toLocaleString('en-IN') : 'N/A'}\n`;
  txt += `\nCreated with DIGICAL by Digi Acoustics\n`;
  txt += `Date & Time: ${document.getElementById('timestamp').textContent.replace('Date & Time: ','')}\n`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => alert('Full report copied to clipboard!'));
  } else {
    alert('Clipboard access denied.');
  }
}
function resetAll() {
  if (confirm('Clear everything?')) {
    rooms = [];
    currentRoom = 0;
    document.getElementById('projectName').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('projectLocation').value = '';
    renderRoomTabs();
    renderRoomForm();
    renderResults();
    renderTotalSummary();
    updateTimestamp();
  }
}
function takeScreenshot() {
  html2canvas(document.querySelector('main'), { backgroundColor: '#fff', scale: 2 }).then(canvas => {
    let link = document.createElement('a');
    const pname = document.getElementById('projectName').value || 'DIGICAL_Report';
    const now = new Date();
    const fname = `${pname.replace(/\s+/g, '_')}_${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now
      .getDate()
      .toString()
      .padStart(2, '0')}_${now.getHours()}${now.getMinutes()}.png`;
    link.download = fname;
    link.href = canvas.toDataURL();
    link.click();
  });
}

// Event Bindings
document.getElementById('addRoomBtn').addEventListener('click', () => addRoom());
document.getElementById('calculateBtn').addEventListener('click', () => calculateAll());
document.getElementById('saveBtn').addEventListener('click', () => saveProject());
document.getElementById('shareBtn').addEventListener('click', () => shareResults());
document.getElementById('resetBtn').addEventListener('click', () => resetAll());
document.getElementById('screenshotBtn').addEventListener('click', () => takeScreenshot());

document.getElementById('savedProjects').addEventListener('change', updateProjectInfo);
document.getElementById('loadProjectBtn').addEventListener('click', () => {
  const name = document.getElementById('savedProjects').value;
  loadProject(name);
});
document.getElementById('deleteProjectBtn').addEventListener('click', () => deleteProject());

// Load projects on startup
loadSavedProjects();
addRoom();
