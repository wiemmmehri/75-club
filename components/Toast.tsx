"use client";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMsg({ id: Date.now(), text });
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            className="toast"
            role="status"
            initial={{ y: -80, x: "-50%", scale: 0.9 }}
            animate={{ y: 0, x: "-50%", scale: 1 }}
            exit={{ y: -80, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
