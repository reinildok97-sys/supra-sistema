import { useEffect, useState } from 'react'
import { Plus,RefreshCw,AlertTriangle,CheckCircle,Clock,FileText,X,Save,Edit2,Trash2,Link } from 'lucide-react'

const API='/api', KEY='supra_sams', SOLS_KEY='supra_solicitacoes'
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
const persist=(d)=>localStorage.setItem(KEY,JSON.stringify(d))
const loadSols=()=>{try{return JSON.parse(localStorage.getItem(SOLS_KEY)||'[]')}catch{return[]}}
const persistSols=(d)=>localStorage.setItem(SOLS_KEY,JSON.stringify(d))

const SC={ 'Aberto':{bg:'bg-amber-50',text:'text-amber-700',border:'border-amber-200'}, 'Aguardando CHS':{bg:'bg-sky-50',text:'text-sky-700',border:'border-sky-200'}, 'Aprovado':{bg:'bg-violet-50',text:'text-violet-700',border:'border-violet-200'}, 'Empenho Emitido':{bg:'bg-orange-50',text:'text-orange-700',border:'border-orange-200'}, 'Entregue':{bg:'bg-emerald-50',text:'text-emerald-700',border:'border-emerald-200'}, 'Cancelado':{bg:'bg-red-50',text:'text-red-700',border:'border-red-200'} }
const EMPTY={numero:'',ano:new Date().getFullYear(),status:'Aberto',itensSelecionados:[],tipoSAM:'Venda Direta',numeroEmpenho:'',observacao:''}

function dias(d){if(!d)return 0;return Math.floor((new Date()-new Date(d))/86400000)}

