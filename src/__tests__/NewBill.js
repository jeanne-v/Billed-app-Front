/**
 * @jest-environment jsdom
 */

import { getByText, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import { toHaveClass } from "@testing-library/jest-dom";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and i upload a file with the wrong type", () => {
    test("Then an error message should be shown and createBill function should not be called", () => {
      const wrongTypeFile = new File(["test"], "testfile.gif", { type: "image/gif" });

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: null,
        store: null,
        localStorage: window.localStorage,
      });

      newBill.createBill = jest.fn();

      const fileInput = screen.getByLabelText("Justificatif");
      userEvent.upload(fileInput, wrongTypeFile);
      expect(fileInput.files[0]).toStrictEqual(wrongTypeFile);
      expect(fileInput).toHaveClass("error");
      expect(screen.getByTestId("file-error-message")).toHaveClass("visible");
      expect(newBill.createBill).not.toHaveBeenCalled();
    });
  });

  describe("When I am on NewBill Page and i upload a file with the correct type", () => {
    test("Then createBill function should be called and class data updated", async () => {
      const correctTypeFile = new File(["test"], "testfile.png", { type: "image/png" });

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: null,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const newBillSpy = jest.spyOn(newBill, "createBill");

      const fileInput = screen.getByLabelText("Justificatif");
      userEvent.upload(fileInput, correctTypeFile);
      expect(fileInput.files[0]).toStrictEqual(correctTypeFile);
      expect(fileInput).not.toHaveClass("error");
      expect(screen.getByTestId("file-error-message")).not.toHaveClass("visible");
      expect(newBillSpy).toHaveBeenCalled();
      await new Promise(process.nextTick);
      expect(newBill.billId).toBeTruthy();
      expect(newBill.fileName).toBe(correctTypeFile.name);
    });
  });

  describe("When i try to upload file with the correct type but an error occurs on API", () => {
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
      document.body.innerHTML = "<div id='root'></div>";
      router();
    });
    test("Then it should log 'Erreur 404' if API returns 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      const logSpy = jest.spyOn(console, "log");

      const file = new File(["test"], "testfile.png", { type: "image/png" });

      window.onNavigate(ROUTES_PATH.NewBill);
      const fileInput = screen.getByLabelText("Justificatif");
      userEvent.upload(fileInput, file);
      await new Promise(process.nextTick);
      expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 404"));
    });

    test("Then it should log 'Erreur 500' if API returns 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      const logSpy = jest.spyOn(console, "log");

      const file = new File(["test"], "testfile.png", { type: "image/png" });

      window.onNavigate(ROUTES_PATH.NewBill);
      const fileInput = screen.getByLabelText("Justificatif");
      userEvent.upload(fileInput, file);
      await new Promise(process.nextTick);
      expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 500"));
    });
  });

  describe("When i am newBill Page and try to submit form with incorrect type file", () => {
    test("Then update bill should not be called", async () => {
      const wrongTypeFile = new File(["test"], "testfile.gif", { type: "image/gif" });

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      newBill.updateBill = jest.fn();

      const fileInput = screen.getByLabelText("Justificatif");
      const amountInput = screen.getByLabelText("Montant TTC");
      const tvaInput = screen.getByLabelText("%");
      const dateInput = screen.getByLabelText("Date");
      userEvent.upload(fileInput, wrongTypeFile);
      await new Promise(process.nextTick);
      userEvent.type(amountInput, "300");
      userEvent.type(tvaInput, "20");
      userEvent.type(dateInput, "01/01/2025");

      userEvent.click(screen.getByTestId("btn-send-bill"));
      expect(newBill.updateBill).not.toHaveBeenCalled();
    });
  });

  describe("When i am newBill Page and try to submit form with correct type file and data", () => {
    test("Then update bill should be called and user should be back to bills page", async () => {
      const file = new File(["test"], "testfile.png", { type: "image/png" });

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      newBill.updateBill = jest.fn();

      const fileInput = screen.getByLabelText("Justificatif");
      const amountInput = screen.getByLabelText("Montant TTC");
      const tvaInput = screen.getByLabelText("%");
      const dateInput = screen.getByLabelText("Date");
      userEvent.upload(fileInput, file);
      await new Promise(process.nextTick);
      userEvent.type(amountInput, "300");
      userEvent.type(tvaInput, "20");
      userEvent.type(dateInput, "01/01/2025");

      userEvent.click(screen.getByTestId("btn-send-bill"));
      expect(newBill.updateBill).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeVisible();
    });
  });
});
