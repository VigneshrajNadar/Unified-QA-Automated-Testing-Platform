import pytest
import json
import os
import time
from pages.login_page import LoginPage
from pages.home_page import HomePage
from pages.product_page import ProductPage
from pages.cart_page import CartPage
from pages.checkout_page import CheckoutPage

class TestEcommerceFlow:
    results = {
        "summary": {"passed": 0, "failed": 0, "total": 6},
        "steps": [],
        "scanTime": ""
    }

    @classmethod
    def setup_class(cls):
        cls.results["scanTime"] = time.strftime("%Y-%m-%d %H:%M:%S")

    @classmethod
    def teardown_class(cls):
        # Save results to JSON
        reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # Calculate summary
        passed = sum(1 for s in cls.results["steps"] if s["status"] == "PASSED")
        failed = sum(1 for s in cls.results["steps"] if s["status"] == "FAILED")
        cls.results["summary"]["passed"] = passed
        cls.results["summary"]["failed"] = failed
        
        json_path = os.path.join(reports_dir, 'e2e_results.json')
        with open(json_path, 'w') as f:
            json.dump(cls.results, f, indent=4)
        print(f"\n[Report] E2E Results saved to {json_path}")

    def log_step(self, step_name, description, status="PASSED", error=None):
        step_data = {
            "step": step_name,
            "description": description,
            "status": status,
            "timestamp": time.strftime("%H:%M:%S")
        }
        if error:
            step_data["error"] = str(error)
        
        self.results["steps"].append(step_data)
        print(f"[{status}] {step_name}: {description}")

    def test_full_flow(self, driver):
        try:
            # Step 1: Login
            try:
                login = LoginPage(driver)
                login.open()
                login.login("standard_user", "secret_sauce")
                self.log_step("Login", "Navigated to login page and authenticated as standard_user")
            except Exception as e:
                self.log_step("Login", "Failed to login", "FAILED", e)
                raise e

            # Step 2: Home Page
            try:
                home = HomePage(driver)
                home.select_product()
                self.log_step("Product Selection", "Selected the first product from the inventory")
            except Exception as e:
                self.log_step("Product Selection", "Failed to select product", "FAILED", e)
                raise e

            # Step 3: Product Page
            try:
                product = ProductPage(driver)
                product.add_product_to_cart()
                self.log_step("Add to Cart", "Added product to cart and navigated to cart page")
            except Exception as e:
                self.log_step("Add to Cart", "Failed to add to cart", "FAILED", e)
                raise e

            # Step 4: Cart Verification
            try:
                cart = CartPage(driver)
                cart.proceed_to_checkout()
                self.log_step("Cart Verification", "Verified cart items and proceeded to checkout")
            except Exception as e:
                self.log_step("Cart Verification", "Cart verification failed", "FAILED", e)
                raise e

            # Step 5: Checkout
            try:
                checkout = CheckoutPage(driver)
                checkout.complete_checkout()
                self.log_step("Checkout Process", "Entered shipping details and finished checkout")
            except Exception as e:
                self.log_step("Checkout Process", "Checkout failed", "FAILED", e)
                raise e

            # Step 6: Final Verification
            try:
                confirmation = checkout.get_confirmation_text()
                assert "THANK YOU" in confirmation or "Thank you" in confirmation
                self.log_step("Order Confirmation", "Verified 'Thank You' message on confirmation page")
            except Exception as e:
                self.log_step("Order Confirmation", "Order confirmation message missing", "FAILED", e)
                raise e

        except Exception as e:
            pytest.fail(f"E2E Flow Failed: {e}")
