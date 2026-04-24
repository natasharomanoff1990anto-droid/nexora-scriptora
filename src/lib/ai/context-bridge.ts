import { Chapter } from "@/types/book";

export const buildStyleAnchor = (prevContent: string): string => {
  if (!prevContent) return "";
  const lastWords = prevContent.split(" ").slice(-300).join(" ");
  return `
### ANCORA STILISTICA (COERENZA):
Riprendi esattamente il ritmo e il peso delle ultime righe generate:
"...${lastWords}"
  `;
};
