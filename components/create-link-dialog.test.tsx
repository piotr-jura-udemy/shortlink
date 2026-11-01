/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLink } from "@/lib/links";
import { CreateLinkDialog } from "./create-link-dialog";

vi.mock("@/lib/links", () => ({
  createLink: vi.fn(),
}));

vi.mock("@/components/qr-code-dialog", () => ({
  QrCodeDialog: () => null,
}));

vi.mock("@/components/copy-short-link-button", () => ({
  CopyShortLinkButton: () => null,
}));

const createLinkMock = vi.mocked(createLink);

describe("CreateLinkDialog", () => {
  beforeEach(() => {
    createLinkMock.mockReset();
  });

  it("returns to the create form when Create another is clicked", async () => {
    createLinkMock.mockResolvedValue({
      success: true,
      link: {
        id: "1",
        url: "https://example.com",
        slug: "demo",
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    render(<CreateLinkDialog open onOpenChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Destination URL"), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByLabelText("Short link slug"), {
      target: { value: "demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create link" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Link created" }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create another" }));

    expect(
      screen.getByRole("heading", { name: "Create a short link" }),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Destination URL") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Short link slug") as HTMLInputElement).value,
    ).toBe("");
  });
});
