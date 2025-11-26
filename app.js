/* app.js
   JS-heavy Expense Tracker
   - Builds UI
   - Manages data + storage
   - Renders charts
   - Offers export/import and CSV
*/

/* ---------- Utility helpers ---------- */
const $ = sel => document.querySelector(sel);
const $c = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') el.className = attrs[k];
    else if (k === 'text') el.textContent = attrs[k];
    else el.setAttribute(k, attrs[k]);
  }
  for (const ch of children) {
    if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  }
  return el;
};
const fmt = n => Number(n).toLocaleString(undefined, {maximumFractionDigits:2});

/* ---------- Storage layer ---------- */
const STORAGE_KEY = 'nomadx_expenses_v1';
const PREF_KEY = 'nomadx_prefs_v1';

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {expenses:[], meta:{}} ;
    const parsed = JSON.parse(raw);
    // Basic migration guard
    return parsed;
  }catch(e){
    console.error("Failed to load storage", e);
    return {expenses:[], meta:{}};
  }
}
function saveData(model){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
}
function loadPrefs(){
  try{
    return JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  }catch(e){ return {};}
}
function savePrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

/* ---------- Default categories ---------- */
const DEFAULT_CATEGORIES = [
  {id:'food', name:'Food'},
  {id:'transport', name:'Transport'},
  {id:'shopping', name:'Shopping'},
  {id:'bills', name:'Bills'},
  {id:'entertainment', name:'Entertainment'},
  {id:'other', name:'Other'},
];

/* ---------- App State ---------- */
const state = {
  model: loadData(), // { expenses: [...], meta: {...} }
  prefs: loadPrefs(), // theme, budget, username
  ui: {
    filterCategory: 'all',
    search: '',
    sortBy: 'date_desc', // date_desc, date_asc, amount_desc, amount_asc, name
    showRecurringNextDays: 7
  },
  charts: {pie:null, line:null}
};

// Ensure model shape
if(!Array.isArray(state.model.expenses)) state.model.expenses = [];
if(!state.model.meta) state.model.meta = {createdAt: Date.now()};

/* ---------- Helpers for expenses ---------- */
function createExpense({title,amount,category,date,notes, recurring}) {
  return {
    id: Date.now() + Math.floor(Math.random()*999),
    title: String(title).trim(),
    amount: Number(amount) || 0,
    category: category || 'other',
    date: date ? (new Date(date)).toISOString() : new Date().toISOString(),
    notes: notes || '',
    recurring: recurring || null // null or {freq: 'monthly'|'weekly'|'daily'}
  };
}
function addExpense(exp){
  state.model.expenses.push(exp);
  saveData(state.model);
  render();
}
function updateExpense(id, updates){
  const idx = state.model.expenses.findIndex(e=>e.id===id);
  if(idx===-1) return;
  state.model.expenses[idx] = {...state.model.expenses[idx], ...updates};
  saveData(state.model);
  render();
}
function deleteExpense(id){
  state.model.expenses = state.model.expenses.filter(e=>e.id!==id);
  saveData(state.model);
  render();
}

/* ---------- Recurring processing ----------
   When app loads, we check recurring expenses and add missing occurrences.
   A conservative approach: add at most one occurrence per recurring item if older than interval.
*/
function processRecurring() {
  const freqDays = {daily:1, weekly:7, monthly:30};
  const now = new Date();
  const toAdd = [];
  state.model.expenses.forEach(e => {
    if(!e.recurring) return;
    const lastDate = new Date(e.date);
    const days = (now - lastDate) / (1000*60*60*24);
    const d = freqDays[e.recurring.freq] || 30;
    if(days >= d - 0.5) {
      // create next occurrence date by adding the frequency
      const next = new Date(lastDate);
      if(e.recurring.freq === 'daily') next.setDate(next.getDate()+1);
      else if(e.recurring.freq === 'weekly') next.setDate(next.getDate()+7);
      else { next.setMonth(next.getMonth()+1); }
      const newExp = {...e, id: Date.now()+Math.floor(Math.random()*999), date: next.toISOString()};
      toAdd.push(newExp);
    }
  });
  if(toAdd.length){
    state.model.expenses.push(...toAdd);
    saveData(state.model);
  }
}

