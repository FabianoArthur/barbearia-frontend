import { fireEvent, render, screen, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";
import { createDemoApi } from "@/demo/handlers";
import { createDemoAdapter } from "@/demo/install";
import { BookingWizard } from "./BookingWizard";

// The wizard talks to the in-memory demo API through the real axios client.
beforeEach(() => {
  api.defaults.adapter = createDemoAdapter(createDemoApi(new Date()), 0);
});

function renderWizard() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter>
        <BookingWizard />
      </MemoryRouter>
    </SWRConfig>,
  );
}

describe("BookingWizard", () => {
  it("lets a keyboard user pick a shop, then a service, then a barber", async () => {
    renderWizard();

    const shop = await screen.findByRole("button", {
      name: /Fio de Navalha — Centro/,
    });
    fireEvent.keyDown(shop, { key: "Enter" });

    const service = await screen.findByRole("button", {
      name: /Corte \+ barba/,
    });
    fireEvent.click(service);

    const barbers = await screen.findByText("Rafael");
    expect(barbers).toBeInTheDocument();
    expect(screen.queryByText("Thiago")).not.toBeInTheDocument();
  });

  it("names the map link after the shop", async () => {
    renderWizard();
    const shop = await screen.findByRole("button", {
      name: /Fio de Navalha — Centro/,
    });
    expect(
      within(shop).getByRole("link", {
        name: "Ver Fio de Navalha — Centro no mapa",
      }),
    ).toHaveAttribute("href", expect.stringContaining("maps"));
  });
});
