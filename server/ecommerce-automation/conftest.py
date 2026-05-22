import pytest
import sys
import os

# Add the project root to python path so tests can import pages/utils
sys.path.append(os.getcwd())

from utils.driver_setup import get_driver
from utils.result_logger import capture_screenshot

@pytest.fixture
def driver():
    driver = get_driver()
    yield driver
    driver.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()

    if rep.when == "call" and rep.failed:
        # Check if 'driver' fixture is present
        if "driver" in item.funcargs:
            driver = item.funcargs["driver"]
            capture_screenshot(driver, item.name)

def pytest_addoption(parser):
    parser.addoption("--url", action="store", default="https://www.google.com", help="Target URL for universal test")

@pytest.fixture
def target_url(request):
    return request.config.getoption("--url")
