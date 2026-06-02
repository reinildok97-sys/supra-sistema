import { useEffect, useState } from 'react'
import { Search, RefreshCw, Package, Heart, Zap, Activity, FlaskConical, Stethoscope } from 'lucide-react'

const API = '/api'

const NIVEL_CONFIG = {
  'Abastecido': { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
  'Atenção':    { bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200'   },
  'Crítico':    { bg:'bg-red-50',     text:'text-red-700',     border:'border-red-200'     },
  'Sem CMM':    { bg:'bg-slate-100',  text:'text-slate-500',   border:'border-slate-200'   },
  'Sem Giro':   { bg:'bg-violet-50',  text:'text-violet-700',  border:'border-violet-200'  },
  'Inativo':    { bg:'bg-slate-50',   text:'text-slate-400',   border:'border-slate-200'   },
}

const PICO_CONFIG = {
  'Pico em Andamento': { bg:'bg-orange-50', text:'text-orange-700', border:'border-orange-200' },
  'Sem Pico':          { bg:'bg-slate-50',  text:'text-slate-400',  border:'border-slate-200'  },
}

function Badge({ label, config }) {
  const cfg = config || { bg:'bg-slate-100', text:'text-slate-500', border:'border-slate-200' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{label}</span>
}

function itemIcon(descricao) {
  const d = (descricao || '').toUpperCase()
  if (/VALVULA|VÁLVULA|ENXERTO|PATCH|CONDUTO/.test(d)) return <Heart size={13} color="#0284c7" />
  if (/MARCA.PASSO|ELETRODO|CDI|GERADOR/.test(d))      return <Zap size={13} color="#2bab92" />
  if (/STENT|CATETER|BALAO|BALÃO|VASCULAR/.test(d))    return <Activity size={13} color="#f59e0b" />
  if (/KIT|CEC|BOMBA|OXIGENADOR/.test(d))              return <FlaskConical size={13} color="#8b5cf6" />
  return <Stethoscope size={13} color="#94a3b8" />
}

export default function Estoque() {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroPico, setFiltroPico] = useState('Todos')

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/itens`).then(r => r.json())
      if (res.success) setItens(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const niveis = ['Todos', 'Abastecido', 'Atenção', 'Crítico', 'Sem CMM', 'Sem Giro', 'Inativo']
  const categorias = ['Todas', ...new Set(itens.map(i => i.categoria))]
  const picos = ['Todos', 'Pico em Andamento', 'Sem Pico']

  const filtrados = itens.filter(i => {
    const matchSearch = search === '' || i.descricao.toLowerCase().includes(search.toLowerCase()) || i.cod.includes(search)
    const matchNivel = filtroNivel === 'Todos' || i.nivel === filtroNivel
    const matchCat = filtroCategoria === 'Todas' || i.categoria === filtroCategoria
    const matchPico = filtroPico === 'Todos' || i.flagPico === filtroPico
    return matchSearch && matchNivel && matchCat && matchPico
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Estoque OPME</h1>
          <p className="text-slate-400 text-sm mt-1">Gerenciamento completo do estoque de materiais</p>
        </div>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 transition-colors border border-slate-200 rounded-xl px-3 py-2">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar item, código..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 w-full" />
          </div>
          {[{val:filtroNivel, set:setFiltroNivel, opts:niveis}, {val:filtroCategoria, set:setFiltroCategoria, opts:categorias}, {val:filtroPico, set:setFiltroPico, opts:picos}].map((f,i) => (
            <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 text-slate-600">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          <span className="text-sm text-slate-400 ml-auto">{filtrados.length} itens</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin" size={24} color="#0284c7" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['','CÓDIGO','DESCRIÇÃO','CATEGORIA','ESTOQUE','GERAL','CMM','COBERTURA','EMPENHO','PICO','STATUS'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4"><div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">{itemIcon(item.descricao)}</div></td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">{item.cod}</td>
                    <td className="py-3 px-4 font-medium text-slate-700"><span className="truncate block max-w-[200px]" title={item.descricao}>{item.descricao}</span></td>
                    <td className="py-3 px-4"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.categoria}</span></td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">{item.estoque}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{item.geral}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{item.cmm || '—'}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{item.coberturaAtual ? `${item.coberturaAtual}m` : '—'}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs">{item.qtdEmpenho ?? '—'}</td>
                    <td className="py-3 px-4"><Badge label={item.flagPico === 'Pico em Andamento' ? '🔺 Pico' : 'Normal'} config={PICO_CONFIG[item.flagPico]} /></td>
                    <td className="py-3 px-4"><Badge label={item.nivel} config={NIVEL_CONFIG[item.nivel]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
