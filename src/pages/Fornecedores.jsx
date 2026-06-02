import { useEffect, useState } from 'react'
import { Plus, Star, Phone, Mail, Building2, Trash2, Edit2, Save, X } from 'lucide-react'

const API = '/api'

const STATUS_CONFIG = {
  'Ativo':     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  'Inativo':   { bg: 'bg-slate-100', text: 'text-slate-500',  border: 'border-slate-200' },
  'Pendente':  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

const CATEGORIAS = ['Cardíaco', 'Arritmia', 'Vascular', 'Instrumental', 'Outros']

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange && onChange(n)} className="focus:outline-none">
          <Star size={16} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
        </button>
      ))}
    </div>
  )
}

const EMPTY = { nome: '', cnpj: '', representante: '', telefone: '', email: '', categoria: 'Cardíaco', status: 'Ativo', estrelas: 3 }

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')

  async function carregar() {
    const res = await fetch(`${API}/fornecedores`).then(r => r.json())
    if (res.success) setFornecedores(res.data)
  }

  async function salvar(lista) {
    await fetch(`${API}/fornecedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    })
    setFornecedores(lista)
  }

  useEffect(() => { carregar() }, [])

  function handleSubmit() {
    if (!form.nome) return
    let nova
    if (editId !== null) {
      nova = fornecedores.map((f, i) => i === editId ? { ...form } : f)
    } else {
      nova = [...fornecedores, { ...form, id: Date.now() }]
    }
    salvar(nova)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
  }

  function handleEdit(i) {
    setForm({ ...fornecedores[i] })
    setEditId(i)
    setShowForm(true)
  }

  function handleDelete(i) {
    if (!confirm('Remover este fornecedor?')) return
    const nova = fornecedores.filter((_, idx) => idx !== i)
    salvar(nova)
  }

  const filtrados = fornecedores.filter(f =>
    search === '' ||
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestão de fornecedores OPME</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-2 btn-primary text-sm">
          <Plus size={15} />
          Novo Fornecedor
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <input type="text" placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">{editId !== null ? 'Editar' : 'Novo'} Fornecedor</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                ['nome', 'Nome / Razão Social', 'text'],
                ['cnpj', 'CNPJ', 'text'],
                ['representante', 'Representante', 'text'],
                ['telefone', 'Telefone / WhatsApp', 'tel'],
                ['email', 'E-mail', 'email'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type={type} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                  <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300">
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300">
                    {['Ativo','Inativo','Pendente'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Avaliação</label>
                <StarRating value={form.estrelas} onChange={v => setForm(p => ({ ...p, estrelas: v }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSubmit} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Save size={14} /> Salvar
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Building2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{fornecedores.length === 0 ? 'Nenhum fornecedor cadastrado ainda.' : 'Nenhum resultado encontrado.'}</p>
          {fornecedores.length === 0 && (
            <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="mt-3 btn-primary text-sm">Cadastrar primeiro fornecedor</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((f, i) => {
            const stCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG['Ativo']
            return (
              <div key={i} className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Building2 size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm leading-tight">{f.nome}</p>
                      {f.cnpj && <p className="text-xs text-slate-400">{f.cnpj}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stCfg.bg} ${stCfg.text} ${stCfg.border}`}>{f.status}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {f.telefone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={13} className="text-slate-400" />
                      {f.telefone}
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={13} className="text-slate-400" />
                      {f.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{f.categoria}</span>
                  <div className="flex items-center gap-2">
                    <StarRating value={f.estrelas} />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(fornecedores.indexOf(f))} className="p-1 text-slate-400 hover:text-primary-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(fornecedores.indexOf(f))} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
