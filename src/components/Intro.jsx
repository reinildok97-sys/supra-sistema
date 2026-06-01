import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('logo')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('expand'), 900)
    const t2 = setTimeout(() => setPhase('done'), 2800)
    const t3 = setTimeout(() => onDone(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
              className="flex items-center justify-center text-white font-bold text-2xl rounded-2xl flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#0B81B7,#2BAB92)', width:'68px', height:'68px', minWidth:'68px', boxShadow:'0 8px 32px rgba(11,129,183,0.3)' }}
            >
              SP
            </motion.div>

            <AnimatePresence>
              {phase === 'expand' && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <motion.p
                    className="text-4xl font-bold text-slate-800 leading-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                  >
                    SUPRA
                  </motion.p>
                  <motion.p
                    className="text-sm text-slate-400 mt-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.35 }}
                  >
                    Sistema de Planejamento e Reposição Automática
                  </motion.p>
                  <motion.div
                    className="h-0.5 mt-3 rounded-full"
                    style={{ background:'linear-gradient(90deg,#0B81B7,#2BAB92)' }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
