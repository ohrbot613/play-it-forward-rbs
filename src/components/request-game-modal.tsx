"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hand, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n";

interface RequestGameModalProps {
  gameTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, message: string) => void;
}

export function RequestGameModal({ gameTitle, isOpen, onClose, onSubmit }: RequestGameModalProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, message);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setMessage("");
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
          >
            <div className="bg-white rounded-t-3xl p-6 elevation-4">
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="text-base font-semibold">{t("modal.request_sent")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("modal.holder_notified")}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold">{t("modal.request_title")}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {gameTitle}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("modal.your_name")}
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("modal.enter_name")}
                        className="h-12 rounded-2xl bg-background border-0 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("modal.message")}
                      </label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("modal.message_placeholder")}
                        className="rounded-2xl bg-background border-0 text-sm min-h-[80px] resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!name.trim()}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all duration-200 elevation-3 hover:elevation-4 active:scale-[0.98] flex items-center justify-center gap-2.5"
                    >
                      <Hand className="h-5 w-5" />
                      {t("modal.send_request")}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
