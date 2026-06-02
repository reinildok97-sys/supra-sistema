# SUPRA — Sistema de Planejamento e Reposição Automática
### Setor de OPME · Hospital Ana Nery · Salvador, Bahia

---

## 📋 Requisitos

- Windows 10 ou superior
- Node.js LTS → baixe em: https://nodejs.org (clique em "LTS")
- O arquivo Excel do SUPRA salvo localmente

---

## 🚀 Primeira instalação

1. Instale o Node.js (se ainda não tiver)
2. Abra a pasta do SUPRA
3. Dê dois cliques em **INSTALAR_E_INICIAR.bat**
4. Aguarde a instalação (pode levar 2-3 minutos na primeira vez)
5. O sistema abrirá automaticamente em http://localhost:3001

---

## ▶️ Usos seguintes (após instalação)

Dê dois cliques em **INICIAR.bat**

---

## ⚙️ Configurar caminho do Excel

Se o Excel estiver em outro computador ou pasta diferente:

1. Abra a pasta **server**
2. Abra o arquivo **config.json** com o Bloco de Notas
3. Altere o caminho do Excel
4. Salve e reinicie o sistema

Exemplo:
```json
{
  "excelPath": "C:\\Users\\SEU_USUARIO\\Desktop\\SUPRA - Sistema de Planejamento e Reposição.xlsm"
}
```

> ⚠️ Use barras duplas \\\\ no caminho

---

## 🌐 Acesso pela equipe

Para que a equipe acesse pelo navegador na rede do hospital:

1. Descubra o IP do computador que roda o SUPRA:
   - Abra o Prompt de Comando (cmd)
   - Digite: `ipconfig`
   - Anote o "Endereço IPv4" (ex: 192.168.1.100)

2. A equipe acessa pelo navegador: `http://192.168.1.100:3001`

---

## 🔄 Atualizar dados

1. No Excel, clique em **Atualizar Tudo** no Power Query
2. Salve o arquivo Excel
3. No site, clique em **Atualizar** no canto superior direito

---

## 📁 Estrutura do projeto

```
SUPRA/
├── INSTALAR_E_INICIAR.bat  ← Primeira instalação
├── INICIAR.bat             ← Usos seguintes
├── server/
│   ├── index.js            ← Servidor
│   ├── config.json         ← Caminho do Excel (gerado automaticamente)
│   └── fornecedores.json   ← Dados dos fornecedores (gerado automaticamente)
└── client/                 ← Interface do sistema
```

---

## 🆘 Problemas comuns

**"Node.js não encontrado"**
→ Instale o Node.js em https://nodejs.org

**"Arquivo não encontrado"**
→ Verifique o caminho do Excel no arquivo config.json

**Equipe não consegue acessar**
→ Verifique se o Firewall do Windows está bloqueando a porta 3001
→ Adicione exceção para a porta 3001 no Firewall

---

Desenvolvido por Reinildo Costa · OPME · Hospital Ana Nery · 2026
