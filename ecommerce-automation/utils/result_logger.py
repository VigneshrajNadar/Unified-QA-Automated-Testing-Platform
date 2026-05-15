import os
from datetime import datetime

def capture_screenshot(driver, test_name):
    # Ensure reports directory exists
    report_dir = os.path.join(os.getcwd(), 'reports', 'screenshots')
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)

    time_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Clean test name for filename
    clean_test_name = test_name.replace("::", "_").replace(".", "_")
    file_name = f"{clean_test_name}_{time_stamp}.png"
    file_path = os.path.join(report_dir, file_name)
    
    driver.save_screenshot(file_path)
    return file_path