export default function SAMs(){
  const [sams,setSams]=useState([]),[sols,setSolsLocal]=useState([]),[showForm,setShowForm]=useState(false),[showEmpenho,setShowEmpenho]=useState(null),[editId,setEditId]=useState(null),[form,setForm]=useState(EMPTY),[empenhoTemp,setEmpenhoTemp]=useState(''),[search,setSearch]=useState(''),[filtroStatus,setFiltroStatus]=useState('Todos'),[selVD,setSelVD]=useState({}),[selCons,setSelCons]=useState({})

  useEffect(()=>{
    setSams(load())
    setSolsLocal(loadSols())
  },[])

  // Recarregar solicitações ao focar
  useEffect(()=>{
    const handler=()=>setSolsLocal(loadSols())
    window.addEventListener('focus',handler)
    return()=>window.removeEventListener('focus',handler)
  },[])

  function salvar(l){persist(l);setSams(l)}

  // Solicitações pendentes por tipo
  const solsVD=sols.filter(s=>s.tipo==='Venda Direta'&&(s.status==='Pendente'||s.status==='Parcial'))
  const solsCons=sols.filter(s=>s.tipo==='Consignação'&&s.status==='Pendente Empenho')

  function handleCriarSAM(tipo,selecao){
    const solsFonte=tipo==='Venda Direta'?solsVD:solsCons
    const itensSelecionados=solsFonte
      .filter(s=>selecao[s.id||s.dataSolicitacao+s.material])
      .map(s=>({material:s.material,quantidade:s.quantidade,fornecedor:s.fornecedor,tipo:s.tipo,solId:s.id}))
    if(itensSelecionados.length===0)return alert('Selecione ao menos uma solicitação')
    setForm({...EMPTY,itensSelecionados,tipoSAM:tipo})
    setShowForm(true)
  }

  function handleSubmit(){
    if(!form.numero)return
    const sam={...form,numeroCompleto:`${form.numero}/${form.ano}`,dataCriacao:editId!==null?sams[editId].dataCriacao:new Date().toISOString().split('T')[0],id:editId!==null?sams[editId].id:Date.now()}
    let nova
    if(editId!==null){nova=sams.map((s,i)=>i===editId?sam:s)}
    else{nova=[...sams,sam]}
    salvar(nova);setShowForm(false);setEditId(null);setForm(EMPTY);setSelVD({});setSelCons({})
  }

  function handleRegistrarEmpenho(){
    if(!empenhoTemp||showEmpenho===null)return
    const sam=sams[showEmpenho]
    salvar(sams.map((s,i)=>i===showEmpenho?{...s,numeroEmpenho:empenhoTemp,status:'Empenho Emitido'}:s))
    const solsAtuais=loadSols()
    const novas=(sam.itensSelecionados||[]).map(item=>({
      id:Date.now()+Math.random(),fornecedor:item.fornecedor||'',material:item.material,quantidade:item.quantidade,
      tipo:item.tipo||'Venda Direta',status:'Pendente',confirmado:false,prazoEntrega:'',dataEntrega:'',dataFaturamento:'',
      dataSolicitacao:new Date().toISOString().split('T')[0],samVinculado:empenhoTemp,manual:false
    }))
    persistSols([...solsAtuais,...novas])
    setShowEmpenho(null);setEmpenhoTemp('')
  }

  function del(i){if(!confirm('Remover este SAMS?'))return;salvar(sams.filter((_,idx)=>idx!==i))}
  function edit(i){setForm({...sams[i]});setEditId(i);setShowForm(true)}

  const filtrados=sams.filter(s=>{
    const ms=search===''||s.numeroCompleto?.includes(search)||s.numeroEmpenho?.includes(search)
    return ms&&(filtroStatus==='Todos'||s.status===filtroStatus)
  })

  const abertos=sams.filter(s=>s.status==='Aberto'||s.status==='Aguardando CHS').length
  const atrasados=sams.filter(s=>(s.status==='Aberto'||s.status==='Aguardando CHS')&&dias(s.dataCriacao)>7).length
  const empenhos=sams.filter(s=>s.status==='Aprovado'||s.status==='Empenho Emitido').length
  const entregues=sams.filter(s=>s.status==='Entregue').length

  function ListaSols({titulo,lista,selecao,setSelecao,tipo,cor}){
    if(lista.length===0)return(
      <div className="mb-6">
        <p className="text-sm font-semibold mb-2" style={{color:cor}}>{titulo}</p>
        <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">Nenhuma solicitação pendente de {tipo==='Venda Direta'?'empenho':'faturamento'}.</p>
      </div>
    )
    return(
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{color:cor}}>{titulo} <span className="text-xs font-normal text-slate-400">({lista.length})</span></p>
          <button onClick={()=>handleCriarSAM(tipo,selecao)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>
            <Plus size={12}/>Criar SAMS com Selecionados
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">{['','MATERIAL','FORNECEDOR','QTD','SOLICITADO','DIAS'].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{lista.map((sol,i)=>{
              const key=sol.id||sol.dataSolicitacao+sol.material
              const d=dias(sol.dataSolicitacao)
              return(
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/40">
                  <td className="py-2.5 px-3"><input type="checkbox" checked={!!selecao[key]} onChange={e=>setSelecao(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-sky-600 cursor-pointer"/></td>
                  <td className="py-2.5 px-3 font-medium text-slate-700 max-w-[200px]"><span className="truncate block" title={sol.material}>{sol.material}</span></td>
                  <td className="py-2.5 px-3 text-slate-500">{sol.fornecedor||<span className="text-slate-300 italic text-xs">Não definido</span>}</td>
                  <td className="py-2.5 px-3 text-center font-medium text-sky-700">{sol.quantidade}</td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-xs">{sol.dataSolicitacao}</td>
                  <td className="py-2.5 px-3 text-center"><span className={`font-medium text-xs ${d>7?'text-red-500':d>3?'text-amber-500':'text-slate-500'}`}>{d}d</span></td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </div>
    )
  }

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-slate-800">SAMs</h1><p className="text-slate-400 text-base mt-1">Solicitações de Aquisição de Material ou Serviço</p></div>
        <button onClick={()=>{setForm(EMPTY);setEditId(null);setShowForm(true)}} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>
          <Plus size={15}/>Novo SAMS
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{label:'TOTAL ABERTOS',value:abertos,sub:'aguardando aprovação',icon:Clock,iconBg:'#fef3c7',iconColor:'#f59e0b',valColor:'#d97706'},{label:'AGUARD. +7 DIAS',value:atrasados,sub:'sem aprovação do CHS',icon:AlertTriangle,iconBg:'#fee2e2',iconColor:'#ef4444',valColor:'#dc2626'},{label:'EMPENHOS EMITIDOS',value:empenhos,sub:'em andamento',icon:FileText,iconBg:'#ede9fe',iconColor:'#8b5cf6',valColor:'#7c3aed'},{label:'ENTREGUES',value:entregues,sub:'concluídos',icon:CheckCircle,iconBg:'#d1fae5',iconColor:'#2bab92',valColor:'#2bab92'}].map((k,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">{k.label}</p><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:k.iconBg}}><k.icon size={18} color={k.iconColor}/></div></div>
            <p className="text-4xl font-bold" style={{color:k.valColor}}>{k.value}</p>
            <p className="text-sm text-slate-400 mt-2">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Duas listas separadas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <p className="text-base font-semibold text-slate-700 mb-5">Solicitações Pendentes de SAMS</p>
        <ListaSols titulo="Venda Direta — Aguardando Empenho para Compra" lista={solsVD} selecao={selVD} setSelecao={setSelVD} tipo="Venda Direta" cor="#0284c7"/>
        <div className="border-t border-slate-100 pt-5">
          <ListaSols titulo="Consignação — Aguardando Empenho para Faturamento" lista={solsCons} selecao={selCons} setSelecao={setSelCons} tipo="Consignação" cor="#8b5cf6"/>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center">
        <input type="text" placeholder="Buscar nº SAMS ou empenho..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none text-slate-600">
          {['Todos','Aberto','Aguardando CHS','Aprovado','Empenho Emitido','Entregue','Cancelado'].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtrados.length} SAMS</span>
      </div>

      {/* Modal Form */}
      {showForm&&(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="font-semibold text-slate-800 text-lg">{editId!==null?'Editar':'Novo'} SAMS — {form.tipoSAM}</h2><button onClick={()=>setShowForm(false)}><X size={18} className="text-slate-400"/></button></div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Nº SAMS</label><input type="text" placeholder="1517" value={form.numero} onChange={e=>setForm(p=>({...p,numero:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Ano</label><input type="number" value={form.ano} onChange={e=>setForm(p=>({...p,ano:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Status</label><select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300">{Object.keys(SC).map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="col-span-3"><label className="block text-xs font-medium text-slate-500 mb-1">Observação</label><input type="text" value={form.observacao} onChange={e=>setForm(p=>({...p,observacao:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"/></div>
            </div>
            {(form.itensSelecionados||[]).length>0&&(
              <div className="border border-slate-100 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">{form.itensSelecionados.length} itens selecionados</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.itensSelecionados.map((it,i)=>(
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-700 flex-1 truncate">{it.material}</span>
                      <span className="text-xs font-semibold text-sky-600">Qtd: {it.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}><Save size={14}/>Salvar SAMS</button>
              <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Empenho */}
      {showEmpenho!==null&&(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-slate-800">Registrar Empenho</h2><button onClick={()=>setShowEmpenho(null)}><X size={18} className="text-slate-400"/></button></div>
            <p className="text-xs text-slate-400 mb-1">Nº do Empenho (ex: 2026NE1234)</p>
            <input type="text" placeholder="2026NE1234" value={empenhoTemp} onChange={e=>setEmpenhoTemp(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 mb-2"/>
            <p className="text-xs text-slate-400 mb-4">As solicitações vinculadas serão criadas automaticamente em Solicitações.</p>
            <div className="flex gap-2">
              <button onClick={handleRegistrarEmpenho} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}}>Registrar</button>
              <button onClick={()=>setShowEmpenho(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Nº SAMS','TIPO','DATA','ITENS','Nº EMPENHO','STATUS','DIAS',''].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrados.length===0?<tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Nenhum SAMS encontrado.</td></tr>:filtrados.map((sam,i)=>{
                const d=dias(sam.dataCriacao),atrasado=(sam.status==='Aberto'||sam.status==='Aguardando CHS')&&d>7,stC=SC[sam.status]||SC['Aberto'],idx=sams.indexOf(sam)
                const tipoCor=sam.tipoSAM==='Consignação'?'bg-violet-50 text-violet-700 border-violet-200':'bg-sky-50 text-sky-700 border-sky-200'
                return(
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/40" style={atrasado?{borderLeft:'3px solid #f59e0b',background:'#fef3c708'}:{}}>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{sam.numeroCompleto}</td>
                    <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tipoCor}`}>{sam.tipoSAM||'—'}</span></td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{sam.dataCriacao}</td>
                    <td className="py-3 px-4 text-center"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{(sam.itensSelecionados||[]).length} itens</span></td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {sam.numeroEmpenho?<span className="text-violet-700 font-semibold">{sam.numeroEmpenho}</span>:
                        <button onClick={()=>{setShowEmpenho(idx);setEmpenhoTemp('')}} className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700"><Link size={11}/>Registrar</button>}
                    </td>
                    <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stC.bg} ${stC.text} ${stC.border}`}>{sam.status}</span></td>
                    <td className="py-3 px-4 text-center"><span className={`font-medium text-sm ${atrasado?'text-amber-500':'text-slate-500'}`}>{d}d</span></td>
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
