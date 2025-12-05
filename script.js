/**
 * ================================================================
 * 🏆 SISTEMA DE GESTÃO DE PONTOS INTERATIVO v3.0
 * ================================================================
 * Sistema totalmente estático compatível com GitHub Pages
 * - Modo visualização por padrão (sem login)
 * - Login opcional para editar
 * - Múltiplas categorias de pontos
 * - Tabela com abas de filtro
 * - Salvamento direto no arquivo
 * ================================================================
 */

'use strict';

// ================================================================
// 🔧 CONFIGURAÇÕES E CONSTANTES
// ================================================================

const CONFIG = {
  // Credenciais de acesso (demo)
  AUTH: {
    username: 'kayham',
    password: 'kristofferadmarmota'
  },
  
  // Chaves do localStorage
  STORAGE_KEYS: {
    THEME: 'selectedTheme',
    DATA: 'userScoresData',
    DEFAULT_DATA: '__DEFAULT_STATE__'
  },
  
  // Categorias de pontos padrão
  DEFAULT_CATEGORIES: ['Atividade', 'Experiencia', 'Bonus', 'Maturidade', 'Evento'],
  
  // Temas pré-definidos
  THEMES: {
    'Default': {
      name: 'Default',
      vars: {
        '--bg': '#f8fafc',
        '--text': '#0f172a',
        '--card': '#ffffff',
        '--primary': '#4f46e5',
        '--accent': '#f59e0b'
      }
    },
    'Dark Classic': {
      name: 'Dark Classic',
      vars: {
        '--bg': '#0f172a',
        '--text': '#e2e8f0',
        '--card': '#1e293b',
        '--primary': '#6366f1',
        '--accent': '#fbbf24'
      }
    },
    'Ocean': {
      name: 'Ocean',
      vars: {
        '--bg': '#f0f9ff',
        '--text': '#0c4a6e',
        '--card': '#ffffff',
        '--primary': '#0284c7',
        '--accent': '#06b6d4'
      }
    },
    'Forest': {
      name: 'Forest',
      vars: {
        '--bg': '#f0fdf4',
        '--text': '#14532d',
        '--card': '#ffffff',
        '--primary': '#16a34a',
        '--accent': '#84cc16'
      }
    },
    'Sunset': {
      name: 'Sunset',
      vars: {
        '--bg': '#fff7ed',
        '--text': '#431407',
        '--card': '#ffffff',
        '--primary': '#ea580c',
        '--accent': '#f59e0b'
      }
    },
    'High Contrast': {
      name: 'High Contrast',
      vars: {
        '--bg': '#000000',
        '--text': '#ffffff',
        '--card': '#1a1a1a',
        '--primary': '#ffcc00',
        '--accent': '#ff4d4f'
      }
    }
  },
  
  // Mensagens do sistema
  MESSAGES: {
    LOGIN_SUCCESS: 'Login realizado com sucesso!',
    LOGIN_ERROR: 'Usuário ou senha incorretos!',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
    USER_EXISTS: 'Este usuário já existe na tabela!',
    USER_ADDED: 'Usuário adicionado com sucesso!',
    USER_DELETED: 'Usuário removido com sucesso!',
    CATEGORY_EXISTS: 'Esta categoria já existe!',
    CATEGORY_ADDED: 'Categoria adicionada com sucesso!',
    CATEGORY_DELETED: 'Categoria removida com sucesso!',
    DATA_SAVED: 'Dados salvos com sucesso!',
    DATA_RESET: 'Dados resetados para o estado inicial!',
    THEME_CHANGED: 'Tema alterado com sucesso!',
    DOWNLOAD_SUCCESS: 'Arquivo baixado com sucesso!',
    INVALID_NAME: 'Por favor, digite um nome válido!',
    SCORE_UPDATED: 'Pontuação atualizada!',
    SAVE_ERROR: 'Erro ao salvar. Como é um sistema estático, o arquivo será baixado.'
  }
};

// ================================================================
// 📊 ESTADO GLOBAL DA APLICAÇÃO
// ================================================================

