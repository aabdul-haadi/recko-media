import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Header } from "./Header";
import { lockScroll, scrollToId } from "@/lib/scroll";

vi.mock("@/lib/scroll", () => ({ lockScroll: vi.fn(), scrollToId: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Header side menu", () => {
  it("opens a modal drawer, closes with Escape and restores focus to Menu", async () => {
    render(<Header />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("recko-menu-drawer");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(drawer).getAllByRole("button")).toHaveLength(7);
    expect(lockScroll).toHaveBeenCalledWith(true);
    fireEvent.keyDown(drawer, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(lockScroll).toHaveBeenLastCalledWith(false);
  });

  it("keeps existing section navigation working after the drawer closes", async () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Services" }));
    await waitFor(() => expect(scrollToId).toHaveBeenCalledWith("#services"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
