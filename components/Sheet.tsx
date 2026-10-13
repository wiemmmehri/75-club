"use client";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";

export default function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%", x: "-50%" }}
            animate={{ y: 0, x: "-50%" }}
            exit={{ y: "100%", x: "-50%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
          >
            <div style={{ padding: "4px 0", touchAction: "none" }} onPointerDown={(e) => controls.start(e)}>
              <div className="grabber" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