const AppState = {
  userScores: {},
  chart: null,
  currentTheme: 'Default',
  isLoggedIn: false,
  currentCategory: 'Geral',
  customizationVisible: false,
  
  /**
   * Inicializa o estado da aplicação
   */
  init() {
    this.loadTheme();
    this.checkLoginStatus();
  },
  
  /**
   * Verifica status de login
   */
  checkLoginStatus() {
    // Por padrão, modo visualização (não logado)
    this.isLoggedIn = false;
  },
  
  /**
   * Realiza login
   */
  login(username, password) {
    if (username === CONFIG.AUTH.username && password === CONFIG.AUTH.password) {
      this.isLoggedIn = true;
      return true;
    }
    return false;
  },
  
  /**
   * Realiza logout
   */
  logout() {
    this.isLoggedIn = false;
  },
  
  /**
   * Carrega o tema salvo
   */
  loadTheme() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentTheme = parsed.name || 'Default';
        return parsed;
      } catch (e) {
        console.error('Erro ao carregar tema:', e);
      }
    }
    return null;
  },
  
  /**
   * Salva o tema atual
   */
  saveTheme(themeName, vars) {
    this.currentTheme = themeName;
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, JSON.stringify({
      name: themeName,
      vars: vars
    }));
  },
  
  /**
   * Salva os dados de pontuação
   */
  saveScores() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.DATA, JSON.stringify(this.userScores));
  },
  
  /**
   * Carrega os dados de pontuação
   */
  loadScores() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DATA);
    if (saved) {
      try {
        this.userScores = JSON.parse(saved);
        return true;
      } catch (e) {
        console.error('Erro ao carregar pontuações:', e);
      }
    }
    return false;
  },
  
  /**
   * Obtém todas as categorias disponíveis
   */
  getCategories() {
    const categories = new Set();
    Object.values(this.userScores).forEach(userData => {
      if (typeof userData === 'object') {
        Object.keys(userData).forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories);
  },
  
  /**
   * Calcula total de pontos de um usuário
   */
  getTotalPoints(userName) {
    const userData = this.userScores[userName];
    if (typeof userData === 'object') {
      return Object.values(userData).reduce((sum, val) => sum + (val || 0), 0);
    }
    return userData || 0;
  }
};

// ================================================================
// 🎨 GERENCIADOR DE TEMAS
// ================================================================

const ThemeManager = {
  /**
   * Aplica variáveis CSS do tema
   */
  applyVars(vars) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Detecta se o tema é escuro baseado na luminância
    const bgColor = vars['--bg'] || getComputedStyle(root).getPropertyValue('--bg');
    const isDark = this.isColorDark(bgColor);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  },
  
  /**
   * Verifica se uma cor é escura
   */
  isColorDark(color) {
    if (!color) return false;
    
    try {
      if (color.startsWith('#')) {
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance < 128;
      }
      
      if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const [r, g, b] = matches.map(Number);
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          return luminance < 128;
        }
      }
    } catch (e) {
      console.error('Erro ao detectar cor:', e);
    }
    
    return false;
  },
  
  /**
   * Aplica tema pré-definido
   */
  applyTheme(themeName) {
    const theme = CONFIG.THEMES[themeName];
    if (!theme) return false;
    
    this.applyVars(theme.vars);
    AppState.saveTheme(themeName, theme.vars);
    this.updatePaletteUI();
    
    return true;
  },
  
  /**
   * Alterna entre claro e escuro
   */
  toggle() {
    const root = document.documentElement;
    const currentMode = root.getAttribute('data-theme');
    const newMode = currentMode === 'dark' ? 'light' : 'dark';
    
    root.setAttribute('data-theme', newMode);
    
    ToastManager.show('Tema alternado!', 'success');
  },
  
  /**
   * Reseta para o tema padrão
   */
  reset() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.THEME);
    this.applyTheme('Default');
    ToastManager.show('Tema resetado!', 'success');
  },
  
  /**
   * Renderiza a paleta de temas
   */
  renderPalette() {
    const container = document.getElementById('palette');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(CONFIG.THEMES).forEach(([key, theme]) => {
      const button = document.createElement('button');
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', key === AppState.currentTheme);
      button.dataset.name = key;
      button.dataset.active = key === AppState.currentTheme;
      
      const swatch = document.createElement('span');
      swatch.className = 'theme-swatch';
      swatch.style.background = theme.vars['--primary'];
      swatch.setAttribute('aria-hidden', 'true');
      
      const label = document.createElement('span');
      label.textContent = theme.name;
      
      button.appendChild(swatch);
      button.appendChild(label);
      button.onclick = () => {
        this.applyTheme(key);
        ToastManager.show(CONFIG.MESSAGES.THEME_CHANGED, 'success');
      };
      
      container.appendChild(button);
    });
  },
  
  /**
   * Atualiza UI da paleta após mudança
   */
  updatePaletteUI() {
    document.querySelectorAll('#palette button').forEach(btn => {
      const isActive = btn.dataset.name === AppState.currentTheme;
      btn.dataset.active = isActive;
      btn.setAttribute('aria-checked', isActive);
    });
  }
};

