const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'config.json');

function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      excelPath: "C:\\Users\\REINILDO\\Desktop\\PROJETOS\\RESSUPRIMENTO ESTOQUE TOTAL\\SUPRA - Sistema de Planejamento e Reposição.xlsm"
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// ─── CATEGORIZAÇÃO AUTOMÁTICA ────────────────────────────────────
function categorizarItem(descricao) {
  const d = descricao.toUpperCase();
  if (/VALVULA|VÁLVULA|ENXERTO|ANEL|BIOPROTESE|BIOPROTE|PATCH|CONDUTO|HOMOLOGO/.test(d)) return 'Cardíaco';
  if (/MARCA.PASSO|MARCAPASSO|ELETRODO|DESFIBRILADOR|CDI|RESSINCRONIZADOR|GERADOR/.test(d)) return 'Arritmia';
  if (/STENT|CATETER|BALAO|BALÃO|ENDOPROTESE|FILTRO CAVA|VASCULAR|PTFE|ANGIOPLASTIA|ANGIO/.test(d)) return 'Vascular';
  if (/SERINGA|FIO GUIA|CONECTOR|KIT|CEC|BOMBA|OXIGENADOR|RESERVATORIO|CÂNULA|CANULA/.test(d)) return 'Instrumental';
  return 'Outros';
}

// ─── LEITURA DO EXCEL ────────────────────────────────────────────
function lerExcel() {
  const config = getConfig();
  const filePath = config.excelPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('SUPRA')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Normaliza nomes de colunas removendo espaços extras
  const normalizado = raw.map(row => {
    const novo = {};
    for (const key of Object.keys(row)) {
      novo[key.trim()] = row[key];
    }
    return novo;
  });

  const itens = normalizado.map(row => {
    const descricao = String(row['DESCRIÇÃO'] || row['DESCRICAO'] || '');
    const cmm = parseFloat(row['CMM']) || 0;
    const estoque = parseFloat(row['ESTOQUE']) || 0;
    const geral = parseFloat(row['GERAL']) || 0;
    const farmacia = parseFloat(row['FARMÁCIA (OU QUARENTENA)'] || row['FARMACIA']) || 0;
    const valorMedio = parseFloat(row['VALOR MÉDIO'] || row['VALOR MEDIO']) || 0;
    const valorUltima = parseFloat(row['VALOR ULTIMA ENTRADA']) || 0;
    const qtdMesAtual = parseFloat(row['QTD. MES_ATUAL']) || 0;
    const coberturaAtual = parseFloat(row['COBERTURA ATUAL']) || 0;
    const estoqueAlvo = parseFloat(row['ESTOQUE ALVO']) || 0;
    const razaoPico = parseFloat(row['RAZÃO DE PICO'] || row['RAZAO DE PICO']) || null;
    const flagPico = String(row['FLAG DE PICO'] || 'Sem Pico');
    const cmmProjeto = parseFloat(row['CMM PROJETO']) || 0;
    const qtdEmpenho = row['QTD. EMPENHO'];
    const qtdEmpenhoPico = row['QTD. EMPENHO C/ PICO'];
    const nivel = String(row['NIVEL DO ESTOQUE'] || row['NÍVEL DO ESTOQUE'] || 'Sem CMM');

    return {
      cod: String(row['COD'] || ''),
      descricao,
      estoque,
      geral,
      farmacia,
      cmm,
      valorMedio,
      valorUltima,
      entrada: row['ENTRADA'] || null,
      meAtual: row['MES_ATUAL'] || null,
      qtdMesAtual,
      coberturaAtual,
      estoqueAlvo,
      razaoPico,
      flagPico,
      cmmProjeto,
      qtdEmpenho,
      qtdEmpenhoPico,
      nivel,
      categoria: categorizarItem(descricao)
    };
  }).filter(item => item.cod && item.cod !== '' && item.descricao !== '');

  return itens;
}

// ─── ROTAS ───────────────────────────────────────────────────────

