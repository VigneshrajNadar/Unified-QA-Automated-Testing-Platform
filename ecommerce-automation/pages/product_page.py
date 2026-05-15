from selenium.webdriver.common.by import By

class ProductPage:

    def __init__(self, driver):
        self.driver = driver

    # add_to_cart = (By.ID, "add-to-cart-sauce-labs-backpack")
    # Using XPATH to be safer if ID varies
    add_to_cart = (By.XPATH, "//button[text()='Add to cart']")
    cart_icon = (By.CLASS_NAME, "shopping_cart_link")

    def add_product_to_cart(self):
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        # Wait for button to be visible
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located(self.add_to_cart)
        ).click()
        
        self.driver.find_element(*self.cart_icon).click()
