// ---------------------------
// Configurações iniciais
// ---------------------------
const THEMES = {
  'Default': {
    name: 'Default',
    vars: { '--bg':'#f4f7f6','--text':'#111827','--card':'#ffffff','--primary':'#4f46e5','--accent':'#f59e0b' }
  },
  'Dark Classic': {
    name: 'Dark Classic',
    vars: { '--bg':'#0b0f14','--text':'#e6eef8','--card':'#0f1720','--primary':'#60a5fa','--accent':'#f59e0b' }
  },
  'Slate Blue': {
    name: 'Slate Blue',
    vars: { '--bg':'#f8fafc','--text':'#0f1724','--card':'#ffffff','--primary':'#0f172a','--accent':'#06b6d4' }
  },
  'Solarized': {
    name: 'Solarized',
    vars: { '--bg':'#fdf6e3','--text':'#073642','--card':'#fffef6','--primary':'#268bd2','--accent':'#b58900' }
  },
  'High Contrast': {
    name: 'High Contrast',
    vars: { '--bg':'#000000','--text':'#ffffff','--card':'#111111','--primary':'#ffcc00','--accent':'#ff4d4f' }
  }
};

let userScores = {};            // carregado de dados.json
let myChart = null;
let currentThemeName = 'Default';
const DEFAULT_STATE_MARK = '__DEFAULT_STATE__';

// ---------------------------
// Theme helpers
// ---------------------------
function applyThemeVars(vars){
  const root = document.documentElement;
  for(const k in vars) root.style.setProperty(k, vars[k]);
  // detect dark from bg luminance
  const bg = vars['--bg'] || getComputedStyle(root).getPropertyValue('--bg');
  root.setAttribute('data-theme', isColorDark((bg||'').toString()) ? 'dark' : 'light');
  localStorage.setItem('selectedTheme', JSON.stringify({name: currentThemeName, vars}));
  // mark active
  document.querySelectorAll('#palette button').forEach(b => b.dataset.active = (b.dataset.name === currentThemeName));
}

function isColorDark(hex){
  try{
    if(!hex) return false;
    if(hex.startsWith('#')){
      const r = parseInt(hex.substr(1,2),16);
      const g = parseInt(hex.substr(3,2),16);
      const b = parseInt(hex.substr(5,2),16);
      const lum = 0.2126*r + 0.7152*g + 0.0722*b;
      return lum < 128;
    }
    if(hex.startsWith('rgb')){
      const nums = hex.match(/\d+/g).map(Number);
      const lum = 0.2126*nums[0] + 0.7152*nums[1] + 0.0722*nums[2];
      return lum < 128;
    }
  }catch(e){}
  return false;
}

function applyPredefinedTheme(name){
  const t = THEMES[name];
  if(!t) return;
  currentThemeName = name;
  applyThemeVars(t.vars);
}

function resetThemeToDefault(){
  localStorage.removeItem('selectedTheme');
  applyPredefinedTheme('Default');
}

