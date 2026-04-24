export const generateCoverPrompt = (title: string, genre: string, tone: string) => {
  return `
### PROMPT COPERTINA BESTSELLER (STILE SCRIPTORA):
SOGGETTO: Un'icona concettuale pesantissima legata a "${title}". 
STILE: Minimalismo Brutale, fotografia macro cinematografica, ombre profonde (Chiaroscuro).
ATMOSFERA: "${tone}", densa, misteriosa. 
PALETTE: Desaturata, contrasto estremo, un solo colore d'accento materico (es. rosso sangue, oro opaco, blu notte).
DETTAGLI: Grana della pellicola, texture tattile (cemento, carta stropicciata, metallo ossidato). 
NO: Persone sorridenti, stock photos, colori pastello, layout caotici.
  `.trim();
};