/* ---------- Rendering UI ---------- */
function buildUI(){
  const root = $('#app');
  root.innerHTML = '';

  const container = $c('div',{class:'container'});

  /* Left panel (controls + list) */
  const left = $c('div',{class:'panel'});
  // Header
  const header = $c('div',{class:'header'},
    $c('div',{class:'brand'},
      $c('div',{class:'logo'}, 'NX'),
      $c('div',{}, $c('div',{class:'h1', text:'Expense Tracker'}), $c('div',{class:'small muted', text:'Manage your money — JS heavy'}) )
    ),
    $c('div',{},
      $c('button',{class:'icon-btn', id:'exportCSV', title:'Export CSV'}, 'Export CSV'),
      $c('button',{class:'icon-btn', id:'exportJSON', title:'Backup JSON'}, 'Backup'),
      $c('button',{class:'icon-btn', id:'importJSON', title:'Import JSON'}, 'Import')
    )
  );
  left.appendChild(header);

  // Add / form (JS heavy)
  const formRoot = $c('div',{});
  formRoot.appendChild($c('div',{class:'form-row'},
    $c('input',{class:'input', id:'inputTitle', placeholder:'Expense title'}),
    $c('input',{class:'input', id:'inputAmount', type:'number', placeholder:'Amount'})
  ));
  formRoot.appendChild($c('div',{class:'form-row'},
    $c('select',{class:'input', id:'inputCategory'},
      ...DEFAULT_CATEGORIES.map(c=>$c('option',{value:c.id,text:c.name}))
    ),
    $c('input',{class:'input', id:'inputDate', type:'date'})
  ));
  formRoot.appendChild($c('div',{class:'form-row'},
    $c('input',{class:'input', id:'inputNotes', placeholder:'Notes (optional)'}),
    $c('select',{class:'input', id:'inputRecurring'},
      $c('option',{value:'none', text:'One-time'}),
      $c('option',{value:'daily', text:'Daily'}),
      $c('option',{value:'weekly', text:'Weekly'}),
      $c('option',{value:'monthly', text:'Monthly'})
    )
  ));
  formRoot.appendChild($c('div',{class:'row'},
    $c('button',{class:'btn', id:'addExpenseBtn'}, 'Add Expense'),
    $c('button',{class:'ghost', id:'clearAllBtn'}, 'Clear All'),
    $c('button',{class:'ghost', id:'setBudgetBtn'}, 'Set Budget')
  ));
  left.appendChild(formRoot);

  // Stats cards
  const cards = $c('div',{class:'cards'});
  cards.appendChild($c('div',{class:'card'},
    $c('div',{class:'small muted', text:'Total Spent'}),
    $c('div',{class:'total-amount', id:'totalAmount', text:'KES 0'})
  ));
  cards.appendChild($c('div',{class:'card'},
    $c('div',{class:'small muted', text:'Entries'}),
    $c('div',{class:'total-amount', id:'entryCount', text:'0'})
  ));
  left.appendChild(cards);

  // Controls: search / filter / sort
  const controls = $c('div',{class:'controls'});
  controls.appendChild($c('input',{class:'input', id:'searchInput', placeholder:'Search title, notes or amount'}));
  const catSelect = $c('select',{class:'input', id:'filterCategory'},
    $c('option',{value:'all', text:'All Categories'}),
    ...DEFAULT_CATEGORIES.map(c=>$c('option',{value:c.id, text:c.name}))
  );
  controls.appendChild(catSelect);
  const sortSelect = $c('select',{class:'input', id:'sortSelect'},
    $c('option',{value:'date_desc', text:'Date: Newest'}),
    $c('option',{value:'date_asc', text:'Date: Oldest'}),
    $c('option',{value:'amount_desc', text:'Amount: High → Low'}),
    $c('option',{value:'amount_asc', text:'Amount: Low → High'}),
    $c('option',{value:'name_asc', text:'Name A→Z'}),
    $c('option',{value:'name_desc', text:'Name Z→A'})
  );
  controls.appendChild(sortSelect);
  left.appendChild(controls);

  // Expense list
  const listRoot = $c('div',{class:'list', id:'expenseList'});
  left.appendChild(listRoot);

  /* Right panel (dashboard + charts) */
  const right = $c('div',{class:'panel dashboard'});

  // Budget & progress
  const budgetCard = $c('div',{class:'card'},
    $c('div',{class:'small muted', text:'Monthly Budget'}),
    $c('div',{class:'row'},
      $c('div',{class:'total-amount', id:'budgetAmount', text:'KES 0'}),
      $c('div',{class:'right muted', id:'budgetLeft', text:''})
    ),
    $c('div',{class:'progress', id:'budgetProgress'},
      $c('div',{class:'bar', id:'budgetBar', style:'width:0%'})
    )
  );
  right.appendChild(budgetCard);

  // Charts
  const chartsWrap = $c('div',{class:'chart-card'},
    $c('h3', {text: 'Spending by Category'}),
    $c('canvas',{id:'pieChart', height:160})
  );
  right.appendChild(chartsWrap);

  const chartsWrap2 = $c('div',{class:'chart-card'},
    $c('h3', {text: 'Spending over Time'}),
    $c('canvas',{id:'lineChart', height:160})
  );
  right.appendChild(chartsWrap2);

  // Bottom actions
  const bottom = $c('div',{class:'row'},
    $c('button',{class:'ghost', id:'downloadJSON'}, 'Export JSON'),
    $c('button',{class:'ghost', id:'importFileBtn'}, 'Import JSON File'),
    $c('button',{class:'danger', id:'clearStorageBtn'}, 'Delete All Data')
  );
  right.appendChild(bottom);

  container.appendChild(left);
  container.appendChild(right);
  root.appendChild(container);

  /* Hidden file input for import */
  const fileInput = $c('input',{type:'file', id:'hiddenFile', accept:'.json', style:'display:none'});
  root.appendChild(fileInput);
}

