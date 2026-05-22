import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.result_logger import capture_screenshot
import time

def test_flipkart_search(driver):
    """
    Test case to search for a product on Flipkart.
    Handles the login popup if it appears.
    """
    url = "https://www.flipkart.com/"
    print(f"\n[Step 1] Navigating to: {url}")
    driver.get(url)
    driver.maximize_window()
    
    # Wait for potential login popup and close it
    try:
        # This XPATH is tricky as Flipkart changes it often. 
        # We look for the 'X' button on the modal.
        # Common selector for the close button
        close_button = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'✕')] | //span[@role='button']"))
        )
        close_button.click()
        print("[Info] Closed Login Popup")
    except:
        print("[Info] Login Popup not found or already closed")

    print("[Step 2] Searching for 'iPhone 15'...")
    search_box = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "q"))
    )
    search_box.send_keys("iPhone 15")
    search_box.send_keys(Keys.RETURN)

    print("[Step 3] Verifying Results...")
    # Wait for results to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "_1AtVbE")) # Common class for result rows
    )
    
    time.sleep(2) # Allow render
    
    current_title = driver.title
    print(f"[Result] Page Title: {current_title}")
    
    capture_screenshot(driver, "flipkart_search_success")
    
    assert "iPhone 15" in current_title or "iphone 15" in current_title.lower()
