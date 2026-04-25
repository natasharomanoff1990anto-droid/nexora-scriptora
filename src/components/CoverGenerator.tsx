import { useState, useRef, useEffect } from "react";

interface CoverGeneratorProps {
  title: string;
  subtitle: string;
  onGenerate: (dataUrl: string) => void;
  onClose: () => void;
}

const TEMPLATES = [
  { name: "Minimal White", bg: "#FAFAFA", textColor: "#1A1A1A", accentColor: "#6B46C1", font: "Georgia" },
  { name: "Deep Navy", bg: "#0F1B2D", textColor: "#F0E6D3", accentColor: "#C9A84C", font: "Georgia" },
  { name: "Warm Earth", bg: "#2C1810", textColor: "#F5E6D3", accentColor: "#D4845A", font: "Palatino" },
  { name: "Sage", bg: "#1A2E1A", textColor: "#E8F0E4", accentColor: "#7DAF6B", font: "Georgia" },
  { name: "Midnight Purple", bg: "#1A0A2E", textColor: "#E8D5F5", accentColor: "#9B6FCF", font: "Palatino" },
  { name: "Classic Black", bg: "#0A0A0A", textColor: "#FFFFFF", accentColor: "#C0C0C0", font: "Georgia" },
];

export function CoverGenerator({ title, subtitle, onGenerate, onClose }: CoverGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [authorName, setAuthorName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const template = TEMPLATES[selectedTemplate];

  useEffect(() => {
    drawCover();
  }, [title, subtitle, authorName, selectedTemplate]);

  function drawCover() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 1600;
    const h = 2560;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = template.bg;
    ctx.fillRect(0, 0, w, h);

    // Decorative line
    ctx.strokeStyle = template.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.25);
    ctx.lineTo(w * 0.85, h * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.75);
    ctx.lineTo(w * 0.85, h * 0.75);
    ctx.stroke();

    // Title
    ctx.fillStyle = template.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleSize = title.length > 30 ? 90 : title.length > 20 ? 110 : 130;
    ctx.font = `bold ${titleSize}px ${template.font}, serif`;
    wrapText(ctx, title.toUpperCase(), w / 2, h * 0.4, w * 0.7, titleSize * 1.3);

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = template.accentColor;
      ctx.font = `italic ${52}px ${template.font}, serif`;
      wrapText(ctx, subtitle, w / 2, h * 0.58, w * 0.7, 65);
    }

    // Author
    if (authorName) {
      ctx.fillStyle = template.textColor;
      ctx.font = `${46}px ${template.font}, serif`;
      ctx.fillText(authorName.toUpperCase(), w / 2, h * 0.82);
    }

    // Small accent at bottom
    ctx.fillStyle = template.accentColor;
    ctx.fillRect(w * 0.45, h * 0.92, w * 0.1, 4);
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, x, startY + i * lineHeight);
    });
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onGenerate(canvas.toDataURL("image/jpeg", 0.95));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Cover Generator</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="p-4 grid grid-cols-[1fr_200px] gap-4">
          {/* Preview */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-h-[500px] w-auto rounded shadow-lg"
              style={{ maxWidth: "100%" }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Author Name</label>
              <input
                className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Your Name"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
              <div className="space-y-1">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={`stable-${i}`}
                    onClick={() => setSelectedTemplate(i)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      i === selectedTemplate ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-sm border border-border shrink-0"
                      style={{ backgroundColor: t.bg }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Use This Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
