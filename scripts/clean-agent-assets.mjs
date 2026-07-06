import sharp from "sharp";

const files = [
  {
    input: "/Users/stevenohayon/Downloads/Batata.png",
    output: "public/images/agents/batata-clean.png",
    kind: "checker",
    protect: () => false,
  },
  {
    input: "/Users/stevenohayon/Downloads/TSADIK.png",
    output: "public/images/agents/tsadik-clean.png",
    kind: "checker",
    protect: (x, y) =>
      x > 285 && x < 575 && y > 690 && y < 1075,
  },
  {
    input: "/Users/stevenohayon/Downloads/favoris.jpeg",
    output: "public/images/agents/mes-favoris-clean.png",
    kind: "solid",
  },
];

for (const file of files) {
  const { data, info } = await sharp(file.input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const corner = [data[0], data[1], data[2]];

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      if (file.kind === "checker") {
        const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 6;
        const isChecker = neutral && Math.min(r, g, b) > 188;
        if (isChecker && (!file.protect?.(x, y) || y > 1000)) data[offset + 3] = 0;
      } else {
        const distance = Math.sqrt(
          (r - corner[0]) ** 2 + (g - corner[1]) ** 2 + (b - corner[2]) ** 2,
        );
        if (distance < 58) data[offset + 3] = 0;
        else if (distance < 92) data[offset + 3] = Math.round(((distance - 58) / 34) * 255);
      }
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(file.output);
}
