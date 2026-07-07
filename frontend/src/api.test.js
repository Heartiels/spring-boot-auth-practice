import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getProfile, login } from "./api.js";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("authentication API", () => {
  it("sends login credentials as a POST JSON request", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 1, username: "haowen", token: "signed-token" }),
    });

    await login("haowen", "test123");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "haowen", password: "test123" }),
      }),
    );
  });

  it("sends the JWT in the Bearer authorization header", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 1, username: "haowen" }),
    });

    await getProfile("signed-token");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer signed-token" }),
      }),
    );
  });

  it("turns a backend error response into an ApiError", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid username or password" }),
    });

    await expect(login("haowen", "wrong123")).rejects.toEqual(
      new ApiError("Invalid username or password", 401),
    );
  });
});
