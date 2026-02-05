#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class RallyCommandAPITester:
    def __init__(self, base_url="https://car-tracker-46.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@rally.team"
        test_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test Rally Team"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.test_email = test_email
            return True
        return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not hasattr(self, 'test_email'):
            self.log_test("User Login", False, "No registered user to test login")
            return False
            
        login_data = {
            "email": self.test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if success and 'token' in response:
            self.token = response['token']  # Update token
            return True
        return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        return self.run_test("Get User Profile", "GET", "auth/me", 200)

    def test_create_inventory_item(self):
        """Test creating inventory item"""
        item_data = {
            "name": "Test Brake Pads",
            "category": "parts",
            "quantity": 10,
            "location": "Garage A - Shelf 2",
            "part_number": "BP-001",
            "supplier": "Rally Parts Co",
            "price": 89.99,
            "min_stock": 2,
            "notes": "High performance brake pads for rally racing"
        }
        
        success, response = self.run_test("Create Inventory Item", "POST", "inventory", 200, item_data)
        
        if success and 'id' in response:
            self.test_item_id = response['id']
            return True
        return False

    def test_get_inventory_items(self):
        """Test getting inventory items"""
        return self.run_test("Get Inventory Items", "GET", "inventory", 200)

    def test_get_inventory_item_by_id(self):
        """Test getting specific inventory item"""
        if not hasattr(self, 'test_item_id'):
            self.log_test("Get Item by ID", False, "No test item created")
            return False
            
        return self.run_test("Get Item by ID", "GET", f"inventory/{self.test_item_id}", 200)

    def test_update_inventory_item(self):
        """Test updating inventory item"""
        if not hasattr(self, 'test_item_id'):
            self.log_test("Update Item", False, "No test item created")
            return False
            
        update_data = {
            "quantity": 15,
            "price": 95.99,
            "notes": "Updated: Premium brake pads with improved performance"
        }
        
        return self.run_test("Update Item", "PUT", f"inventory/{self.test_item_id}", 200, update_data)

    def test_search_inventory(self):
        """Test inventory search functionality"""
        return self.run_test("Search Inventory", "GET", "inventory?search=brake", 200)

    def test_filter_by_category(self):
        """Test filtering inventory by category"""
        return self.run_test("Filter by Category", "GET", "inventory?category=parts", 200)

    def test_low_stock_filter(self):
        """Test low stock filter"""
        return self.run_test("Low Stock Filter", "GET", "inventory?low_stock=true", 200)

    def test_create_usage_log(self):
        """Test creating usage log"""
        if not hasattr(self, 'test_item_id'):
            self.log_test("Create Usage Log", False, "No test item created")
            return False
            
        usage_data = {
            "item_id": self.test_item_id,
            "quantity_used": 2,
            "reason": "Replaced worn brake pads",
            "event_name": "Rally Championship Round 3"
        }
        
        success, response = self.run_test("Create Usage Log", "POST", "usage", 200, usage_data)
        
        if success and 'id' in response:
            self.test_usage_id = response['id']
            return True
        return False

    def test_get_usage_logs(self):
        """Test getting usage logs for item"""
        if not hasattr(self, 'test_item_id'):
            self.log_test("Get Usage Logs", False, "No test item created")
            return False
            
        return self.run_test("Get Usage Logs", "GET", f"usage/{self.test_item_id}", 200)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_delete_inventory_item(self):
        """Test deleting inventory item"""
        if not hasattr(self, 'test_item_id'):
            self.log_test("Delete Item", False, "No test item created")
            return False
            
        return self.run_test("Delete Item", "DELETE", f"inventory/{self.test_item_id}", 200)

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test 404 for non-existent item
        success, _ = self.run_test("404 for Non-existent Item", "GET", "inventory/invalid-id", 404)
        
        # Test unauthorized access (without token)
        old_token = self.token
        self.token = None
        success2, _ = self.run_test("Unauthorized Access", "GET", "inventory", 401)
        self.token = old_token
        
        return success and success2

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting RallyCommand API Tests...")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_user_profile,
            self.test_create_inventory_item,
            self.test_get_inventory_items,
            self.test_get_inventory_item_by_id,
            self.test_update_inventory_item,
            self.test_search_inventory,
            self.test_filter_by_category,
            self.test_low_stock_filter,
            self.test_create_usage_log,
            self.test_get_usage_logs,
            self.test_dashboard_stats,
            self.test_invalid_endpoints,
            self.test_delete_inventory_item,
        ]

        for test in tests:
            test()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
            return 1

def main():
    tester = RallyCommandAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())