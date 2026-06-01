import { useEffect, useState } from 'react'
import { PieChart,Pie,Cell,Tooltip,ResponsiveContainer,BarChart,Bar,XAxis,YAxis } from 'recharts'
import { AlertTriangle,Package,TrendingUp,Activity,Search,RefreshCw,CheckCircle,AlertCircle,XCircle,MinusCircle,Boxes,FlaskConical,Zap,Heart,Stethoscope,ChevronLeft,ChevronRight,Info } from 'lucide-react'

const API='/api', PER_PAGE=50

const NC={ 'Abastecido':{color:'#2bab92',bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-700'}, 'Atenção':{color:'#f59e0b',bg:'bg-amber-50',border:'border-amber-200',text:'text-amber-700'}, 'Crítico':{color:'#ef4444',bg:'bg-red-50',border:'border-red-200',text:'text-red-700'}, 'Sem CMM':{color:'#64748b',bg:'bg-slate-100',border:'border-slate-200',text:'text-slate-500'}, 'Sem Giro':{color:'#8b5cf6',bg:'bg-violet-50',border:'border-violet-200',text:'text-violet-700'}, 'Inativo':{color:'#94a3b8',bg:'bg-slate-50',border:'border-slate-200',text:'text-slate-400'} }
const CC={ 'Cardíaco':'#0284c7','Arritmia':'#2bab92','Vascular':'#f59e0b','Instrumental':'#8b5cf6','Outros':'#2bab92' }
const AS={ 'Crítico':{bg:'#fff1f2',border:'#fecdd3',label:'#ef4444',badge:'bg-red-100 text-red-700 border-red-200'}, 'Atenção':{bg:'#fffbeb',border:'#fde68a',label:'#d97706',badge:'bg-amber-100 text-amber-700 border-amber-200'} }

const KPI=[
  {key:'total',label:'TOTAL EM ESTOQUE',sub:'no estoque geral',icon:Boxes,iconBg:'#e0f2fe',iconColor:'#0284c7',valColor:'#1e293b',info:'Total de itens cadastrados no estoque OPME. Inclui todos os níveis.'},
  {key:'criticos',label:'ALERTAS ATIVOS',sub:'requerem ação imediata',icon:AlertTriangle,iconBg:'#fee2e2',iconColor:'#ef4444',valColor:'#dc2626',info:'Itens com CMM > 0 e cobertura abaixo de 1 mês. Requerem empenho imediato.'},
  {key:'atencao',label:'EM ATENÇÃO',sub:'cobertura entre 1 e 3 meses',icon:AlertCircle,iconBg:'#fef3c7',iconColor:'#f59e0b',valColor:'#d97706',info:'Itens com cobertura entre 1 e 3 meses. Planejar reposição em breve.'},
  {key:'abastecidos',label:'ABASTECIDOS',sub:'cobertura acima de 3 meses',icon:CheckCircle,iconBg:'#d1fae5',iconColor:'#2bab92',valColor:'#2bab92',info:'Itens com estoque alvo atingido. Cobertura acima de 3 meses.'},
  {key:'semGiro',label:'SEM GIRO',sub:'saldo sem consumo',icon:Package,iconBg:'#ede9fe',iconColor:'#8b5cf6',valColor:'#7c3aed',info:'Itens com saldo mas sem consumo (CMM=0). Risco de vencimento.'},
  {key:'inativos',label:'INATIVOS',sub:'sem saldo e sem consumo',icon:MinusCircle,iconBg:'#f1f5f9',iconColor:'#94a3b8',valColor:'#94a3b8',info:'Itens sem saldo e sem consumo. Avaliar necessidade no cadastro.'},
  {key:'picoAtivo',label:'PICO ATIVO',sub:'consumo 30% acima do CMM',icon:TrendingUp,iconBg:'#ffedd5',iconColor:'#f97316',valColor:'#ea580c',info:'Itens com consumo no mês atual 30% acima do CMM. Quantidade de empenho ajustada automaticamente.'},
  {key:'semCmm',label:'SEM CMM',sub:'sem histórico de consumo',icon:MinusCircle,iconBg:'#f1f5f9',iconColor:'#64748b',valColor:'#64748b',info:'Itens sem consumo médio calculado. Não é possível calcular cobertura automaticamente.'},
]

function iIcon(d){
  const u=(d||'').toUpperCase()
  if(/VALVULA|VÁLVULA|ENXERTO|PATCH|CONDUTO/.test(u)) return <Heart size={13} color="#0284c7"/>
  if(/MARCA.PASSO|ELETRODO|CDI|GERADOR/.test(u)) return <Zap size={13} color="#2bab92"/>
  if(/STENT|CATETER|BALAO|BALÃO|VASCULAR/.test(u)) return <Activity size={13} color="#f59e0b"/>
  if(/KIT|CEC|BOMBA|OXIGENADOR/.test(u)) return <FlaskConical size={13} color="#8b5cf6"/>
  return <Stethoscope size={13} color="#94a3b8"/>
}

function Badge({nivel}){const c=NC[nivel]||NC['Sem CMM'];return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>{nivel}</span>}

function KCard({cfg,value}){
  const Icon=cfg.icon,[si,setSi]=useState(false)
  return(
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">{cfg.label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2" style={{background:cfg.iconBg}}><Icon size={18} color={cfg.iconColor}/></div>
      </div>
      <p className="text-4xl font-bold leading-none" style={{color:cfg.valColor}}>{value}</p>
      <p className="text-sm text-slate-400 mt-2 leading-tight">{cfg.sub}</p>
      <div className="absolute bottom-3 right-3" onMouseEnter={()=>setSi(true)} onMouseLeave={()=>setSi(false)}>
        <Info size={13} color="#cbd5e1"/>
        {si&&<div className="absolute bottom-6 right-0 w-56 bg-slate-800 text-white text-xs rounded-xl p-3 shadow-xl z-50 leading-relaxed">{cfg.info}<div className="absolute bottom-[-5px] right-2 w-2.5 h-2.5 bg-slate-800 rotate-45"/></div>}
      </div>
    </div>
  )
}

const TN=({active,payload})=>active&&payload?.length?<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-sm font-semibold text-slate-800">{payload[0].payload.name}</p><p className="text-sm text-slate-500">{payload[0].value} itens</p></div>:null
const TP=({active,payload,label})=>active&&payload?.length?<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-sm" style={{color:'#1d4ed8'}}>Pico: <span className="font-bold">+{payload[0].value}% acima do CMM</span></p></div>:null
const TR=({active,payload})=>active&&payload?.length?<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-sm font-semibold text-slate-800">{payload[0].name}</p><p className="text-sm text-slate-500">{payload[0].value} itens</p></div>:null

export default function Dashboard(){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null),[search,setSearch]=useState(''),[itens,setItens]=useState([]),[lastUpdate,setLastUpdate]=useState(null),[page,setPage]=useState(1)

  async function carregar(){
    setLoading(true);setError(null)
    try{
      const [d,ir]=await Promise.all([fetch(`${API}/dashboard`).then(r=>r.json()),fetch(`${API}/itens`).then(r=>r.json())])
      if(d.success)setData(d);else setError(d.error)
      if(ir.success)setItens(ir.data)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    }catch(e){setError('Não foi possível conectar ao servidor.')}
    finally{setLoading(false)}
  }

  useEffect(()=>{carregar()},[])

  const iF=itens.filter(i=>i.nivel!=='Abastecido').filter(i=>search===''||i.descricao.toLowerCase().includes(search.toLowerCase())||i.cod.includes(search))
  const tP=Math.ceil(iF.length/PER_PAGE),iP=iF.slice((page-1)*PER_PAGE,page*PER_PAGE)
  const hS=(v)=>{setSearch(v);setPage(1)}

  if(loading) return <div className="flex items-center justify-center h-64"><div className="text-center"><RefreshCw className="animate-spin mx-auto mb-3" size={28} color="#0284c7"/><p className="text-slate-400 text-sm">Carregando dados do SUPRA...</p></div></div>
  if(error) return <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700"><AlertTriangle className="mb-2" size={22}/><p className="font-semibold text-base">Erro ao carregar</p><p className="text-sm mt-1">{error}</p><button onClick={carregar} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">Tentar novamente</button></div>

  const {kpis,alertas,niveis,categorias}=data
  const picoData=itens.filter(i=>i.razaoPico&&i.razaoPico>1).sort((a,b)=>b.razaoPico-a.razaoPico).slice(0,8).map(i=>({name:i.descricao.length>18?i.descricao.slice(0,18)+'…':i.descricao,value:Math.round((i.razaoPico-1)*100)}))
  const nD=Object.entries(niveis).map(([name,value])=>({name,value}))
  const cD=Object.entries(categorias).map(([name,value])=>({name,value}))
  const aF=alertas.filter(i=>i.cmm>0)
  const tot=cD.reduce((a,b)=>a+b.value,0)

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-slate-800">Dashboard</h1><p className="text-slate-400 text-base mt-1">Gestão de suprimentos OPME · {kpis.total} itens{lastUpdate&&<span className="text-slate-300"> · Atualizado às {lastUpdate}</span>}</p></div>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 border border-slate-200 rounded-xl px-3 py-2"><RefreshCw size={13}/>Atualizar</button>
      </div>
      <div className="grid grid-cols-4 gap-4">{KPI.map(c=><KCard key={c.key} cfg={c} value={kpis[c.key]}/>)}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-lg font-semibold text-slate-700">Nível do Estoque</p>
          <p className="text-sm text-slate-400 mt-0.5 mb-5">Distribuição por status de cobertura</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={nD} layout="vertical" margin={{left:8,right:28}}>
              <XAxis type="number" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:12,fill:'#64748b'}} width={85} axisLine={false} tickLine={false}/>
              <Tooltip content={TN}/>
              <Bar dataKey="value" radius={[0,5,5,0]}>{nD.map((e,i)=><Cell key={i} fill={NC[e.name]?.color||'#94a3b8'}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-lg font-semibold text-slate-700">Distribuição por Categoria</p>
          <p className="text-sm text-slate-400 mt-0.5 mb-5">Itens por tipo de insumo OPME</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart><Pie data={cD} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>{cD.map((e,i)=><Cell key={i} fill={CC[e.name]||'#2bab92'}/>)}</Pie><Tooltip content={TR}/></PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">{cD.map((e,i)=><div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:CC[e.name]||'#2bab92'}}/><span className="text-sm text-slate-600 flex-1">{e.name}</span><span className="text-sm text-slate-400">{tot>0?((e.value/tot)*100).toFixed(0):0}%</span></div>)}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#fee2e2'}}><AlertTriangle size={15} color="#ef4444"/></div>
            <div><p className="text-base font-semibold text-slate-700">Alertas Ativos</p><p className="text-sm text-slate-400">Requerem ação imediata</p></div>
            <span className="ml-auto text-sm font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{aF.length}</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {aF.length===0?<p className="text-sm text-slate-400 py-6 text-center">Nenhum alerta crítico.</p>:aF.map((item,i)=>{const st=AS[item.nivel]||AS['Atenção'];return(
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{background:st.bg,borderColor:st.border}}>
                <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">{iIcon(item.descricao)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" style={{color:st.label}}>{item.descricao}</p><p className="text-xs text-slate-500">Estoque: {item.estoque} · CMM: {item.cmm}</p></div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.badge}`}>{item.nivel}</span>
              </div>
            )})}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#ffedd5'}}><TrendingUp size={15} color="#f97316"/></div>
            <div><p className="text-base font-semibold text-slate-700">Pico de Consumo</p><p className="text-sm text-slate-400">% acima do CMM médio no mês atual</p></div>
          </div>
          {picoData.length===0?<p className="text-sm text-slate-400 py-6 text-center">Nenhum pico identificado.</p>:
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={picoData} margin={{left:-20,bottom:50}}>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} interval={0} angle={-35} textAnchor="end" height={65}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} unit="%" domain={[0,'auto']}/>
                <Tooltip content={TP}/>
                <Bar dataKey="value" radius={[4,4,0,0]}>{picoData.map((e,i)=><Cell key={i} fill={e.value>=30?'#f97316':'#0284c7'}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#e0f2fe'}}><Package size={15} color="#0284c7"/></div>
            <div><p className="text-base font-semibold text-slate-700">Itens OPME</p><p className="text-sm text-slate-400">{iF.length} itens que requerem atenção</p></div>
          </div>
          <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Buscar item ou código..." value={search} onChange={e=>hS(e.target.value)} className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 w-56"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">{['','CÓDIGO','DESCRIÇÃO','ESTOQUE','CMM','COBERTURA','STATUS'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>{iP.map((item,i)=>(
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3"><div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">{iIcon(item.descricao)}</div></td>
                <td className="py-3 px-3 font-mono text-xs text-slate-400">{item.cod}</td>
                <td className="py-3 px-3 font-medium text-slate-700"><span className="truncate block max-w-[220px]" title={item.descricao}>{item.descricao}</span></td>
                <td className="py-3 px-3 text-center font-medium text-slate-700">{item.estoque}</td>
                <td className="py-3 px-3 text-center text-slate-500">{item.cmm||'—'}</td>
                <td className="py-3 px-3 text-center text-slate-500">{item.coberturaAtual?`${item.coberturaAtual}m`:'—'}</td>
                <td className="py-3 px-3"><Badge nivel={item.nivel}/></td>
              </tr>
            ))}</tbody>
          </table>
          {iP.length===0&&<p className="text-center text-slate-400 py-8 text-sm">Nenhum item encontrado.</p>}
        </div>
        {tP>1&&<div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-400">Página {page} de {tP} · {iF.length} itens</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={14}/></button>
            {Array.from({length:tP},(_,i)=>i+1).map(n=><button key={n} onClick={()=>setPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page===n?'text-white':'border border-slate-200 text-slate-500 hover:bg-slate-50'}`} style={page===n?{background:'linear-gradient(135deg,#0B81B7,#2BAB92)'}:{}}>{n}</button>)}
            <button onClick={()=>setPage(p=>Math.min(tP,p+1))} disabled={page===tP} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={14}/></button>
          </div>
        </div>}
      </div>
    </div>
  )
}
