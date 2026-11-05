import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmProvider, useConfirm } from "./confirm";

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button onClick={async () => onResult(await confirm({ title: "Change status?", description: "Set to Closed", confirmLabel: "Yes, change" }))}>
      go
    </button>
  );
}

afterEach(cleanup);

describe("admin confirmation dialog", () => {
  it("resolves true only after the admin clicks Yes", async () => {
    const results: boolean[] = [];
    render(<ConfirmProvider><Harness onResult={(v) => results.push(v)} /></ConfirmProvider>);
    fireEvent.click(screen.getByText("go"));
    expect(await screen.findByText("Change status?")).toBeInTheDocument();
    expect(results).toEqual([]); // nothing happens until the admin answers
    fireEvent.click(screen.getByText("Yes, change"));
    await waitFor(() => expect(results).toEqual([true]));
  });
  it("resolves false on Cancel so the change is never made", async () => {
    const results: boolean[] = [];
    render(<ConfirmProvider><Harness onResult={(v) => results.push(v)} /></ConfirmProvider>);
    fireEvent.click(screen.getByText("go"));
    fireEvent.click(await screen.findByText("Cancel"));
    await waitFor(() => expect(results).toEqual([false]));
  });
  it("resolves false when dismissed with Escape", async () => {
    const results: boolean[] = [];
    render(<ConfirmProvider><Harness onResult={(v) => results.push(v)} /></ConfirmProvider>);
    fireEvent.click(screen.getByText("go"));
    fireEvent.keyDown(await screen.findByRole("alertdialog"), { key: "Escape" });
    await waitFor(() => expect(results).toEqual([false]));
  });
});