// Diagnóstico
app.get('/api/diagnostico', (req, res) => {
  try {
    const config = getConfig();
    const filePath = config.excelPath;
    if (!fs.existsSync(filePath)) return res.json({ erro: 'Arquivo não encontrado', caminho: filePath });
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const abas = workbook.SheetNames;
    const sheetName = abas.find(n => n.toUpperCase().includes('SUPRA')) || abas[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: null });
    const normalizado = raw.map(row => { const n = {}; for (const k of Object.keys(row)) n[k.trim()] = row[k]; return n; });
    res.json({ caminho: filePath, abas, abaLida: sheetName, totalLinhas: normalizado.length, colunas: normalizado.length > 0 ? Object.keys(normalizado[0]) : [], primeirasLinhas: normalizado.slice(0, 2) });
  } catch (err) { res.json({ erro: err.message }); }
});

// Todos os itens
app.get('/api/itens', (req, res) => {
  try {
    const itens = lerExcel();
    res.json({ success: true, data: itens, total: itens.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// KPIs do dashboard
app.get('/api/dashboard', (req, res) => {
  try {
    const itens = lerExcel();
    const total = itens.length;
    const criticos = itens.filter(i => i.nivel === 'Crítico').length;
    const atencao = itens.filter(i => i.nivel === 'Atenção').length;
    const semCmm = itens.filter(i => i.nivel === 'Sem CMM').length;
    const abastecidos = itens.filter(i => i.nivel === 'Abastecido').length;
    const semGiro = itens.filter(i => i.nivel === 'Sem Giro').length;
    const inativos = itens.filter(i => i.nivel === 'Inativo').length;
    const picoAtivo = itens.filter(i => i.flagPico === 'Pico em Andamento').length;
    const semPico = itens.filter(i => i.flagPico === 'Sem Pico').length;
    const alertas = itens.filter(i => i.nivel === 'Crítico' || i.estoque === 0).sort((a, b) => a.coberturaAtual - b.coberturaAtual).slice(0, 10);
    const consumoRecente = itens.filter(i => i.qtdMesAtual > 0).sort((a, b) => b.qtdMesAtual - a.qtdMesAtual).slice(0, 8);
    const categorias = {};
    itens.forEach(i => { categorias[i.categoria] = (categorias[i.categoria] || 0) + 1; });
    const niveis = { Abastecido: abastecidos, Atenção: atencao, Crítico: criticos, 'Sem CMM': semCmm, 'Sem Giro': semGiro, Inativo: inativos };
    res.json({ success: true, kpis: { total, criticos, atencao, semCmm, abastecidos, semGiro, inativos, picoAtivo, semPico }, alertas, consumoRecente, categorias, niveis });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Consumo
app.get('/api/consumo', (req, res) => {
  try {
    const itens = lerExcel();
    const comConsumo = itens.filter(i => i.qtdMesAtual > 0 || i.cmm > 0).sort((a, b) => b.qtdMesAtual - a.qtdMesAtual);
    const porCategoria = {};
    comConsumo.forEach(i => { porCategoria[i.categoria] = (porCategoria[i.categoria] || 0) + i.qtdMesAtual; });
    res.json({ success: true, historico: comConsumo, porCategoria });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Fornecedores
const FORNECEDORES_FILE = path.join(__dirname, 'fornecedores.json');
app.get('/api/fornecedores', (req, res) => {
  if (!fs.existsSync(FORNECEDORES_FILE)) return res.json({ success: true, data: [] });
  res.json({ success: true, data: JSON.parse(fs.readFileSync(FORNECEDORES_FILE, 'utf8')) });
});
app.post('/api/fornecedores', (req, res) => {
  fs.writeFileSync(FORNECEDORES_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Config
app.get('/api/config', (req, res) => res.json(getConfig()));
app.post('/api/config', (req, res) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Servir frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SUPRA Server rodando em http://localhost:${PORT}`);
  console.log(`Lendo Excel: ${getConfig().excelPath}`);
});
