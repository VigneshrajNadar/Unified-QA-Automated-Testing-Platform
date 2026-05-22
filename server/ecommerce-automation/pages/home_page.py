from selenium.webdriver.common.by import By

class HomePage:

    def __init__(self, driver):
        self.driver = driver

    # Use specific ID for the backpack link to ensure we land on the right product page
    product_link = (By.ID, "item_4_title_link") 

    def select_product(self):
        self.driver.find_element(*self.product_link).click()
