import pytest
from utils.result_logger import capture_screenshot
import time

def test_universal_access(driver, target_url):
    """
    Universal test that:
    1. Navigation to any provided URL.
    2. Takes a screenshot.
    3. Verifies page load.
    """
    print(f"\n[Step 1] Navigating to: {target_url}")
    driver.get(target_url)
    
    # Wait for load (Increased for heavy sites like Flipkart/Amazon)
    time.sleep(5)
    
    title = driver.title
    print(f"[Result] Page Title: {title}")
    
    # Always take a screenshot for the report
    capture_screenshot(driver, "universal_check_success")
    
    assert title != "", "Page title should not be empty"
