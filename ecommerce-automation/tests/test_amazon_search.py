import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.result_logger import capture_screenshot
import time

def test_amazon_search(driver):
    """
    Test case to search for a product on Amazon.
    """
    url = "https://www.amazon.in/"
    print(f"\n[Step 1] Navigating to: {url}")
    driver.get(url)
    driver.maximize_window()
    
    print("[Step 2] Searching for 'Samsung S24'...")
    search_box = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "twotabsearchtextbox"))
    )
    search_box.send_keys("Samsung S24")
    search_box.send_keys(Keys.RETURN)

    print("[Step 3] Verifying Results...")
    # Wait for results
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-component-type='s-search-result']"))
    )
    
    time.sleep(2) # Allow render
    
    current_title = driver.title
    print(f"[Result] Page Title: {current_title}")
    
    capture_screenshot(driver, "amazon_search_success")
    
    assert "Samsung S24" in current_title or "Samsung" in current_title
