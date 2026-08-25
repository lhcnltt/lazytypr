// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

/** The fixed Phase 1 catalogs are locale-ready; selection is intentionally deferred. */
export const phase1Messages = {
  "en-US": {
    "app.control.title": "lazytypr — Tracer test",
    "tracer.heading": "Tracer test",
    "tracer.idle.heading": "Ready for a safe local test",
    "tracer.idle.body": "Use your hotkey or run a test. Results are copied first.",
    "tracer.resultsCopiedFirst": "Results are copied first.",
    "tracer.runSafeTest": "Run Safe Test",
    "tracer.cancel": "Cancel tracer",
    "tracer.closeTest": "Close Tracer Test",
    "tracer.preparing": "Preparing capture",
    "tracer.listening": "Listening",
    "tracer.processing": "Processing",
    "tracer.copying": "Copying",
    "tracer.pasting": "Pasting",
    "tracer.outcome.copied": "Copied",
    "tracer.outcome.pasted": "Pasted",
    "tracer.outcome.copyOnly": "Copied — paste target could not be verified",
    "tracer.busy": "Busy — finish the current tracer first",
    "tracer.cancelled": "Cancelled — nothing was copied",
    "tracer.error.generic": "Couldn’t complete the tracer. Your clipboard was not changed. Try again.",
    "hotkey.ready": "Ready",
    "hotkey.busy": "Busy",
    "hotkey.unavailable": "Hotkey unavailable. Resolve the conflict, then try again.",
    "hotkey.close": "Close Tracer Test",
    "paste.mode.clipboardOnly": "Clipboard-only",
    "paste.mode.autoPaste": "Auto-paste enabled",
    "paste.autoPaste.label": "Auto-paste to verified target",
    "paste.autoPaste.confirmation.heading": "Turn on auto-paste?",
    "paste.autoPaste.confirmation.body": "Lazytypr will paste only after it reactivates and re-verifies the target captured when you start. If verification fails, the result stays copied.",
    "paste.autoPaste.confirmation.confirm": "Turn On Auto-Paste",
    "paste.autoPaste.confirmation.cancel": "Keep Clipboard-Only",
  },
  "pt-BR": {
    "app.control.title": "lazytypr — Teste do rastreador",
    "tracer.heading": "Teste do rastreador",
    "tracer.idle.heading": "Pronto para um teste local seguro",
    "tracer.idle.body": "Use sua tecla de atalho ou execute um teste. Os resultados são copiados primeiro.",
    "tracer.resultsCopiedFirst": "Os resultados são copiados primeiro.",
    "tracer.runSafeTest": "Executar teste seguro",
    "tracer.cancel": "Cancelar rastreador",
    "tracer.closeTest": "Fechar teste do rastreador",
    "tracer.preparing": "Preparando captura",
    "tracer.listening": "Ouvindo",
    "tracer.processing": "Processando",
    "tracer.copying": "Copiando",
    "tracer.pasting": "Colando",
    "tracer.outcome.copied": "Copiado",
    "tracer.outcome.pasted": "Colado",
    "tracer.outcome.copyOnly": "Copiado — não foi possível verificar o destino da colagem",
    "tracer.busy": "Ocupado — termine o rastreador atual primeiro",
    "tracer.cancelled": "Cancelado — nada foi copiado",
    "tracer.error.generic": "Não foi possível concluir o rastreador. Sua área de transferência não foi alterada. Tente novamente.",
    "hotkey.ready": "Pronto",
    "hotkey.busy": "Ocupado",
    "hotkey.unavailable": "Tecla de atalho indisponível. Resolva o conflito e tente novamente.",
    "hotkey.close": "Fechar teste do rastreador",
    "paste.mode.clipboardOnly": "Somente área de transferência",
    "paste.mode.autoPaste": "Colagem automática ativada",
    "paste.autoPaste.label": "Colar automaticamente no destino verificado",
    "paste.autoPaste.confirmation.heading": "Ativar colagem automática?",
    "paste.autoPaste.confirmation.body": "O Lazytypr colará somente depois de reativar e verificar novamente o destino capturado ao iniciar. Se a verificação falhar, o resultado permanecerá copiado.",
    "paste.autoPaste.confirmation.confirm": "Ativar colagem automática",
    "paste.autoPaste.confirmation.cancel": "Manter somente área de transferência",
  },
} as const;

export type Phase1Locale = keyof typeof phase1Messages;
export type Phase1MessageKey = keyof typeof phase1Messages["en-US"];

type CatalogParity = Record<Phase1MessageKey, string>;

const ptBrParity: CatalogParity = phase1Messages["pt-BR"];
void ptBrParity;

/** Returns a fixed catalog string; renderer code never composes sensitive text. */
export function message(locale: Phase1Locale, key: Phase1MessageKey): string {
  return phase1Messages[locale][key];
}
