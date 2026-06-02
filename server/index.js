const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 FRONTEND (1 LINK FUTURO)
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────
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

// ─── CATEGORIZAÇÃO AUTOMÁTICA ────────────────────────────────────
function categorizarItem(descricao) {
  const d = descricao.toUpperCase();
  if (/VALVULA|VÁLVULA|ENXERTO|ANEL|BIOPROTESE|BIOPROTE|PATCH|CONDUTO|HOMOLOGO/.test(d)) return 'Cardíaco';
  if (/MARCA.PASSO|MARCAPASSO|ELETRODO|DESFIBRILADOR|CDI|RESSINCRONIZADOR|GERADOR/.test(d)) return 'Arritmia';
  if (/STENT|CATETER|BALAO|BALÃO|ENDOPROTESE|FILTRO CAVA|VASCULAR|PTFE|ANGIOPLASTIA|ANGIO/.test(d)) return 'Vascular';
  if (/SERINGA|FIO GUIA|CONECTOR|KIT|CEC|BOMBA|OXIGENADOR|RESERVATORIO|CÂNULA|CANULA/.test(d)) return 'Instrumental';
  return 'Outros';
}