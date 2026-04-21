import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, Header, Footer, PageNumber,
  LevelFormat, BorderStyle, TabStopType, TabStopPosition,
} from "docx";
import { BookProject } from "@/types/book";

function safeText(text: unknown): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  if (typeof text === "object") return JSON.stringify(text);
  return String(text);
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/  +/g, " ")
    .replace(/(^|[\s(])"/g, "$1\u201C")
    .replace(/"/g, "\u201D")
    .replace(/(^|[\s(])'/g, "$1\u2018")
    .replace(/'/g, "\u2019")
    .replace(/--/g, "\u2014")
    .replace(/\.\.\./g, "\u2026")
    .trim();
}

function bodyParagraphs(text: string, opts?: { firstNoIndent?: boolean; dropCap?: boolean }): Paragraph[] {
  const cleaned = cleanMarkdown(safeText(text));
  if (!cleaned) return [];
  const blocks = cleaned.split(/\n\n+/).filter(p => p.trim());
  return blocks.map((block, i) => {
    const isFirst = i === 0;

    // Scene break
    if (/^[\*#\u2022\u2014\-\s]+$/.test(block.trim()) && block.trim().length < 10) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        children: [new TextRun({ text: "✦  ✦  ✦", font: "Garamond", size: 22 })],
      });
    }

    // Drop cap (first letter slightly larger and bold) on opening paragraph
    if (opts?.dropCap && isFirst && block.length > 3) {
      const firstChar = block.charAt(0);
      const rest = block.slice(1);
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 320 },
        children: [
          new TextRun({ text: firstChar, font: "Garamond", size: 56, bold: true }),
          new TextRun({ text: rest, font: "Garamond", size: 22 }),
        ],
      });
    }

    const noIndent = isFirst && opts?.firstNoIndent !== false;
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 320 },
      indent: noIndent ? undefined : { firstLine: 360 }, // 0.25" indent
      children: [new TextRun({ text: block.trim(), font: "Garamond", size: 22 })],
    });
  });
}

function chapterOpener(num: number, title: string): Paragraph[] {
  return [
    // Extra space at top
    new Paragraph({ spacing: { before: 1800 }, children: [] }),
    // "Chapter X" small label
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: `Chapter ${num}`, font: "Garamond", size: 22, italics: true, color: "666666" })],
    }),
    // Big title
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      children: [new TextRun({ text: cleanMarkdown(title), font: "Garamond", size: 40, bold: true })],
    }),
    // Ornament
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: "✦  ✦  ✦", font: "Garamond", size: 22 })],
    }),
  ];
}

function sectionH1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 1440, after: 480 },
    children: [new TextRun({ text: cleanMarkdown(text), font: "Garamond", size: 36, bold: true })],
  });
}

function sectionH2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: cleanMarkdown(text), font: "Garamond", size: 28, bold: true })],
  });
}

export async function generateDocx(project: BookProject): Promise<Blob> {
  const { config, frontMatter, chapters, backMatter } = project;
  const author = config.authorStyle || "The Author";
  const bookTitle = config.title || "Untitled";

  const children: Paragraph[] = [];

  // ===== HALF TITLE =====
  children.push(new Paragraph({ spacing: { before: 4500 }, children: [] }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: bookTitle, font: "Garamond", size: 36, italics: true })],
  }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===== TITLE PAGE =====
  children.push(new Paragraph({ spacing: { before: 3500 }, children: [] }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: bookTitle, font: "Garamond", size: 56, bold: true })],
  }));
  if (config.subtitle) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: config.subtitle, font: "Garamond", size: 28, italics: true })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: 2400 }, children: [] }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: author, font: "Garamond", size: 26 })],
  }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===== FRONT MATTER =====
  if (frontMatter) {
    const fmSections: [string, string][] = [
      ["Copyright", frontMatter.copyright],
      ["Dedication", frontMatter.dedication],
      ["About the Author", frontMatter.aboutAuthor],
      ["How to Use This Book", frontMatter.howToUse],
      ["Letter to the Reader", frontMatter.letterToReader],
    ];
    for (const [title, content] of fmSections) {
      const txt = safeText(content);
      if (!txt) continue;
      children.push(sectionH1(title));
      children.push(...bodyParagraphs(txt, { firstNoIndent: true }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // ===== TABLE OF CONTENTS =====
  children.push(sectionH1("Contents"));
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    if (!ch) continue;
    const num = String(i + 1).padStart(2, " ");
    children.push(new Paragraph({
      spacing: { after: 120 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: `${num}.   ${cleanMarkdown(ch.title || `Chapter ${i + 1}`)}`, font: "Garamond", size: 22 }),
      ],
    }));
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===== CHAPTERS =====
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    if (!ch || (!ch.content && (!ch.subchapters || ch.subchapters.length === 0))) continue;

    children.push(...chapterOpener(i + 1, ch.title));
    children.push(...bodyParagraphs(ch.content, { dropCap: true, firstNoIndent: true }));

    if (ch.subchapters) {
      for (const sub of ch.subchapters) {
        if (!sub.content) continue;
        children.push(sectionH2(sub.title));
        children.push(...bodyParagraphs(sub.content, { firstNoIndent: true }));
      }
    }
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ===== BACK MATTER =====
  if (backMatter) {
    const bmSections: [string, string][] = [
      ["Conclusion", backMatter.conclusion],
      ["Author's Note", backMatter.authorNote],
      ["What's Next", backMatter.callToAction],
      ["A Small Request", backMatter.reviewRequest],
      ["Other Books", backMatter.otherBooks],
    ];
    for (const [title, content] of bmSections) {
      const txt = safeText(content);
      if (!txt) continue;
      children.push(sectionH1(title));
      children.push(...bodyParagraphs(txt, { firstNoIndent: true }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // ===== HEADERS / FOOTERS (alternate odd/even) =====
  const evenHeader = new Header({
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } },
      children: [new TextRun({ text: author.toUpperCase(), font: "Garamond", size: 18, italics: true, color: "666666" })],
    })],
  });
  const oddHeader = new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } },
      children: [new TextRun({ text: bookTitle.toUpperCase(), font: "Garamond", size: 18, italics: true, color: "666666" })],
    })],
  });
  const evenFooter = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: "Garamond", size: 20 })],
    })],
  });
  const oddFooter = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: "Garamond", size: 20 })],
    })],
  });

  const doc = new Document({
    creator: author,
    title: bookTitle,
    description: config.subtitle || "",
    styles: {
      default: { document: { run: { font: "Garamond", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Garamond" },
          paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Garamond" },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          // 6×9 in DXA: 6*1440=8640, 9*1440=12960
          size: { width: 8640, height: 12960 },
          margin: { top: 1080, right: 900, bottom: 1080, left: 1260, header: 540, footer: 540 },
        },
        titlePage: true, // suppress header/footer on first page
      },
      headers: { default: oddHeader, even: evenHeader, first: undefined },
      footers: { default: oddFooter, even: evenFooter, first: undefined },
      children,
    }],
  });

  return await Packer.toBlob(doc);
}

export function downloadDocx(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
