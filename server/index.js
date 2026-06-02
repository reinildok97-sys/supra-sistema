const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 PORTA (Render)
const PORT = process.env.PORT || 3001;

/* ───────────────────────────────────────────────
   HEALTHCHECK
─────────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({ status: "SUPRA API ONLINE" });
});

/* ───────────────────────────────────────────────
   CONFIGURAÇÃO
─────────────────────────────────────────────── */
const CONFIG_FILE = path.join(__dirname, 'config.json');

function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      excelPath: path.join(__dirname, 'data/SUPRA - Sistema de Planejamento e Reposição.xlsm')
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

/* ───────────────────────────────────────────────
   CATEGORIZAÇÃO
─────────────────────────────────────────────── */
function categorizarItem(descricao) {
  const d = String(descricao || '').toUpperCase();

  if (/VALVULA|VÁLVULA|ENXERTO|ANEL|BIOPROTESE|BIOPROTE|PATCH|CONDUTO|HOMOLOGO/.test(d)) return 'Cardíaco';
  if (/MARCA.PASSO|MARCAPASSO|ELETRODO|DESFIBRILADOR|CDI|RESSINCRONIZADOR|GERADOR/.test(d)) return 'Arritmia';
  if (/STENT|CATETER|BALAO|BALÃO|ENDOPROTESE|FILTRO CAVA|VASCULAR|PTFE|ANGIOPLASTIA|ANGIO/.test(d)) return 'Vascular';
  if (/SERINGA|FIO GUIA|CONECTOR|KIT|CEC|BOMBA|OXIGENADOR|RESERVATORIO|CÂNULA|CANULA/.test(d)) return 'Instrumental';

  return 'Outros';
}

/* ───────────────────────────────────────────────
   LEITURA EXCEL
─────────────────────────────────────────────── */
function lerExcel() {
  const filePath = getConfig().excelPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true });

  const sheetName =
    workbook.SheetNames.find(n => n.toUpperCase().includes('SUPRA')) ||
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const normalizado = raw.map(row => {
    const n = {};
    Object.keys(row).forEach(k => (n[k.trim()] = row[k]));
    return n;
  });

  return normalizado.map(row => {
    const descricao = String(row['DESCRIÇÃO'] || row['DESCRICAO'] || '');

    return {
      cod: String(row['COD'] || ''),
      descricao,
      estoque: Number(row['ESTOQUE']) || 0,
      geral: Number(row['GERAL']) || 0,
      farmacia: Number(row['FARMÁCIA'] || row['FARMACIA']) || 0,
      cmm: Number(row['CMM']) || 0,
      valorMedio: Number(row['VALOR MÉDIO'] || row['VALOR MEDIO']) || 0,
      valorUltima: Number(row['VALOR ULTIMA ENTRADA']) || 0,
      qtdMesAtual: Number(row['QTD. MES_ATUAL']) || 0,
      coberturaAtual: Number(row['COBERTURA ATUAL']) || 0,
      estoqueAlvo: Number(row['ESTOQUE ALVO']) || 0,
      nivel: String(row['NÍVEL DO ESTOQUE'] || row['NIVEL DO ESTOQUE'] || ''),
      flagPico: String(row['FLAG DE PICO'] || 'Sem Pico'),
      categoria: categorizarItem(descricao)
    };
  }).filter(i => i.cod && i.descricao);
}

/* ───────────────────────────────────────────────
   ROTAS API
─────────────────────────────────────────────── */

app.get('/api', (req, res) => {
  res.json({ status: "API rodando OK" });
});

app.get('/api/itens', (req, res) => {
  try {
    const itens = lerExcel();
    res.json({ success: true, total: itens.length, data: itens });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/dashboard', (req, res) => {
  try {
    const itens = lerExcel();

    res.json({
      success: true,
      total: itens.length,
      criticos: itens.filter(i => i.nivel === 'Crítico').length,
      atencao: itens.filter(i => i.nivel === 'Atenção').length,
      abastecidos: itens.filter(i => i.nivel === 'Abastecido').length,
      inativos: itens.filter(i => i.nivel === 'Inativo').length
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ───────────────────────────────────────────────
   START SERVER
─────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`🔥 SUPRA rodando em http://localhost:${PORT}`);
});