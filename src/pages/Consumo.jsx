import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Activity, RefreshCw, TrendingUp } from 'lucide-react'

const API = '/api'
const CAT_COLORS = {
  'Cardíaco':     '#0284c7',
  'Arritmia':     '#2bab92',
  'Vascular':     '#f59e0b',
  'Instrumental': '#8b5cf6',
  'Outros':       '#2bab92',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold" style={{color:'#1d4ed8'}}>{label}</p>
      <p className="text-sm" style={{color:'#1d4ed8'}}>Unidades: <span className="font-bold">{payload[0].value}</span></p>
    </div>
  )
  return null
}

export default function Consumo() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/consumo`).then(r => r.json())
      if (res.success) setData(res)
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin" size={28} color="#0284c7" />
    </div>
  )
  if (!data) return null

  const { historico, porCategoria } = data
  const catData = Object.entries(porCategoria).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value)
  const categorias = ['Todas', ...Object.keys(CAT_COLORS)]
  const filtrado = historico.filter(i => filtroCategoria === 'Todas' || i.categoria === filtroCategoria)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Registro de Consumo</h1>
          <p className="text-slate-400 text-sm mt-1">Histórico de consumo e projeções por item</p>
        </div>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 transition-colors border border-slate-200 rounded-xl px-3 py-2">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#e0f2fe'}}>
            <TrendingUp size={15} color="#0284c7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">Consumo por Categoria</p>
            <p className="text-sm text-slate-400">Quantidade consumida no mês atual</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={catData} layout="vertical" margin={{ left:10, right:30, top:20 }}>
            <XAxis type="number" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize:13, fill:'#64748b' }} width={95} axisLine={false} tickLine={false} />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="value" radius={[0,6,6,0]}>
              {catData.map((e,i) => <Cell key={i} fill={CAT_COLORS[e.name] || '#2bab92'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#e0f2fe'}}>
              <Activity size={15} color="#0284c7" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">Histórico Detalhado</p>
              <p className="text-sm text-slate-400">{filtrado.length} itens</p>
            </div>
          </div>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 text-slate-600">
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['CÓDIGO','ITEM','CATEGORIA','CMM','QTD. MÊS','RAZÃO PICO','PICO','CMM PROJETADO','EMPENHO','COBERTURA'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">{item.cod}</td>
                  <td className="py-3 px-4 font-medium text-slate-700 max-w-[180px]"><span className="truncate block" title={item.descricao}>{item.descricao}</span></td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background: (CAT_COLORS[item.categoria]||'#2bab92')+'20', color: CAT_COLORS[item.categoria]||'#2bab92'}}>
                      {item.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{item.cmm || '—'}</td>
                  <td className="py-3 px-4 text-center font-medium" style={{color:'#0284c7'}}>{item.qtdMesAtual || '—'}</td>
                  <td className="py-3 px-4 text-center text-slate-500">{item.razaoPico ? item.razaoPico.toFixed(2) : '—'}</td>
                  <td className="py-3 px-4">
                    {item.flagPico === 'Pico em Andamento'
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">🔺 Pico</span>
                      : <span className="text-xs text-slate-400">Normal</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{item.cmmProjeto || '—'}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    {item.qtdEmpenhoPico && item.qtdEmpenhoPico !== 'Sem Alteração' && item.qtdEmpenhoPico !== 'Sem consumo'
                      ? <span style={{color:'#0284c7'}} className="font-medium">{item.qtdEmpenhoPico}</span>
                      : <span className="text-slate-400">{item.qtdEmpenho ?? '—'}</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">{item.coberturaAtual ? `${item.coberturaAtual}m` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrado.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum dado disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
