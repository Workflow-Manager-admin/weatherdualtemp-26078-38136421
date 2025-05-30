import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeatherDualTemp from "./WeatherDualTemp";

// Helper: mock global fetch
function mockFetchWeatherSuccess({ city = "Paris", country = "FR", temp = 22, icon = "01d", main = "Clear", desc = "clear sky" } = {}) {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          name: city,
          sys: { country },
          main: { temp },
          weather: [
            {
              icon,
              main,
              description: desc,
            },
          ],
        }),
    })
  );
}

function mockFetchWeatherFailure({ status = 404, message = "Location not found." } = {}) {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () =>
        Promise.resolve({
          message,
        }),
    })
  );
}

afterEach(() => {
  // Restore fetch after every test
  global.fetch && global.fetch.mockClear && global.fetch.mockClear();
  delete global.fetch;
});

describe("WeatherDualTemp", () => {
  it("renders input, search and refresh buttons, placeholder", () => {
    render(<WeatherDualTemp />);
    expect(screen.getByPlaceholderText(/enter city/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByText(/enter a city above and click search/i)).toBeInTheDocument();
  });

  it("enables search when input has value, disables on empty", async () => {
    render(<WeatherDualTemp />);
    const input = screen.getByPlaceholderText(/enter city/i);
    const searchBtn = screen.getByRole("button", { name: /search/i });

    expect(searchBtn).toBeDisabled();

    await userEvent.type(input, "London");
    expect(searchBtn).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "" } });
    expect(searchBtn).toBeDisabled();
  });

  it("displays loading state during fetch and disables actions", async () => {
    // Delay fetch for observable 'Loading...'
    global.fetch = jest.fn(() => new Promise((resolve) => setTimeout(() =>
      resolve({
        ok: true,
        json: () => Promise.resolve({ name: "Tokyo", sys: { country: "JP" }, main: { temp: 18 }, weather: [{ icon: "04d", main: "Clouds", description: "scattered clouds" }] }),
      }), 300)
    ));

    render(<WeatherDualTemp />);
    const input = screen.getByPlaceholderText(/enter city/i);
    await userEvent.type(input, "Tokyo");
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);

    expect(searchBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled();
    expect(searchBtn).toHaveTextContent(/loading/i);

    // Wait for fetch to resolve to re-enable buttons
    await waitFor(() => expect(searchBtn).not.toBeDisabled(), { timeout: 1200 });
    expect(screen.getByRole("button", { name: /refresh/i })).not.toBeDisabled();
  });

  it("fetches and displays the correct temperatures in Celsius and Fahrenheit after search", async () => {
    mockFetchWeatherSuccess({ city: "New York", country: "US", temp: 10, icon: "01n", main: "Clear", desc: "clear" });

    render(<WeatherDualTemp />);
    const input = screen.getByPlaceholderText(/enter city/i);
    await userEvent.type(input, "New York");
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);

    // Wait for weather info to render
    expect(await screen.findByText(/New York/)).toBeInTheDocument();
    expect(screen.getByText(/US/)).toBeInTheDocument();
    // Celsius
    expect(screen.getByText(/10°C/)).toBeInTheDocument();
    // F
    expect(screen.getByText(/50°F/)).toBeInTheDocument();
    // Weather main, desc, icon
    expect(screen.getByText(/Clear/)).toBeInTheDocument();
    expect(screen.getByAltText(/clear/)).toHaveAttribute("src", expect.stringContaining("01n"));

    // Placeholder should be gone
    expect(screen.queryByText(/enter a city above and click search/i)).not.toBeInTheDocument();
  });

  it("handles API failure and displays error message", async () => {
    mockFetchWeatherFailure();

    render(<WeatherDualTemp />);
    const input = screen.getByPlaceholderText(/enter city/i);
    await userEvent.type(input, "NowhereLand");
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);

    // Wait for error
    expect(await screen.findByTestId("weather-error")).toHaveTextContent(/location not found/i);

    // Weather info and placeholder should not be visible
    expect(screen.queryByText(/enter a city above and click search/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NowhereLand/)).not.toBeInTheDocument();
  });

  it("shows placeholder if no weather data available (initial)", () => {
    render(<WeatherDualTemp />);
    expect(screen.getByText(/enter a city above and click search/i)).toBeInTheDocument();
  });

  it("refresh button re-fetches weather for last searched city", async () => {
    // Track how many times fetch is called
    mockFetchWeatherSuccess({ city: "Rome", country: "IT", temp: 14 });

    render(<WeatherDualTemp />);
    const input = screen.getByPlaceholderText(/enter city/i);
    await userEvent.type(input, "Rome");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    // Confirm weather loads
    expect(await screen.findByText(/Rome/)).toBeInTheDocument();

    // Trigger refresh
    mockFetchWeatherSuccess({ city: "Rome", country: "IT", temp: 14 }); // Remock to count new fetch
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    // Wait for (possibly) new fetch
    expect(await screen.findByText(/Rome/)).toBeInTheDocument();
    // Confirm last query is used and no crash
    expect(global.fetch).toHaveBeenCalled();
  });

  it("does not allow refresh unless city has been searched", () => {
    render(<WeatherDualTemp />);
    expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled();

    const input = screen.getByPlaceholderText(/enter city/i);
    userEvent.type(input, "Delhi");
    expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled();
  });

  it("shows OpenWeatherMap credit always", () => {
    render(<WeatherDualTemp />);
    const creditLink = screen.getByRole("link", { name: /openweathermap/i });
    expect(creditLink).toBeInTheDocument();
    expect(creditLink).toHaveAttribute("href", "https://openweathermap.org/");
  });
});