// ================================================================
// 🍞 GERENCIADOR DE NOTIFICAÇÕES TOAST
// ================================================================

const ToastManager = {
  /**
   * Mostra uma notificação
   */
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Fechar notificação">×</button>
    `;
    
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => this.remove(toast);
    
    setTimeout(() => this.remove(toast), duration);
  },
  
  /**
   * Remove uma notificação
   */
  remove(toast) {
    toast.style.animation = 'slideInRight 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }
};

// ================================================================
// 📊 GERENCIADOR DE ESTATÍSTICAS
// ================================================================

const StatsManager = {
  /**
   * Calcula a média
   */
  mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  },
  
  /**
   * Calcula a mediana
   */
  median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  
  /**
   * Obtém estatísticas completas baseado na categoria atual
   */
  getStats() {
    const values = Object.keys(AppState.userScores).map(userName => {
      if (AppState.currentCategory === 'Geral') {
        return AppState.getTotalPoints(userName);
      } else {
        const userData = AppState.userScores[userName];
        return (typeof userData === 'object' ? userData[AppState.currentCategory] : 0) || 0;
      }
    });
    
    return {
      mean: this.mean(values),
      median: this.median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      total: values.length
    };
  }
};

// ================================================================
// 📈 GERENCIADOR DE GRÁFICOS
// ================================================================

const ChartManager = {
  /**
   * Renderiza o gráfico baseado na categoria atual
   */
  render() {
    const canvas = document.getElementById('pointsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(AppState.userScores);
    
    // Obtém valores baseado na categoria
    const values = labels.map(userName => {
      if (AppState.currentCategory === 'Geral') {
        return AppState.getTotalPoints(userName);
      } else {
        const userData = AppState.userScores[userName];
        return (typeof userData === 'object' ? userData[AppState.currentCategory] : 0) || 0;
      }
    });
    
    const stats = StatsManager.getStats();
    
    if (AppState.chart) {
      AppState.chart.destroy();
    }
    
    AppState.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: AppState.currentCategory === 'Geral' ? 'Pontuação Total' : AppState.currentCategory,
          data: values,
          backgroundColor: values.map(v => 
            v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
          ),
          borderColor: values.map(v => 
            v >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
          ),
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: values.map(v => 
            v >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            }
          },
          annotation: {
            annotations: {
              avgLine: {
                type: 'line',
                mode: 'horizontal',
                scaleID: 'y',
                value: stats.mean,
                borderColor: 'rgba(0, 0, 0, 0.8)',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  enabled: true,
                  content: `Média: ${stats.mean.toFixed(1)}`,
                  position: 'end',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  font: {
                    weight: 'bold',
                    size: 11
                  },
                  padding: 6,
                  cornerRadius: 4
                }
              },
              medLine: {
                type: 'line',
                mode: 'horizontal',
                scaleID: 'y',
                value: stats.median,
                borderColor: 'rgba(0, 0, 0, 0.6)',
                borderWidth: 2,
                borderDash: [3, 3],
                label: {
                  enabled: true,
                  content: `Mediana: ${stats.median.toFixed(1)}`,
                  position: 'start',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  font: {
                    weight: 'bold',
                    size: 11
                  },
                  padding: 6,
                  cornerRadius: 4
                }
              }
            }
          }
        }
      }
    });
  }
};

// ================================================================
// 📋 GERENCIADOR DE TABELA
// ================================================================

const TableManager = {
  /**
   * Renderiza a tabela completa
   */
  render() {
    this.renderTabs();
    this.renderTable();
    ChartManager.render();
  },
  
  /**
   * Renderiza as abas de categorias
   */
  renderTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;
    
    const categories = ['Geral', ...AppState.getCategories()];
    
    tabsContainer.innerHTML = '';
    
    const icons = {
      'Geral': '📊',
      'Atividade': '💪',
      'Experiencia': '⭐',
      'Bonus': '🎁',
      'Maturidade': '🌱',
      'Evento': '🎉'
    };
    
    categories.forEach(category => {
      const tab = document.createElement('button');
      tab.className = 'tab';
      tab.dataset.category = category;
      tab.setAttribute('role', 'tab');
      tab.textContent = `${icons[category] || '📌'} ${category}`;
      
      if (category === AppState.currentCategory) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.setAttribute('aria-selected', 'false');
      }
      
      tab.onclick = () => {
        AppState.currentCategory = category;
        this.render();
      };
      
      tabsContainer.appendChild(tab);
    });
  },
  
  /**
   * Renderiza a tabela baseada na categoria atual
   */
  renderTable() {
    const header = document.getElementById('tableHeader');
    const body = document.getElementById('tableBody');
    if (!header || !body) return;
    
    if (AppState.currentCategory === 'Geral') {
      this.renderGeneralTable(header, body);
    } else {
      this.renderCategoryTable(header, body);
    }
  },
  
  /**
   * Renderiza tabela geral com todas as categorias
   */
  renderGeneralTable(header, body) {
    const users = Object.keys(AppState.userScores);
    const categories = AppState.getCategories();
    
    // Cabeçalho
    let headerHTML = '<th scope="col">Usuário</th>';
    categories.forEach(cat => {
      headerHTML += `<th scope="col">${cat}`;
      if (AppState.isLoggedIn) {
        headerHTML += ` <button class="btn-delete" onclick="DataManager.deleteCategory('${this.escapeHtml(cat)}')" title="Remover categoria">✕</button>`;
      }
      headerHTML += '</th>';
    });
    headerHTML += '<th scope="col" style="background: var(--accent);">Total</th>';
    
    if (AppState.isLoggedIn) {
      headerHTML += '<th scope="col">Ações</th>';
    }
    
    header.innerHTML = headerHTML;
    
    // Corpo
    body.innerHTML = '';
    users.forEach(userName => {
      const row = document.createElement('tr');
      const userData = AppState.userScores[userName];
      
      let rowHTML = `<td><strong>${this.escapeHtml(userName)}</strong></td>`;
      
      categories.forEach(cat => {
        const value = (typeof userData === 'object' ? userData[cat] : 0) || 0;
        rowHTML += `<td>`;
        if (AppState.isLoggedIn) {
          rowHTML += `<span class="score-display" onclick="TableManager.editScore('${this.escapeHtml(userName)}', '${this.escapeHtml(cat)}')" tabindex="0" role="button" title="Clique para editar">${value}</span>`;
        } else {
          rowHTML += `<span class="score-display-readonly">${value}</span>`;
        }
        rowHTML += `</td>`;
      });
      
      const total = AppState.getTotalPoints(userName);
      rowHTML += `<td style="background: var(--border); font-weight: bold;">${total}</td>`;
      
      if (AppState.isLoggedIn) {
        rowHTML += `<td><button class="btn btn-danger btn-sm" onclick="DataManager.deleteUser('${this.escapeHtml(userName)}')">🗑️ Excluir</button></td>`;
      }
      
      row.innerHTML = rowHTML;
      body.appendChild(row);
    });
  },
  
  /**
   * Renderiza tabela de categoria específica
   */
  renderCategoryTable(header, body) {
    const users = Object.keys(AppState.userScores);
    const category = AppState.currentCategory;
    
    // Cabeçalho
    let headerHTML = '<th scope="col">Usuário</th>';
    headerHTML += `<th scope="col">${category}</th>`;
    
    if (AppState.isLoggedIn) {
      headerHTML += '<th scope="col">Ações</th>';
    }
    
    header.innerHTML = headerHTML;
    
    // Corpo
    body.innerHTML = '';
    users.forEach(userName => {
      const row = document.createElement('tr');
      const userData = AppState.userScores[userName];
      const value = (typeof userData === 'object' ? userData[category] : 0) || 0;
      
      let rowHTML = `<td><strong>${this.escapeHtml(userName)}</strong></td>`;
      rowHTML += `<td>`;
      
      if (AppState.isLoggedIn) {
        rowHTML += `
          <div class="score-cell">
            <span class="score-display" onclick="TableManager.editScore('${this.escapeHtml(userName)}', '${this.escapeHtml(category)}')" tabindex="0" role="button" title="Clique para editar">${value}</span>
            <div class="score-buttons">
              <button class="btn btn-success btn-sm" onclick="DataManager.changeScore('${this.escapeHtml(userName)}', '${this.escapeHtml(category)}', 1)">+1</button>
              <button class="btn btn-danger btn-sm" onclick="DataManager.changeScore('${this.escapeHtml(userName)}', '${this.escapeHtml(category)}', -1)">-1</button>
            </div>
          </div>
        `;
      } else {
        rowHTML += `<span class="score-display-readonly">${value}</span>`;
      }
      
      rowHTML += `</td>`;
      
      if (AppState.isLoggedIn) {
        rowHTML += `<td><button class="btn btn-danger btn-sm" onclick="DataManager.deleteUser('${this.escapeHtml(userName)}')">🗑️ Excluir</button></td>`;
      }
      
      row.innerHTML = rowHTML;
      body.appendChild(row);
    });
  },
  
  /**
   * Edita pontuação inline
   */
  editScore(userName, category) {
    if (!AppState.isLoggedIn) return;
    
    const userData = AppState.userScores[userName];
    const currentScore = (typeof userData === 'object' ? userData[category] : 0) || 0;
    
    const newValue = prompt(`Editar pontuação de ${userName} em ${category}:`, currentScore);
    
    if (newValue !== null) {
      const parsed = parseInt(newValue);
      if (!isNaN(parsed)) {
        if (typeof userData === 'object') {
          userData[category] = parsed;
        } else {
          AppState.userScores[userName] = { [category]: parsed };
        }
        AppState.saveScores();
        this.render();
        ToastManager.show(CONFIG.MESSAGES.SCORE_UPDATED, 'success');
      }
    }
  },
  
  /**
   * Escapa HTML para prevenir XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
};

// ================================================================
// 💾 GERENCIADOR DE DADOS
// ================================================================

const DataManager = {
  /**
   * Carrega dados do arquivo JSON
   */
  async loadFromFile() {
    try {
      const response = await fetch('dados.json', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados.json');
      }
      
      const data = await response.json();
      
      // Migração de formato antigo para novo
      const migrated = this.migrateData(data);
      AppState.userScores = migrated;
      
      // Salva cópia de backup
      localStorage.setItem(CONFIG.STORAGE_KEYS.DEFAULT_DATA, JSON.stringify(migrated));
      
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      
      if (AppState.loadScores()) {
        ToastManager.show('Dados carregados do cache', 'warning');
        return true;
      }
      
      // Fallback
      AppState.userScores = this.getDefaultData();
      ToastManager.show('Usando dados de exemplo', 'warning');
      return false;
    }
  },
  
  /**
   * Migra dados do formato antigo (número) para novo (objeto)
   */
  migrateData(data) {
    const migrated = {};
    
    Object.entries(data).forEach(([userName, value]) => {
      if (typeof value === 'object') {
        // Já está no formato novo
        migrated[userName] = value;
      } else {
        // Formato antigo: converte número para objeto
        migrated[userName] = {
          'Atividade': value,
          'Experiencia': 0,
          'Bonus': 0,
          'Maturidade': 0,
          'Evento': 0
        };
      }
    });
    
    return migrated;
  },
  
  /**
   * Retorna dados padrão
   */
  getDefaultData() {
    return {
      'Alice': {
        'Atividade': 15,
        'Experiencia': 20,
        'Bonus': 5,
        'Maturidade': 10,
        'Evento': 8
      },
      'Bob': {
        'Atividade': -10,
        'Experiencia': 15,
        'Bonus': -5,
        'Maturidade': 8,
        'Evento': 2
      },
      'Charlie': {
        'Atividade': 5,
        'Experiencia': 12,
        'Bonus': 3,
        'Maturidade': 7,
        'Evento': 6
      }
    };
  },
  
  /**
   * Adiciona novo usuário
   */
  addUser() {
    const input = document.getElementById('newUserName');
    if (!input) return;
    
    const name = input.value.trim();
    
    if (!name) {
      ToastManager.show(CONFIG.MESSAGES.INVALID_NAME, 'error');
      return;
    }
    
    if (AppState.userScores.hasOwnProperty(name)) {
      ToastManager.show(CONFIG.MESSAGES.USER_EXISTS, 'error');
      return;
    }
    
    // Adiciona usuário com todas as categorias zeradas
    const categories = AppState.getCategories();
    AppState.userScores[name] = {};
    categories.forEach(cat => {
      AppState.userScores[name][cat] = 0;
    });
    
    AppState.saveScores();
    input.value = '';
    TableManager.render();
    ToastManager.show(CONFIG.MESSAGES.USER_ADDED, 'success');
  },
  
  /**
   * Remove usuário
   */
  deleteUser(userName) {
    if (!confirm(`Tem certeza que deseja remover "${userName}"?`)) {
      return;
    }
    
    delete AppState.userScores[userName];
    AppState.saveScores();
    
    TableManager.render();
    ToastManager.show(CONFIG.MESSAGES.USER_DELETED, 'success');
  },
  
  /**
   * Adiciona nova categoria
   */
  addCategory() {
    const input = document.getElementById('newCategoryName');
    if (!input) return;
    
    const name = input.value.trim();
    
    if (!name) {
      ToastManager.show(CONFIG.MESSAGES.INVALID_NAME, 'error');
      return;
    }
    
    const categories = AppState.getCategories();
    if (categories.includes(name)) {
      ToastManager.show(CONFIG.MESSAGES.CATEGORY_EXISTS, 'error');
      return;
    }
    
    // Adiciona categoria para todos os usuários
    Object.keys(AppState.userScores).forEach(userName => {
      AppState.userScores[userName][name] = 0;
    });
    
    AppState.saveScores();
    input.value = '';
    TableManager.render();
    ToastManager.show(CONFIG.MESSAGES.CATEGORY_ADDED, 'success');
  },
  
  /**
   * Remove categoria
   */
  deleteCategory(categoryName) {
    if (!confirm(`Tem certeza que deseja remover a categoria "${categoryName}"?`)) {
      return;
    }
    
    // Remove categoria de todos os usuários
    Object.keys(AppState.userScores).forEach(userName => {
      delete AppState.userScores[userName][categoryName];
    });
    
    AppState.saveScores();
    
    // Se estava visualizando essa categoria, volta para Geral
    if (AppState.currentCategory === categoryName) {
      AppState.currentCategory = 'Geral';
    }
    
    TableManager.render();
    ToastManager.show(CONFIG.MESSAGES.CATEGORY_DELETED, 'success');
  },
  
  /**
   * Altera pontuação
   */
  changeScore(userName, category, delta) {
    const userData = AppState.userScores[userName];
    if (typeof userData === 'object') {
      userData[category] = (userData[category] || 0) + delta;
      AppState.saveScores();
      TableManager.render();
    }
  },
  
  /**
   * Salva dados no arquivo (download pois é estático)
   */
  saveData() {
    try {
      const dataStr = JSON.stringify(AppState.userScores, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dados.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      ToastManager.show(CONFIG.MESSAGES.DATA_SAVED + ' (Arquivo baixado)', 'success');
      ToastManager.show('Substitua o arquivo dados.json no projeto com o arquivo baixado.', 'info', 5000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      ToastManager.show(CONFIG.MESSAGES.SAVE_ERROR, 'error');
    }
  },
  
  /**
   * Reseta dados para o padrão
   */
  reset() {
    if (!confirm('Tem certeza que deseja resetar todos os dados para o estado inicial?')) {
      return;
    }
    
    const defaultData = localStorage.getItem(CONFIG.STORAGE_KEYS.DEFAULT_DATA);
    
    if (defaultData) {
      try {
        AppState.userScores = JSON.parse(defaultData);
      } catch (e) {
        AppState.userScores = this.getDefaultData();
      }
    } else {
      AppState.userScores = this.getDefaultData();
    }
    
    AppState.saveScores();
    TableManager.render();
    ToastManager.show(CONFIG.MESSAGES.DATA_RESET, 'success');
  },
  
  /**
   * Baixa dados como arquivo JSON
   */
  download() {
    try {
      const dataStr = JSON.stringify(AppState.userScores, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      ToastManager.show(CONFIG.MESSAGES.DOWNLOAD_SUCCESS, 'success');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      ToastManager.show('Erro ao baixar arquivo', 'error');
    }
  }
};

// ================================================================
// 🔐 GERENCIADOR DE AUTENTICAÇÃO
// ================================================================

const AuthManager = {
  /**
   * Mostra modal de login
   */
  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => {
        const userInput = document.getElementById('loginUser');
        if (userInput) userInput.focus();
      }, 100);
    }
  },
  
  /**
   * Esconde modal de login
   */
  hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'none';
      document.getElementById('loginForm').reset();
      document.getElementById('loginError').classList.remove('show');
    }
  },
  
  /**
   * Processa o login
   */
  handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const errorDiv = document.getElementById('loginError');
    
    if (AppState.login(username, password)) {
      this.hideLoginModal();
      UI.updateLoginState();
      ToastManager.show(CONFIG.MESSAGES.LOGIN_SUCCESS, 'success');
    } else {
      errorDiv.textContent = CONFIG.MESSAGES.LOGIN_ERROR;
      errorDiv.classList.add('show');
      
      const modalContent = document.querySelector('.modal-content');
      modalContent.style.animation = 'none';
      setTimeout(() => {
        modalContent.style.animation = 'shake 0.4s, animate-scale 0.3s';
      }, 10);
    }
  },
  
  /**
   * Realiza logout
   */
  logout() {
    if (confirm('Tem certeza que deseja sair do modo de edição?')) {
      AppState.logout();
      UI.updateLoginState();
      ToastManager.show(CONFIG.MESSAGES.LOGOUT_SUCCESS, 'info');
    }
  }
};

// ================================================================
// 🎨 GERENCIADOR DE INTERFACE
// ================================================================

const UI = {
  /**
   * Atualiza interface baseado no estado de login
   */
  updateLoginState() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const toggleCustomBtn = document.getElementById('toggleCustomBtn');
    const tableControls = document.getElementById('tableControls');
    
    if (AppState.isLoggedIn) {
      // Modo de edição
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      if (downloadBtn) downloadBtn.style.display = 'inline-flex';
      if (toggleCustomBtn) toggleCustomBtn.style.display = 'inline-flex';
      if (tableControls) tableControls.style.display = 'flex';
    } else {
      // Modo de visualização
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (downloadBtn) downloadBtn.style.display = 'none';
      if (toggleCustomBtn) toggleCustomBtn.style.display = 'none';
      if (tableControls) tableControls.style.display = 'none';
      
      // Esconde customização se estava aberta
      const customCard = document.getElementById('customizationCard');
      if (customCard) customCard.style.display = 'none';
      AppState.customizationVisible = false;
    }
    
    TableManager.render();
  },
  
  /**
   * Alterna visibilidade da customização
   */
  toggleCustomization() {
    const customCard = document.getElementById('customizationCard');
    if (!customCard) return;
    
    AppState.customizationVisible = !AppState.customizationVisible;
    customCard.style.display = AppState.customizationVisible ? 'block' : 'none';
  }
};

// ================================================================
// 🚀 APLICAÇÃO PRINCIPAL
// ================================================================

const App = {
  /**
   * Inicializa a aplicação
   */
  async init() {
    console.log('🚀 Iniciando aplicação...');
    
    // Inicializa estado
    AppState.init();
    
    // Carrega dados
    await DataManager.loadFromFile();
    
    // Se há dados salvos localmente, usa eles
    AppState.loadScores();
    
    // Renderiza tema
    ThemeManager.renderPalette();
    const savedTheme = AppState.loadTheme();
    if (savedTheme) {
      ThemeManager.applyVars(savedTheme.vars);
      ThemeManager.updatePaletteUI();
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      ThemeManager.applyTheme(prefersDark ? 'Dark Classic' : 'Default');
    }
    
    // Renderiza tabela (modo visualização)
    TableManager.render();
    UI.updateLoginState();
    
    // Configura event listeners
    this.setupEventListeners();
    
    console.log('✅ Aplicação inicializada em modo visualização!');
  },
  
  /**
   * Configura todos os event listeners
   */
  setupEventListeners() {
    // Botão de login
    const loginBtn = document.getElementById('loginBtn');
    loginBtn?.addEventListener('click', () => AuthManager.showLoginModal());
    
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', (e) => AuthManager.handleLogin(e));
    
    // Botão cancelar login
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    cancelLoginBtn?.addEventListener('click', () => AuthManager.hideLoginModal());
    
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', () => AuthManager.logout());
    
    // Botão de customização
    const toggleCustomBtn = document.getElementById('toggleCustomBtn');
    toggleCustomBtn?.addEventListener('click', () => UI.toggleCustomization());
    
    // Botões de tema
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    toggleThemeBtn?.addEventListener('click', () => ThemeManager.toggle());
    
    const resetThemeBtn = document.getElementById('resetThemeBtn');
    resetThemeBtn?.addEventListener('click', () => ThemeManager.reset());
    
    // Botões de dados
    const addUserBtn = document.getElementById('addUserBtn');
    addUserBtn?.addEventListener('click', () => DataManager.addUser());
    
    const newUserInput = document.getElementById('newUserName');
    newUserInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') DataManager.addUser();
    });
    
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    addCategoryBtn?.addEventListener('click', () => DataManager.addCategory());
    
    const newCategoryInput = document.getElementById('newCategoryName');
    newCategoryInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') DataManager.addCategory();
    });
    
    const saveDataBtn = document.getElementById('saveDataBtn');
    saveDataBtn?.addEventListener('click', () => DataManager.saveData());
    
    const resetDataBtn = document.getElementById('resetDataBtn');
    resetDataBtn?.addEventListener('click', () => DataManager.reset());
    
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn?.addEventListener('click', () => DataManager.download());
    
    // Fechar modal ao clicar fora
    const loginModal = document.getElementById('loginModal');
    loginModal?.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        AuthManager.hideLoginModal();
      }
    });
  }
};

// ================================================================
// 🌐 FUNÇÕES GLOBAIS (para onclick inline)
// ================================================================

window.DataManager = DataManager;
window.TableManager = TableManager;
window.ThemeManager = ThemeManager;
window.AuthManager = AuthManager;

// ================================================================
// 🎬 INICIALIZAÇÃO
// ================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
