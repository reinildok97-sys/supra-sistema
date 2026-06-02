import { useEffect, useState } from 'react'
import { Plus,RefreshCw,AlertTriangle,CheckCircle,Clock,XCircle,ClipboardList,Calendar,X,Save,Edit2,Trash2,Package } from 'lucide-react'

const API='/api', KEY='supra_solicitacoes'
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
const persist=(d)=>localStorage.setItem(KEY,JSON.stringify(d))

const SC={ 'Pendente':{bg:'bg-amber-50',text:'text-amber-700',border:'border-amber-200'}, 'Parcial':{bg:'bg-orange-50',text:'text-orange-700',border:'border-orange-200'}, 'Entregue':{bg:'bg-emerald-50',text:'text-emerald-700',border:'border-emerald-200'}, 'Cancelado':{bg:'bg-red-50',text:'text-red-700',border:'border-red-200'}, 'Pendente Empenho':{bg:'bg-violet-50',text:'text-violet-700',border:'border-violet-200'}, 'Faturado':{bg:'bg-emerald-50',text:'text-emerald-700',border:'border-emerald-200'} }
const TC={ 'Venda Direta':{bg:'bg-sky-50',text:'text-sky-700',border:'border-sky-200'}, 'Consignação':{bg:'bg-violet-50',text:'text-violet-700',border:'border-violet-200'} }
const EMPTY={fornecedor:'',material:'',quantidade:'',tipo:'Venda Direta',status:'Pendente',confirmado:false,prazoEntrega:'',dataEntrega:'',dataFaturamento:'',manual:true}

function dias(d){if(!d)return 0;return Math.floor((new Date()-new Date(d))/86400000)}

function alerta(sol){
  if(sol.status==='Cancelado'||sol.status==='Faturado')return null
  if(sol.tipo==='Consignação'&&sol.status==='Pendente Empenho'&&sol.dataEntrega&&dias(sol.dataEntrega)>15)return{cor:'#f97316',msg:'Consignado sem faturamento há +15 dias'}
  if(sol.prazoEntrega&&sol.confirmado&&(sol.status==='Pendente'||sol.status==='Parcial')&&dias(sol.prazoEntrega)>7)return{cor:'#ef4444',msg:'Entrega atrasada há +7 dias'}
  if(!sol.confirmado&&dias(sol.dataSolicitacao)>3&&sol.status==='Pendente')return{cor:'#f59e0b',msg:'Aguardando confirmação há +3 dias'}
  return null
}

