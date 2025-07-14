/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import { toHaveClass } from "@testing-library/jest-dom";

import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and i upload a file with the wrong type", () => {
    test("Then an error message should be shown and createBill function should not be called", () => {
      const wrongTypeFile = new File(["test"], "testfile.gif", { type: "image/gif" });

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
          email: "Employee",
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
});