// ---------------------------
// Palette UI
// ---------------------------
function renderPalette(){
  const container = document.getElementById('palette');
  container.innerHTML = '';
  Object.keys(THEMES).forEach(key => {
    const t = THEMES[key];
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="theme-swatch" style="background:${t.vars['--primary']}"></span><span>${t.name}</span>`;
    btn.dataset.name = key;
    btn.onclick = () => applyPredefinedTheme(key);
    container.appendChild(btn);
  });
}

// ---------------------------
// Dados (dados.json)
// ---------------------------
async function loadDataJSON(){
  try{
    const resp = await fetch('dados.json', {cache: "no-store"});
    if(!resp.ok) throw new Error('Falha ao obter dados.json');
    userScores = await resp.json();
    // keep a copy in case of reset
    localStorage.setItem(DEFAULT_STATE_MARK, JSON.stringify(userScores));
  }catch(err){
    // fallback minimal
    console.error(err);
    userScores = { 'Alice': 10, 'Bob': -3, 'Carlos': 5 };
  }
}

// ---------------------------
// Tabela & edição
// ---------------------------
function addUser(){
  const inp = document.getElementById('newUserName');
  const name = inp.value.trim();
  if(!name) { alert('Digite um nome válido'); return; }
  if(userScores.hasOwnProperty(name)){ alert('Usuário já existe'); return; }
  userScores[name] = 0;
  inp.value = '';
  renderTable();
}

function deleteUser(name){
  if(!confirm(`Remover ${name}?`)) return;
  delete userScores[name];
  renderTable();
}

function changeScore(name, delta){
  userScores[name] = (userScores[name] || 0) + delta;
  renderTable();
}

function editScore(name){
  const span = document.getElementById(`score-${name}`);
  const input = document.createElement('input');
  input.type = 'number';
  input.value = userScores[name];
  input.style.width = '64px';
  span.replaceWith(input);
  input.focus();
  const save = () => {
    const nv = parseInt(input.value);
    if(!isNaN(nv)) userScores[name] = nv;
    renderTable();
  };
  input.addEventListener('blur', save);
  input.addEventListener('keypress', e => { if(e.key === 'Enter') save(); });
}

function resetData(){
  if(!confirm('Resetar dados para o padrão?')) return;
  const saved = localStorage.getItem(DEFAULT_STATE_MARK);
  if(saved){
    userScores = JSON.parse(saved);
  } else {
    // fallback minimal
    userScores = { 'Alice': 10, 'Bob': -3, 'Carlos': 5 };
  }
  renderTable();
}

// ---------------------------
// Estatísticas & Gráfico
// ---------------------------
function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function median(arr){
  const s = [...arr].sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
}

function renderChart(){
  const labels = Object.keys(userScores);
  const values = Object.values(userScores);
  const avg = mean(values);
  const med = median(values);

  if(myChart) myChart.destroy();

  const ctx = document.getElementById('pointsChart').getContext('2d');

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pontuação',
        data: values,
        backgroundColor: values.map(v => v >= 0 ? 'rgba(75,192,192,0.85)' : 'rgba(255,99,132,0.85)'),
        borderColor: values.map(v => v >= 0 ? 'rgba(75,192,192,1)' : 'rgba(255,99,132,1)'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      },
      plugins: {
        annotation: {
          annotations: {
            avgLine: {
              type: 'line', mode: 'horizontal', scaleID: 'y', value: avg,
              borderColor: 'rgba(0,0,0,0.8)', borderDash: [6,6], borderWidth: 2,
              label: { enabled:true, content: 'Média: ' + Number(avg).toFixed(2), position: 'end' }
            },
            medLine: {
              type: 'line', mode: 'horizontal', scaleID: 'y', value: med,
              borderColor: 'rgba(0,0,0,0.6)', borderDash: [3,3], borderWidth: 2,
              label: { enabled:true, content: 'Mediana: ' + Number(med).toFixed(2), position: 'start' }
            }
          }
        }
      }
    }
  });
}

// ---------------------------
// Render tabela
// ---------------------------
function renderTable(){
  const header = document.getElementById('tableHeader');
  const body = document.getElementById('tableBody');

  header.innerHTML = '<th>Usuário</th>' + Object.keys(userScores).map(n => `<th>${n} <button class="small-x" onclick="deleteUser('${n}')">✕</button></th>`).join('');
  body.innerHTML = '';

  const row = document.createElement('tr');
  row.innerHTML = '<td><b>Pontos</b></td>' + Object.keys(userScores).map(n => `
    <td class="score-cell">
      <span class="score-display" id="score-${n}" onclick="editScore('${n}')">${userScores[n]}</span><br>
      <button class="success" onclick="changeScore('${n}',1)">+1</button>
      <button class="danger" onclick="changeScore('${n}',-1)">-1</button>
    </td>
  `).join('');
  body.appendChild(row);

  renderChart();
}

// ---------------------------
// Inicialização
// ---------------------------
async function init(){
  renderPalette();

  // carregar dados.json
  await loadDataJSON();

  // carregar tema salvo
  const saved = localStorage.getItem('selectedTheme');
  if(saved){
    try{
      const parsed = JSON.parse(saved);
      // find closest theme name (optional)
      const found = Object.keys(THEMES).find(k => JSON.stringify(THEMES[k].vars) === JSON.stringify(parsed.vars));
      if(found) currentThemeName = found;
      applyThemeVars(parsed.vars);
    }catch(e){
      applyPredefinedTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark Classic' : 'Default');
    }
  } else {
    applyPredefinedTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark Classic' : 'Default');
  }

  // event listeners
  document.getElementById('toggleThemeBtn').onclick = () => {
    const root = document.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    localStorage.setItem('manualThemeToggle', root.getAttribute('data-theme'));
  };
  document.getElementById('resetThemeBtn').onclick = resetThemeToDefault;
  document.getElementById('addUserBtn').onclick = addUser;
  document.getElementById('resetDataBtn').onclick = resetData;
  document.getElementById('newUserName').addEventListener('keypress', e => { if(e.key === 'Enter') addUser(); });

  renderTable();
}

window.addUser = addUser; window.deleteUser = deleteUser; window.changeScore = changeScore;
window.editScore = editScore; window.resetData = resetData; window.applyPredefinedTheme = applyPredefinedTheme;
window.renderPalette = renderPalette;

init();
