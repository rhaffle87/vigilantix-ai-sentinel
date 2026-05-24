import { render, screen } from "@testing-library/react";
import { useMounted } from "../hooks/use-mounted";
import { describe, it, expect } from "vitest";
import React from "react";

function TestComponent() {
  const mounted = useMounted();
  return <div data-testid="mounted-state">{mounted ? "mounted" : "not-mounted"}</div>;
}

describe("useMounted hook", () => {
  it("should render as mounted after loading", () => {
    render(<TestComponent />);
    const el = screen.getByTestId("mounted-state");
    expect(el).toHaveTextContent("mounted");
  });
});
