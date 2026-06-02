import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts'
import {
  AlertTriangle, Package, TrendingUp, Activity, Search,
  RefreshCw, CheckCircle, AlertCircle, MinusCircle,
  Boxes, FlaskConical, Zap, Heart, Stethoscope,
  ChevronLeft, ChevronRight, Info
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL
const PER_PAGE = 50

const NC = {
  'Abastecido': { color: '#2bab92', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  'Atenção': { color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Crítico': { color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  'Sem CMM': { color: '#64748b', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500' },
  'Sem Giro': { color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  'Inativo': { color: '#94a3b8', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400' }
}

const CC = {
  'Cardíaco': '#0284c7',
  'Arritmia': '#2bab92',
  'Vascular': '#f59e0b',
  'Instrumental': '#8b5cf6',
  'Outros': '#2bab92'
}

const AS = {
  'Crítico': { bg: '#fff1f2', border: '#fecdd3', label: '#ef4444', badge: 'bg-red-100 text-red-700 border-red-200' },
  'Atenção': { bg: '#fffbeb', border: '#fde68a', label: '#d97706', badge: 'bg-amber-100 text-amber-700 border-amber-200' }
}

const KPI = [
  { key: 'total', label: 'TOTAL EM ESTOQUE', sub: 'no estoque geral', icon: Boxes, iconBg: '#e0f2fe', iconColor: '#0284c7', valColor: '#1e293b', info: 'Total de itens cadastrados.' },
  { key: 'criticos', label: 'ALERTAS ATIVOS', sub: 'requerem ação imediata', icon: AlertTriangle, iconBg: '#fee2e2', iconColor: '#ef4444', valColor: '#dc2626', info: 'Itens críticos.' },
  { key: 'atencao', label: 'EM ATENÇÃO', sub: '1 a 3 meses', icon: AlertCircle, iconBg: '#fef3c7', iconColor: '#f59e0b', valColor: '#d97706', info: 'Itens em atenção.' },
  { key: 'abastecidos', label: 'ABASTECIDOS', sub: 'estoque ok', icon: CheckCircle, iconBg: '#d1fae5', iconColor: '#2bab92', valColor: '#2bab92', info: 'Itens ok.' },
  { key: 'inativos', label: 'INATIVOS', sub: 'sem uso', icon: MinusCircle, iconBg: '#f1f5f9', iconColor: '#94a3b8', valColor: '#94a3b8', info: 'Itens inativos.' },
]

function iIcon(d) {
  const u = (d || '').toUpperCase()
  if (/VALVULA|ENXERTO/.test(u)) return <Heart size={13} color="#0284c7" />
  if (/MARCA.PASSO|CDI/.test(u)) return <Zap size={13} color="#2bab92" />
  if (/STENT|CATETER/.test(u)) return <Activity size={13} color="#f59e0b" />
  return <Stethoscope size={13} color="#94a3b8" />
}

function Badge({ nivel }) {
  const c = NC[nivel] || NC['Sem CMM']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {nivel}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  async function carregar() {
    setLoading(true)
    setError(null)

    try {
      const [d, i] = await Promise.all([
        fetch(`${API}/api/dashboard`).then(r => r.json()),
        fetch(`${API}/api/itens`).then(r => r.json())
      ])

      if (d.success) setData(d)
      else setError(d.error)

      if (i.success) setItens(i.data)

    } catch (e) {
      setError('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = itens.filter(i =>
    i.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    i.cod?.includes(search)
  )

  const pag = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <div>Carregando...</div>
  if (error) return <div>{error}</div>

  const { kpis = {}, alertas = [], niveis = {}, categorias = {} } = data || {}

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={carregar}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {KPI.map(k => (
          <div key={k.key} className="p-4 bg-white rounded-xl">
            <p>{k.label}</p>
            <p className="text-2xl font-bold">{kpis[k.key] || 0}</p>
          </div>
        ))}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar..."
        className="border p-2 rounded"
      />

      <table className="w-full">
        <thead>
          <tr>
            <th>COD</th>
            <th>DESCRIÇÃO</th>
            <th>ESTOQUE</th>
            <th>CMM</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {pag.map((i, idx) => (
            <tr key={idx}>
              <td>{i.cod}</td>
              <td>{i.descricao}</td>
              <td>{i.estoque}</td>
              <td>{i.cmm}</td>
              <td><Badge nivel={i.nivel} /></td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}