/* ---------- Events binding & render logic ---------- */
function attachEvents(){
  $('#addExpenseBtn').addEventListener('click', onAddExpense);
  $('#clearAllBtn').addEventListener('click', onClearAll);
  $('#setBudgetBtn').addEventListener('click', onSetBudget);
  $('#searchInput').addEventListener('input', (e)=>{ state.ui.search = e.target.value; renderList(); });
  $('#filterCategory').addEventListener('change', (e)=>{ state.ui.filterCategory = e.target.value; renderList(); });
  $('#sortSelect').addEventListener('change', (e)=>{ state.ui.sortBy = e.target.value; renderList(); });

  $('#exportCSV').addEventListener('click', exportCSV);
  $('#exportJSON').addEventListener('click', () => downloadJSON(state.model));
  $('#importJSON').addEventListener('click', () => $('#hiddenFile').click());
  $('#hiddenFile').addEventListener('change', importFromFile);

  $('#downloadJSON').addEventListener('click', () => downloadJSON(state.model));
  $('#importFileBtn').addEventListener('click', ()=> $('#hiddenFile').click());

  $('#clearStorageBtn').addEventListener('click', ()=>{
    if(confirm('Delete ALL saved data? This cannot be undone.')) {
      state.model = {expenses:[], meta:{createdAt: Date.now()}};
      saveData(state.model);
      render();
    }
  });

  // Delegated list click handlers handled in renderList
}

/* ---------- Render list and header stats ---------- */
function render(){
  processRecurring();
  renderStats();
  renderList();
  renderCharts();
}
function renderStats(){
  const total = state.model.expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  $('#totalAmount').textContent = `KES ${fmt(total)}`;
  $('#entryCount').textContent = state.model.expenses.length;

  // Budget UI
  const budget = Number(state.prefs.budget || 0);
  $('#budgetAmount').textContent = budget ? `KES ${fmt(budget)}` : 'KES 0';
  if(budget>0){
    const percent = Math.min(100, (total / budget) * 100);
    $('#budgetBar').style.width = `${percent}%`;
    $('#budgetLeft').textContent = `${Math.max(0, Math.round(100 - percent))}% left`;
    if(percent >= 100) {
      $('#budgetBar').style.background = 'linear-gradient(90deg,#ef4444,#f97316)';
    } else if(percent >= 80) {
      $('#budgetBar').style.background = 'linear-gradient(90deg,#f59e0b,#ef4444)';
    } else {
      $('#budgetBar').style.background = '';
    }
  } else {
    $('#budgetBar').style.width = '0%';
    $('#budgetLeft').textContent = '';
  }
}

