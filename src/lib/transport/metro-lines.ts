export type MetroLineStyle = {
  label: string;
  background: string;
  foreground: string;
  border: string;
};

const metroLineStyles: Record<string, MetroLineStyle> = {
  "1": { label: "1", background: "#FFCD00", foreground: "#111111", border: "#e6b900" },
  "2": { label: "2", background: "#003CA6", foreground: "#ffffff", border: "#00358f" },
  "3": { label: "3", background: "#837902", foreground: "#ffffff", border: "#6f6702" },
  "3bis": { label: "3bis", background: "#6EC4E8", foreground: "#111111", border: "#55afd4" },
  "4": { label: "4", background: "#CF009E", foreground: "#ffffff", border: "#b6008a" },
  "5": { label: "5", background: "#FF7E2E", foreground: "#111111", border: "#e66b1f" },
  "6": { label: "6", background: "#6ECA97", foreground: "#111111", border: "#54b47f" },
  "7": { label: "7", background: "#FA9ABA", foreground: "#111111", border: "#e583a5" },
  "7bis": { label: "7bis", background: "#6ECA97", foreground: "#111111", border: "#54b47f" },
  "8": { label: "8", background: "#E19BDF", foreground: "#111111", border: "#cc84ca" },
  "9": { label: "9", background: "#B6BD00", foreground: "#111111", border: "#a1a800" },
  "10": { label: "10", background: "#C9910D", foreground: "#111111", border: "#b07d0a" },
  "11": { label: "11", background: "#704B1C", foreground: "#ffffff", border: "#5f4018" },
  "12": { label: "12", background: "#007852", foreground: "#ffffff", border: "#006846" },
  "13": { label: "13", background: "#6EC4E8", foreground: "#111111", border: "#55afd4" },
  "14": { label: "14", background: "#62259D", foreground: "#ffffff", border: "#542087" },
};

export function normalizeMetroLine(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^m(?:etro)?/, "");
}

export function getMetroLineStyle(value?: string | null): MetroLineStyle | null {
  const key = normalizeMetroLine(value);
  if (!key) return null;
  return metroLineStyles[key] ?? {
    label: String(value).trim(),
    background: "#f4efe6",
    foreground: "#153528",
    border: "#dfd4c2",
  };
}