export default function Solicitacoes(){
  const [sols,setSols]=useState([]),[itens,setItens]=useState([]),[showForm,setShowForm]=useState(false),[showPrazo,setShowPrazo]=useState(null),[editId,setEditId]=useState(null),[form,setForm]=useState(EMPTY),[prazoTemp,setPrazoTemp]=useState(''),[search,setSearch]=useState(''),[filtroStatus,setFiltroStatus]=useState('Todos'),[selectedQtd,setSelectedQtd]=useState({})

  useEffect(()=>{
    setSols(load())
    fetch(`${API}/itens`).then(r=>r.json()).then(res=>{if(res.success)setItens(res.data)})
  },[])

  function salvar(l){persist(l);setSols(l)}

  // Itens do SUPRA que precisam reposição
  const itensRepor=itens.filter(i=>i.nivel==='Crítico'||i.nivel==='Atenção')

  function handleSolicitar(item){
    const qtd=selectedQtd[item.cod]
    if(!qtd||qtd==='none')return alert('Selecione a quantidade (Empenho ou C/Pico)')
    const quantidade=qtd==='empenho'?item.qtdEmpenho:item.qtdEmpenhoPico
    const nova=[...sols,{id:Date.now(),fornecedor:'',material:item.descricao,quantidade,tipo:'Venda Direta',status:'Pendente',confirmado:false,prazoEntrega:'',dataEntrega:'',dataFaturamento:'',dataSolicitacao:new Date().toISOString().split('T')[0],cod:item.cod,nivel:item.nivel,manual:false}]
    salvar(nova)
    setSelectedQtd(p=>({...p,[item.cod]:undefined}))
  }

  function handleSubmit(){
    if(!form.fornecedor||!form.material)return
    let nova
    if(editId!==null){nova=sols.map((s,i)=>i===editId?{...s,...form}:s)}
    else{nova=[...sols,{...form,id:Date.now(),dataSolicitacao:new Date().toISOString().split('T')[0]}]}
    salvar(nova);setShowForm(false);setEditId(null);setForm(EMPTY)
  }

  function toggle(i){salvar(sols.map((s,idx)=>idx===i?{...s,confirmado:!s.confirmado}:s))}
  function savePrazo(){salvar(sols.map((s,i)=>i===showPrazo?{...s,prazoEntrega:prazoTemp}:s));setShowPrazo(null);setPrazoTemp('')}
  function del(i){if(!confirm('Remover?'))return;salvar(sols.filter((_,idx)=>idx!==i))}
  function edit(i){setForm({...sols[i]});setEditId(i);setShowForm(true)}
  function changeStatus(i,st){
    const now=new Date().toISOString().split('T')[0]
    salvar(sols.map((s,idx)=>{if(idx!==i)return s;const u={...s,status:st};if(st==='Entregue'&&s.tipo==='Consignação'){u.status='Pendente Empenho';u.dataEntrega=now}if(st==='Faturado')u.dataFaturamento=now;return u}))
  }

  const filtradas=sols.filter(s=>{
    const ms=search===''||s.fornecedor.toLowerCase().includes(search.toLowerCase())||s.material.toLowerCase().includes(search.toLowerCase())
    const mst=filtroStatus==='Todos'||s.status===filtroStatus
    return ms&&mst
  })

  const pendentes=sols.filter(s=>s.status==='Pendente').length
  const entregues=sols.filter(s=>s.status==='Entregue'||s.status==='Faturado').length
  const atrasadas=sols.filter(s=>alerta(s)?.cor==='#ef4444').length

  return(
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{minHeight:'140px'}}>
        <div className="p-7 relative z-10 max-w-lg">
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-1">Solicitação de reposição por status</p>
          <h1 className="text-4xl font-bold text-slate-800">Solicitações.</h1>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>{setForm(EMPTY);setEditId(null);setShowForm(true)}} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>
              <Plus size={15}/>Nova Solicitação
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-56 overflow-hidden">
          <img src="/valvula.jpg" alt="válvula" className="w-full h-full object-cover opacity-100"/>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[{label:'TOTAL',value:sols.length,sub:'solicitações registradas',icon:ClipboardList,iconBg:'#e0f2fe',iconColor:'#0284c7',valColor:'#1e293b'},{label:'PENDENTES',value:pendentes,sub:'aguardando entrega',icon:Clock,iconBg:'#fef3c7',iconColor:'#f59e0b',valColor:'#d97706'},{label:'ATRASADAS',value:atrasadas,sub:'prazo vencido',icon:AlertTriangle,iconBg:'#fee2e2',iconColor:'#ef4444',valColor:'#dc2626'},{label:'ENTREGUES',value:entregues,sub:'concluídas',icon:CheckCircle,iconBg:'#d1fae5',iconColor:'#2bab92',valColor:'#2bab92'}].map((k,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{k.label}</p><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:k.iconBg}}><k.icon size={18} color={k.iconColor}/></div></div>
            <p className="text-4xl font-bold" style={{color:k.valColor}}>{k.value}</p>
            <p className="text-sm text-slate-400 mt-2">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Lista automática de itens para repor */}
      {itensRepor.length>0&&(
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#fee2e2'}}><Package size={15} color="#ef4444"/></div>
            <div><p className="text-base font-semibold text-slate-700">Itens para Solicitar</p><p className="text-sm text-slate-400">{itensRepor.length} itens críticos e em atenção aguardando solicitação</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">{['DESCRIÇÃO','NÍVEL','ESTOQUE','CMM','QTD EMPENHO','QTD C/PICO','QUANTIDADE',''].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{itensRepor.map((item,i)=>{
                const nc=item.nivel==='Crítico'?{bg:'bg-red-50',text:'text-red-700',border:'border-red-200'}:{bg:'bg-amber-50',text:'text-amber-700',border:'border-amber-200'}
                const temPico=item.qtdEmpenhoPico&&item.qtdEmpenhoPico!=='Sem Alteração'&&item.qtdEmpenhoPico!=='Sem consumo'
                return(
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="py-3 px-3 font-medium text-slate-700 max-w-[200px]"><span className="truncate block" title={item.descricao}>{item.descricao}</span></td>
                    <td className="py-3 px-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${nc.bg} ${nc.text} ${nc.border}`}>{item.nivel}</span></td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.estoque}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.cmm||'—'}</td>
                    <td className="py-3 px-3 text-center">
                      <label className="flex items-center gap-2 cursor-pointer justify-center">
                        <input type="radio" name={`qtd-${item.cod}`} value="empenho" checked={selectedQtd[item.cod]==='empenho'} onChange={()=>setSelectedQtd(p=>({...p,[item.cod]:'empenho'}))} className="accent-sky-600"/>
                        <span className="font-medium text-sky-700">{item.qtdEmpenho||'—'}</span>
                      </label>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {temPico?<label className="flex items-center gap-2 cursor-pointer justify-center">
                        <input type="radio" name={`qtd-${item.cod}`} value="pico" checked={selectedQtd[item.cod]==='pico'} onChange={()=>setSelectedQtd(p=>({...p,[item.cod]:'pico'}))} className="accent-orange-500"/>
                        <span className="font-medium text-orange-600">{item.qtdEmpenhoPico}</span>
                      </label>:<span className="text-xs text-slate-300">Sem pico</span>}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-400">{selectedQtd[item.cod]==='empenho'?item.qtdEmpenho:selectedQtd[item.cod]==='pico'?item.qtdEmpenhoPico:'—'}</td>
                    <td className="py-3 px-3">
                      <button onClick={()=>handleSolicitar(item)} disabled={!selectedQtd[item.cod]} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>
                        Solicitar
                      </button>
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center">
        <input type="text" placeholder="Buscar fornecedor ou material..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 text-slate-600">
          {['Todos','Pendente','Parcial','Entregue','Pendente Empenho','Faturado','Cancelado'].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtradas.length} registros</span>
      </div>

      {/* Modal Form manual */}
      {showForm&&(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5"><h2 className="font-semibold text-slate-800 text-lg">{editId!==null?'Editar':'Nova'} Solicitação</h2><button onClick={()=>setShowForm(false)}><X size={18} className="text-slate-400"/></button></div>
            <div className="space-y-3">
              {[['fornecedor','Fornecedor'],['material','Material']].map(([f,l])=>(
                <div key={f}><label className="block text-xs font-medium text-slate-500 mb-1">{l}</label><input type="text" value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/></div>
              ))}
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label><input type="number" value={form.quantidade} onChange={e=>setForm(p=>({...p,quantidade:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label><select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"><option>Venda Direta</option><option>Consignação</option></select></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Status</label><select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300">{['Pendente','Parcial','Entregue','Pendente Empenho','Faturado','Cancelado'].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}><Save size={14}/>Salvar</button>
              <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prazo */}
      {showPrazo!==null&&(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-slate-800">Prazo de Entrega</h2><button onClick={()=>setShowPrazo(null)}><X size={18} className="text-slate-400"/></button></div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data prevista</label>
            <input type="date" value={prazoTemp} onChange={e=>setPrazoTemp(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4"/>
            <div className="flex gap-2">
              <button onClick={savePrazo} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>Salvar</button>
              <button onClick={()=>setShowPrazo(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela histórico */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['FORNECEDOR','MATERIAL','QTD','TIPO','SOLICITADO','DIAS','CONFIRMADO','PRAZO','STATUS',''].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtradas.length===0?<tr><td colSpan={10} className="text-center py-12 text-slate-400 text-sm">Nenhuma solicitação encontrada.</td></tr>:filtradas.map((sol,i)=>{
                const al=alerta(sol),stC=SC[sol.status]||SC['Pendente'],tC=TC[sol.tipo]||TC['Venda Direta'],d=dias(sol.dataSolicitacao),idx=sols.indexOf(sol)
                return(
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors" style={al?{borderLeft:`3px solid ${al.cor}`,background:`${al.cor}08`}:{}}>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">{sol.fornecedor||<span className="text-slate-300 italic text-xs">Não definido</span>}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-[160px]"><span className="truncate block" title={sol.material}>{sol.material}</span></td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">{sol.quantidade}</td>
                    <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tC.bg} ${tC.text} ${tC.border}`}>{sol.tipo}</span></td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{sol.dataSolicitacao}</td>
                    <td className="py-3 px-4 text-center"><span className={`font-medium ${d>7?'text-red-500':d>3?'text-amber-500':'text-slate-500'}`}>{d}d</span></td>
                    <td className="py-3 px-4 text-center"><button onClick={()=>toggle(idx)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sol.confirmado?'bg-emerald-500':'bg-slate-200'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${sol.confirmado?'translate-x-4':'translate-x-1'}`}/></button></td>
                    <td className="py-3 px-4 text-center">{sol.confirmado?<button onClick={()=>{setShowPrazo(idx);setPrazoTemp(sol.prazoEntrega||'')}} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 whitespace-nowrap"><Calendar size={12}/>{sol.prazoEntrega||'Definir'}</button>:<span className="text-xs text-slate-300">—</span>}</td>
                    <td className="py-3 px-4"><select value={sol.status} onChange={e=>changeStatus(idx,e.target.value)} className={`text-xs font-medium px-2 py-1 rounded-xl border cursor-pointer focus:outline-none ${stC.bg} ${stC.text} ${stC.border}`}>{['Pendente','Parcial','Entregue','Pendente Empenho','Faturado','Cancelado'].map(s=><option key={s}>{s}</option>)}</select></td>
                    <td className="py-3 px-4"><div className="flex gap-1"><button onClick={()=>edit(idx)} className="p-1.5 text-slate-400 hover:text-sky-600"><Edit2 size={13}/></button><button onClick={()=>del(idx)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={13}/></button></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
