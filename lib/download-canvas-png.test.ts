/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadCanvasPng } from "./download-canvas-png";

describe("downloadCanvasPng", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads a PNG data URL with the given filename", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toDataURL").mockReturnValue(
      "data:image/png;base64,testdata",
    );

    const click = vi.fn();
    const anchor = document.createElement("a");
    vi.spyOn(anchor, "click").mockImplementation(click);
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    downloadCanvasPng(canvas, "launch-qr.png");

    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(anchor.href).toBe("data:image/png;base64,testdata");
    expect(anchor.download).toBe("launch-qr.png");
    expect(click).toHaveBeenCalledOnce();
  });
});
