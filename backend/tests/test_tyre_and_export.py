"""
Backend tests for new tyre fields in setups and data export/import features.
Tests:
1. Setup creation with new tyre fields (tyre_compound, tyre_condition, tyre_type, tyre_size)
2. Setup update with tyre fields
3. Setup retrieval with tyre fields
4. Export data endpoint
5. Import data endpoint
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://rally-inventory.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "demo@rallyteam.com"
TEST_PASSWORD = "rally2024"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL


class TestSetupTyreFields:
    """Tests for new tyre fields in vehicle setups"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def vehicle_id(self, auth_headers):
        """Get first vehicle ID for testing"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers=auth_headers)
        assert response.status_code == 200
        vehicles = response.json()
        assert len(vehicles) > 0, "No vehicles found for testing"
        return vehicles[0]["id"]
    
    def test_create_setup_with_tyre_fields(self, auth_headers, vehicle_id):
        """Test creating a setup with all new tyre fields"""
        setup_data = {
            "name": "TEST_Tyre_Fields_Setup",
            "vehicle_id": vehicle_id,
            "conditions": "dry",
            "tyre_compound": "soft",
            "tyre_condition": "new",
            "tyre_type": "Slick",
            "tyre_size": "205/65R15",
            "tyre_pressure_fl": 28.5,
            "tyre_pressure_fr": 28.5,
            "tyre_pressure_rl": 26.0,
            "tyre_pressure_rr": 26.0,
            "notes": "Test setup with tyre fields"
        }
        
        response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create setup: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_Tyre_Fields_Setup"
        assert data["tyre_compound"] == "soft"
        assert data["tyre_condition"] == "new"
        assert data["tyre_type"] == "Slick"
        assert data["tyre_size"] == "205/65R15"
        
        # Store setup ID for cleanup
        return data["id"]
    
    def test_create_setup_with_medium_compound(self, auth_headers, vehicle_id):
        """Test creating a setup with medium tyre compound"""
        setup_data = {
            "name": "TEST_Medium_Compound_Setup",
            "vehicle_id": vehicle_id,
            "tyre_compound": "medium",
            "tyre_condition": "roaded",
            "tyre_type": "Gravel",
            "tyre_size": "195/70R15"
        }
        
        response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["tyre_compound"] == "medium"
        assert data["tyre_condition"] == "roaded"
        return data["id"]
    
    def test_create_setup_with_hard_compound(self, auth_headers, vehicle_id):
        """Test creating a setup with hard tyre compound"""
        setup_data = {
            "name": "TEST_Hard_Compound_Setup",
            "vehicle_id": vehicle_id,
            "tyre_compound": "hard",
            "tyre_condition": "used",
            "tyre_type": "Wet",
            "tyre_size": "215/60R16"
        }
        
        response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["tyre_compound"] == "hard"
        assert data["tyre_condition"] == "used"
        return data["id"]
    
    def test_create_setup_with_worn_condition(self, auth_headers, vehicle_id):
        """Test creating a setup with worn tyre condition"""
        setup_data = {
            "name": "TEST_Worn_Condition_Setup",
            "vehicle_id": vehicle_id,
            "tyre_compound": "soft",
            "tyre_condition": "worn",
            "tyre_type": "Rally",
            "tyre_size": "185/65R15"
        }
        
        response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["tyre_condition"] == "worn"
        return data["id"]
    
    def test_get_setup_with_tyre_fields(self, auth_headers, vehicle_id):
        """Test retrieving a setup and verifying tyre fields are present"""
        # First create a setup
        setup_data = {
            "name": "TEST_Get_Tyre_Setup",
            "vehicle_id": vehicle_id,
            "tyre_compound": "medium",
            "tyre_condition": "new",
            "tyre_type": "All-terrain",
            "tyre_size": "225/70R16"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert create_response.status_code == 200
        setup_id = create_response.json()["id"]
        
        # Now get the setup
        get_response = requests.get(f"{BASE_URL}/api/setups/{setup_id}", headers=auth_headers)
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["tyre_compound"] == "medium"
        assert data["tyre_condition"] == "new"
        assert data["tyre_type"] == "All-terrain"
        assert data["tyre_size"] == "225/70R16"
        
        return setup_id
    
    def test_update_setup_tyre_fields(self, auth_headers, vehicle_id):
        """Test updating tyre fields on an existing setup"""
        # First create a setup
        setup_data = {
            "name": "TEST_Update_Tyre_Setup",
            "vehicle_id": vehicle_id,
            "tyre_compound": "soft",
            "tyre_condition": "new"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/setups", json=setup_data, headers=auth_headers)
        assert create_response.status_code == 200
        setup_id = create_response.json()["id"]
        
        # Update the tyre fields
        update_data = {
            "tyre_compound": "hard",
            "tyre_condition": "worn",
            "tyre_type": "Updated Type",
            "tyre_size": "200/55R17"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/setups/{setup_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["tyre_compound"] == "hard"
        assert data["tyre_condition"] == "worn"
        assert data["tyre_type"] == "Updated Type"
        assert data["tyre_size"] == "200/55R17"
        
        return setup_id
    
    def test_get_vehicle_setups_includes_tyre_fields(self, auth_headers, vehicle_id):
        """Test that vehicle setups list includes tyre fields"""
        response = requests.get(f"{BASE_URL}/api/setups/vehicle/{vehicle_id}", headers=auth_headers)
        assert response.status_code == 200
        
        setups = response.json()
        assert len(setups) > 0, "No setups found"
        
        # Check that tyre fields are present in the response schema
        for setup in setups:
            assert "tyre_compound" in setup
            assert "tyre_condition" in setup
            assert "tyre_type" in setup
            assert "tyre_size" in setup


class TestDataExportImport:
    """Tests for data export and import features"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_export_data_endpoint(self, auth_headers):
        """Test the export data endpoint returns all user data"""
        response = requests.get(f"{BASE_URL}/api/account/export", headers=auth_headers)
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        data = response.json()
        
        # Verify export structure
        assert "exported_at" in data
        assert "user" in data
        assert "vehicles" in data
        assert "inventory" in data
        assert "repairs" in data
        assert "setups" in data
        assert "stocktakes" in data
        
        # Verify user data
        assert data["user"]["email"] == TEST_EMAIL
        
        # Verify vehicles are included
        assert isinstance(data["vehicles"], list)
        
        # Verify setups include tyre fields
        if len(data["setups"]) > 0:
            setup = data["setups"][0]
            assert "tyre_compound" in setup
            assert "tyre_condition" in setup
            assert "tyre_type" in setup
            assert "tyre_size" in setup
        
        return data
    
    def test_export_data_contains_vehicles(self, auth_headers):
        """Test that export contains user's vehicles"""
        response = requests.get(f"{BASE_URL}/api/account/export", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["vehicles"]) > 0, "Export should contain at least one vehicle"
        
        vehicle = data["vehicles"][0]
        assert "id" in vehicle
        assert "make" in vehicle
        assert "model" in vehicle
    
    def test_import_data_endpoint_empty(self, auth_headers):
        """Test import endpoint with empty data"""
        import_data = {
            "vehicles": [],
            "inventory": [],
            "repairs": [],
            "setups": [],
            "stocktakes": []
        }
        
        response = requests.post(f"{BASE_URL}/api/account/import", json=import_data, headers=auth_headers)
        # Should return success even with empty data
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert "stats" in data
    
    def test_import_data_with_vehicle(self, auth_headers):
        """Test importing a new vehicle"""
        import_data = {
            "vehicles": [
                {
                    "id": "test-import-vehicle-123",
                    "make": "TEST_Import_Make",
                    "model": "TEST_Import_Model",
                    "registration": "TEST123",
                    "vin": "TESTVIN123"
                }
            ],
            "inventory": [],
            "repairs": [],
            "setups": [],
            "stocktakes": []
        }
        
        response = requests.post(f"{BASE_URL}/api/account/import", json=import_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert data["stats"]["vehicles_imported"] == 1
    
    def test_import_data_with_setup_tyre_fields(self, auth_headers):
        """Test importing a setup with tyre fields"""
        # First get a vehicle ID
        vehicles_response = requests.get(f"{BASE_URL}/api/vehicles", headers=auth_headers)
        vehicles = vehicles_response.json()
        
        if len(vehicles) == 0:
            pytest.skip("No vehicles available for import test")
        
        vehicle_id = vehicles[0]["id"]
        
        import_data = {
            "vehicles": [],
            "inventory": [],
            "repairs": [],
            "setups": [
                {
                    "id": "test-import-setup-123",
                    "name": "TEST_Imported_Setup",
                    "vehicle_id": vehicle_id,
                    "tyre_compound": "medium",
                    "tyre_condition": "roaded",
                    "tyre_type": "Imported Tyre Type",
                    "tyre_size": "210/60R15"
                }
            ],
            "stocktakes": []
        }
        
        response = requests.post(f"{BASE_URL}/api/account/import", json=import_data, headers=auth_headers)
        # Note: This may fail if vehicle_id mapping doesn't work, but we're testing the endpoint accepts the data
        assert response.status_code == 200


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_cleanup_test_setups(self, auth_headers):
        """Clean up test setups created during testing"""
        # Get all vehicles
        vehicles_response = requests.get(f"{BASE_URL}/api/vehicles", headers=auth_headers)
        vehicles = vehicles_response.json()
        
        deleted_count = 0
        for vehicle in vehicles:
            # Get setups for this vehicle
            setups_response = requests.get(f"{BASE_URL}/api/setups/vehicle/{vehicle['id']}", headers=auth_headers)
            setups = setups_response.json()
            
            # Delete test setups
            for setup in setups:
                if setup["name"].startswith("TEST_"):
                    delete_response = requests.delete(f"{BASE_URL}/api/setups/{setup['id']}", headers=auth_headers)
                    if delete_response.status_code == 200:
                        deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test setups")
        assert True  # Cleanup is best-effort
    
    def test_cleanup_test_vehicles(self, auth_headers):
        """Clean up test vehicles created during import testing"""
        vehicles_response = requests.get(f"{BASE_URL}/api/vehicles", headers=auth_headers)
        vehicles = vehicles_response.json()
        
        deleted_count = 0
        for vehicle in vehicles:
            if vehicle["make"].startswith("TEST_"):
                delete_response = requests.delete(f"{BASE_URL}/api/vehicles/{vehicle['id']}", headers=auth_headers)
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test vehicles")
        assert True  # Cleanup is best-effort


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