function renderList(){
  const root = $('#expenseList');
  root.innerHTML = '';
  const q = state.ui.search.trim().toLowerCase();
  let arr = [...state.model.expenses];

  // Filter
  if(state.ui.filterCategory !== 'all'){
    arr = arr.filter(a => a.category === state.ui.filterCategory);
  }
  // Search: title, notes, amount
  if(q){
    arr = arr.filter(e => {
      return (e.title && e.title.toLowerCase().includes(q)) ||
             (e.notes && e.notes.toLowerCase().includes(q)) ||
             (String(e.amount).includes(q));
    });
  }
  // Sort
  arr.sort((a,b) => {
    switch(state.ui.sortBy){
      case 'date_asc': return new Date(a.date) - new Date(b.date);
      case 'date_desc': return new Date(b.date) - new Date(a.date);
      case 'amount_asc': return a.amount - b.amount;
      case 'amount_desc': return b.amount - a.amount;
      case 'name_asc': return a.title.localeCompare(b.title);
      case 'name_desc': return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  // Render each
  arr.forEach(e => {
    const left = $c('div',{class:'meta'},
      $c('div',{class:'category-badge', text: (DEFAULT_CATEGORIES.find(c=>c.id===e.category)?.name || e.category)}),
      $c('div',{}, $c('div',{text: e.title}), $c('div',{class:'muted', text: new Date(e.date).toLocaleString()}))
    );
    const right = $c('div',{}, $c('div',{text:`KES ${fmt(e.amount)}`}));
    const row = $c('div',{class:'expense'});
    row.appendChild(left);
    const actions = $c('div',{class:'row'});
    const editBtn = $c('button',{class:'icon-btn', title:'Edit'}, 'Edit');
    const delBtn = $c('button',{class:'icon-btn', title:'Delete'}, 'Delete');
    editBtn.addEventListener('click', ()=> openEditModal(e));
    delBtn.addEventListener('click', ()=> {
      if(confirm('Delete this expense?')) deleteExpense(e.id);
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(right);
    row.appendChild(actions);
    root.appendChild(row);
  });

  if(arr.length === 0) {
    root.appendChild($c('div',{class:'muted center', text:'No expenses yet — add some!'}));
  }
}

/* ---------- Chart rendering (Chart.js) ---------- */
function renderCharts(){
  const ctxPie = document.getElementById('pieChart').getContext('2d');
  const ctxLine = document.getElementById('lineChart').getContext('2d');

  // Pie: sum by category
  const sums = {};
  for(const c of DEFAULT_CATEGORIES) sums[c.id] = 0;
  state.model.expenses.forEach(e => {
    sums[e.category] = (sums[e.category] || 0) + Number(e.amount||0);
  });
  const labels = DEFAULT_CATEGORIES.map(c=>c.name);
  const data = DEFAULT_CATEGORIES.map(c=>sums[c.id] || 0);

  // Destroy existing charts if present
  if(state.charts.pie) state.charts.pie.destroy();
  state.charts.pie = new Chart(ctxPie, {
    type:'pie',
    data: {
      labels,
      datasets:[{
        data,
        // backgroundColor omitted to let Chart.js default palette
      }]
    },
    options:{plugins:{legend:{position:'bottom'}}}
  });

  // Line chart: daily totals for last 30 days
  const dayMap = {};
  const days = [];
  for(let i=29;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    dayMap[key] = 0;
    days.push(key);
  }
  state.model.expenses.forEach(e=>{
    const k = e.date.slice(0,10);
    if(k in dayMap) dayMap[k] += Number(e.amount||0);
  });
  const lineData = days.map(d=>dayMap[d]);

  if(state.charts.line) state.charts.line.destroy();
  state.charts.line = new Chart(ctxLine, {
    type:'line',
    data: {
      labels: days.map(d => (new Date(d)).toLocaleDateString()),
      datasets: [{
        label: 'Daily spend',
        data: lineData,
        tension: 0.35,
        fill: true,
      }]
    },
    options:{plugins:{legend:{display:false}}}
  });
}

/* ---------- Actions ---------- */
function onAddExpense(){
  const title = $('#inputTitle').value.trim();
  const amount = Number($('#inputAmount').value);
  const category = $('#inputCategory').value;
  const date = $('#inputDate').value || new Date().toISOString().slice(0,10);
  const notes = $('#inputNotes').value.trim();
  const rec = $('#inputRecurring').value;
  if(!title || !amount){
    alert('Please enter title and amount');
    return;
  }
  const exp = createExpense({
    title, amount, category, date: new Date(date).toISOString(), notes,
    recurring: rec === 'none' ? null : {freq: rec}
  });
  addExpense(exp);
  // clear inputs
  $('#inputTitle').value = '';
  $('#inputAmount').value = '';
  $('#inputNotes').value = '';
  $('#inputRecurring').value = 'none';
  $('#inputDate').value = '';
}

function onClearAll(){
  if(!confirm('Clear all expenses right now?')) return;
  state.model.expenses = [];
  saveData(state.model);
  render();
}

function onSetBudget(){
  const val = prompt('Set monthly budget (KES):', state.prefs.budget || '');
  if(val === null) return;
  const n = Number(val);
  if(Number.isNaN(n) || n<0) { alert('Enter a valid number'); return; }
  state.prefs.budget = n;
  savePrefs(state.prefs);
  renderStats();
}

/* ---------- Modal for editing ---------- */
function openEditModal(exp){
  const modal = $c('div',{class:'modal'});
  const card = $c('div',{class:'modal-card'});
  card.appendChild($c('h3',{text:'Edit Expense'}));
  const titleIn = $c('input',{class:'input', value:exp.title});
  const amtIn = $c('input',{class:'input', type:'number', value:exp.amount});
  const catIn = $c('select',{class:'input'}, ...DEFAULT_CATEGORIES.map(c=>$c('option',{value:c.id, text:c.name})));
  catIn.value = exp.category;
  const dateIn = $c('input',{class:'input', type:'date', value:exp.date.slice(0,10)});
  const notesIn = $c('input',{class:'input', value:exp.notes || ''});
  const recIn = $c('select',{class:'input'},
    $c('option',{value:'none', text:'One-time'}),
    $c('option',{value:'daily', text:'Daily'}),
    $c('option',{value:'weekly', text:'Weekly'}),
    $c('option',{value:'monthly', text:'Monthly'})
  );
  recIn.value = exp.recurring ? exp.recurring.freq : 'none';

  card.appendChild(titleIn);
  card.appendChild(amtIn);
  card.appendChild(catIn);
  card.appendChild(dateIn);
  card.appendChild(notesIn);
  card.appendChild(recIn);

  const actions = $c('div',{class:'row', style:'margin-top:10px;'});
  const saveBtn = $c('button',{class:'btn'}, 'Save');
  const cancelBtn = $c('button',{class:'ghost'}, 'Cancel');
  const delBtn = $c('button',{class:'danger'}, 'Delete');
  actions.appendChild(saveBtn); actions.appendChild(cancelBtn); actions.appendChild(delBtn);
  card.appendChild(actions);
  modal.appendChild(card);
  document.body.appendChild(modal);

  cancelBtn.addEventListener('click', ()=> modal.remove());
  delBtn.addEventListener('click', ()=> {
    if(confirm('Delete this expense?')) {
      deleteExpense(exp.id);
      modal.remove();
    }
  });
  saveBtn.addEventListener('click', ()=> {
    const updates = {
      title: titleIn.value.trim(),
      amount: Number(amtIn.value),
      category: catIn.value,
      date: new Date(dateIn.value).toISOString(),
      notes: notesIn.value.trim(),
      recurring: recIn.value==='none' ? null : {freq: recIn.value}
    };
    updateExpense(exp.id, updates);
    modal.remove();
  });
}

/* ---------- Export/Import / CSV ---------- */
function exportCSV(){
  const rows = [['id','title','amount','category','date','notes','recurring']];
  state.model.expenses.forEach(e=>{
    rows.push([e.id, e.title, e.amount, e.category, e.date, (e.notes||''), JSON.stringify(e.recurring||null)]);
  });
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(obj){
  const content = JSON.stringify(obj, null, 2);
  const blob = new Blob([content], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `expenses_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importFromFile(e){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try{
      const parsed = JSON.parse(ev.target.result);
      if(!parsed || !Array.isArray(parsed.expenses)) throw new Error('File invalid');
      if(confirm('Replace current data with imported data? Press Cancel to MERGE instead.')) {
        state.model = parsed;
      } else {
        // merge (by id)
        const existingIds = new Set(state.model.expenses.map(x=>x.id));
        const merged = [...state.model.expenses];
        parsed.expenses.forEach(item => { if(!existingIds.has(item.id)) merged.push(item); });
        state.model.expenses = merged;
      }
      saveData(state.model);
      render();
      alert('Import success');
    }catch(err){
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(f);
  // clear input value so same file can be selected later
  e.target.value = '';
}

/* ---------- On load ---------- */
(function init(){
  buildUI();
  attachEvents();
  // load prefs -> set budget display etc
  state.prefs = state.prefs || {};
  // initial processing of recurring expenses
  processRecurring();
  // initial render
  render();

  // small welcome customization
  if(!state.prefs.username){
    const name = prompt('Welcome! What should we call you?', 'Star');
    if(name) { state.prefs.username = name; savePrefs(state.prefs); }
  }
})();
