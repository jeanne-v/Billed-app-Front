/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import { toHaveClass } from "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When i click on a bill eye icon", () => {
      test("Then, a modal should open with the document attached to that bill", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        new Bills({
          document,
          onNavigate: null,
          store: null,
          bills: bills,
          localStorage: null,
        });
        $.fn.modal = jest
          .fn()
          .mockImplementationOnce(() =>
            screen.getByTestId("file-modal").classList.add("show")
          );
        expect(screen.getByTestId("file-modal")).not.toHaveClass("show");
        const eyeIcons = screen.getAllByTestId("icon-eye");
        userEvent.click(eyeIcons[0]);
        expect(screen.getByTestId("file-modal")).toHaveClass("show");
        const proofImgUrl = eyeIcons[0].getAttribute("data-bill-url");
        expect(screen.getByTestId("bill-proof").getAttribute("src")).toEqual(proofImgUrl);
      });
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as an Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("Then bills should be fetched", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      document.body.innerHTML = '<div id="root"></div>';
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getAllByText("En attente").length).toBe(1);
      expect(screen.getAllByText("Accepté").length).toBe(1);
      expect(screen.getAllByText("Refusé").length).toBe(2);
    });
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      document.innerHTML = "<div id='root'></div>";
      router();
    });
    test("Then it should show 'Erreur 404' if API returns 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      expect(screen.getByText(/Erreur 404/)).toBeVisible();
    });
    test("Then it should show 'Erreur 500' if API returns 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      expect(screen.getByText(/Erreur 500/)).toBeVisible();
    });
  });
});
