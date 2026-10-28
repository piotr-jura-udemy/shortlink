/** Trigger a PNG download from a canvas element. */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  anchor.click();
}
