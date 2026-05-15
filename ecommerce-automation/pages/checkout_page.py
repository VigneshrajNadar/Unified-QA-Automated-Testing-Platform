from selenium.webdriver.common.by import By

class CheckoutPage:

    def __init__(self, driver):
        self.driver = driver

    first_name = (By.ID, "first-name")
    last_name = (By.ID, "last-name")
    postal_code = (By.ID, "postal-code")
    continue_btn = (By.ID, "continue")
    finish_btn = (By.ID, "finish")
    confirmation = (By.CLASS_NAME, "complete-header")

    def complete_checkout(self):
        self.driver.find_element(*self.first_name).send_keys("John")
        self.driver.find_element(*self.last_name).send_keys("Doe")
        self.driver.find_element(*self.postal_code).send_keys("400001")
        self.driver.find_element(*self.continue_btn).click()
        self.driver.find_element(*self.finish_btn).click()

    def get_confirmation_text(self):
        return self.driver.find_element(*self.confirmation).text
