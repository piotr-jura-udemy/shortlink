/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QrCodeDialog } from "./qr-code-dialog";

vi.mock("qrcode.react", () => {
  const { forwardRef } = require("react") as typeof import("react");
  return {
    QRCodeCanvas: forwardRef<
      HTMLCanvasElement,
      { value: string; title?: string }
    >(function MockQRCodeCanvas({ value, title }, ref) {
      return (
        <canvas
          ref={ref}
          data-testid="qr-canvas"
          data-value={value}
          title={title}
        />
      );
    }),
  };
});

vi.mock("@/lib/download-canvas-png", () => ({
  downloadCanvasPng: vi.fn(),
}));

import { downloadCanvasPng } from "@/lib/download-canvas-png";

describe("QrCodeDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("encodes the full shortened URL including protocol and domain", () => {
    Object.defineProperty(window, "location", {
      value: { origin: "https://go.example" },
      writable: true,
    });

    render(<QrCodeDialog slug="launch" open onOpenChange={() => {}} />);

    const canvas = screen.getByTestId("qr-canvas");
    expect(canvas.getAttribute("data-value")).toBe(
      "https://go.example/launch",
    );
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeTruthy();
  });

  it("downloads a PNG of the QR canvas", async () => {
    Object.defineProperty(window, "location", {
      value: { origin: "https://go.example" },
      writable: true,
    });

    const { getByRole, getByTestId } = render(
      <QrCodeDialog slug="launch" open onOpenChange={() => {}} />,
    );

    getByRole("button", { name: "Download PNG" }).click();

    expect(downloadCanvasPng).toHaveBeenCalledWith(
      getByTestId("qr-canvas"),
      "launch-qr.png",
    );
  });
});
