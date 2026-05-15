from selenium.webdriver.common.by import By

class CartPage:

    def __init__(self, driver):
        self.driver = driver

    checkout_btn = (By.ID, "checkout")

    def proceed_to_checkout(self):
        self.driver.find_element(*self.checkout_btn).click()
