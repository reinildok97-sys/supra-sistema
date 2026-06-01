import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Package, Truck, Activity, ClipboardList, FileText } from 'lucide-react'
import Intro from './components/Intro'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import Fornecedores from './pages/Fornecedores'
import Consumo from './pages/Consumo'
import Solicitacoes from './pages/Solicitacoes'
import SAMs from './pages/SAMs'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/consumo', label: 'Consumo', icon: Activity },
  { to: '/solicitacoes', label: 'Solicitações', icon: ClipboardList },
  { to: '/sams', label: 'SAMs', icon: FileText },
]

function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 flex flex-col z-50" style={{boxShadow:'2px 0 10px 0 rgba(0,0,0,0.08)'}}>
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-white font-bold text-sm rounded-xl flex-shrink-0"
            style={{background:'linear-gradient(135deg,#0B81B7,#2BAB92)',width:'44px',height:'44px',minWidth:'44px'}}>
            SP
          </div>
          <div>
            <div className="font-bold text-slate-800 text-base leading-tight">SUPRA</div>
            <div className="text-xs text-slate-400 leading-tight">Sistema de Planej. e Reposição Automática</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to==='/'}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${isActive?'text-white':'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={({ isActive }) => isActive ? { background:'linear-gradient(135deg,#0B81B7,#2BAB92)', boxShadow:'0 4px 12px 0 rgba(43,171,146,0.25)' } : {}}>
            <Icon size={17}/>{label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium">Hospital Ana Nery</p>
        <p className="text-xs text-slate-300">Salvador · Bahia · 2026</p>
      </div>
    </aside>
  )
}

const pv = { initial:{opacity:0,y:14}, animate:{opacity:1,y:0,transition:{duration:0.28,ease:'easeOut'}}, exit:{opacity:0,y:-8,transition:{duration:0.18}} }

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div {...pv}><Dashboard/></motion.div>}/>
        <Route path="/estoque" element={<motion.div {...pv}><Estoque/></motion.div>}/>
        <Route path="/fornecedores" element={<motion.div {...pv}><Fornecedores/></motion.div>}/>
        <Route path="/consumo" element={<motion.div {...pv}><Consumo/></motion.div>}/>
        <Route path="/solicitacoes" element={<motion.div {...pv}><Solicitacoes/></motion.div>}/>
        <Route path="/sams" element={<motion.div {...pv}><SAMs/></motion.div>}/>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [introDone, setIntroDone] = useState(false)
  return (
    <>
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar/>
          <main className="ml-64 flex-1 p-7 min-h-screen"><AnimatedRoutes/></main>
        </div>
      </BrowserRouter>
    </>
  )
}
