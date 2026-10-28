/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MissingLinkView } from "./missing-link-view";

describe("MissingLinkView", () => {
  it("shows the attempted path and a home link", () => {
    render(<MissingLinkView slug="gone-link" />);

    expect(
      screen.getByRole("heading", { name: "Path not found" }),
    ).toBeTruthy();
    expect(screen.getByText("/gone-link")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to shortlink" }).getAttribute("href"),
    ).toBe("/");
  });

  it("omits the path chip when no slug is provided", () => {
    render(<MissingLinkView />);

    expect(screen.queryByText(/^\/.+/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Back to shortlink" }),
    ).toBeTruthy();
  });
});
