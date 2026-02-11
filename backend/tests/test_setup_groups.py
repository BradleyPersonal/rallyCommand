"""
Test Suite for Setup Groups Feature
Tests: CRUD operations for setup groups, group-setup relationships
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://rally-inventory.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "demo@rallyteam.com"
TEST_PASSWORD = "rally2024"


class TestSetupGroupsFeature:
    """Test Setup Groups CRUD and relationships"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, auth_token):
        """Setup for each test"""
        self.client = api_client
        self.token = auth_token
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
    def test_01_get_vehicles(self, api_client, auth_token):
        """Get vehicles to use for group creation"""
        response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        vehicles = response.json()
        assert isinstance(vehicles, list)
        print(f"Found {len(vehicles)} vehicles")
        if len(vehicles) > 0:
            print(f"First vehicle: {vehicles[0]['make']} {vehicles[0]['model']}")
        return vehicles
    
    def test_02_create_setup_group(self, api_client, auth_token):
        """Test creating a new setup group"""
        # First get a vehicle
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available for testing")
        
        vehicle_id = vehicles[0]['id']
        
        # Create a group
        group_data = {
            "name": f"TEST_Group_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Test Track",
            "date": "2024-01-15"
        }
        
        response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        assert response.status_code == 200, f"Failed to create group: {response.text}"
        group = response.json()
        
        # Verify response structure
        assert "id" in group
        assert group["name"] == group_data["name"]
        assert group["vehicle_id"] == vehicle_id
        assert group["track_name"] == group_data["track_name"]
        assert group["date"] == group_data["date"]
        print(f"Created group: {group['name']} with ID: {group['id']}")
        
        return group
    
    def test_03_get_vehicle_setup_groups(self, api_client, auth_token):
        """Test getting setup groups for a vehicle"""
        # Get vehicles
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        response = api_client.get(f"{BASE_URL}/api/setup-groups/vehicle/{vehicle_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"Found {len(groups)} groups for vehicle {vehicle_id}")
        return groups
    
    def test_04_get_single_setup_group(self, api_client, auth_token):
        """Test getting a single setup group by ID"""
        # First create a group
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create group
        group_data = {
            "name": f"TEST_SingleGet_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Single Test Track",
            "date": "2024-02-20"
        }
        create_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = create_response.json()
        group_id = group['id']
        
        # Get single group
        response = api_client.get(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        assert response.status_code == 200
        fetched_group = response.json()
        assert fetched_group["id"] == group_id
        assert fetched_group["name"] == group_data["name"]
        print(f"Successfully fetched group: {fetched_group['name']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
    def test_05_update_setup_group(self, api_client, auth_token):
        """Test updating a setup group"""
        # Create a group first
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create group
        group_data = {
            "name": f"TEST_Update_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Original Track",
            "date": "2024-03-01"
        }
        create_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = create_response.json()
        group_id = group['id']
        
        # Update group
        update_data = {
            "name": "TEST_Updated_Name",
            "track_name": "Updated Track",
            "date": "2024-03-15"
        }
        response = api_client.put(f"{BASE_URL}/api/setup-groups/{group_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        assert response.status_code == 200
        updated_group = response.json()
        assert updated_group["name"] == update_data["name"]
        assert updated_group["track_name"] == update_data["track_name"]
        assert updated_group["date"] == update_data["date"]
        print(f"Successfully updated group to: {updated_group['name']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_06_delete_setup_group(self, api_client, auth_token):
        """Test deleting a setup group"""
        # Create a group first
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create group
        group_data = {
            "name": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Delete Track",
            "date": "2024-04-01"
        }
        create_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = create_response.json()
        group_id = group['id']
        
        # Delete group
        response = api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        assert response.status_code == 200
        print(f"Successfully deleted group: {group_id}")
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 404
        print("Verified group no longer exists")
    
    def test_07_create_setup_with_group(self, api_client, auth_token):
        """Test creating a setup assigned to a group"""
        # Get vehicles
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create a group
        group_data = {
            "name": f"TEST_SetupGroup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Setup Test Track",
            "date": "2024-05-01"
        }
        group_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = group_response.json()
        group_id = group['id']
        
        # Create setup with group_id
        setup_data = {
            "name": f"TEST_Setup_InGroup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "group_id": group_id,
            "conditions": "dry",
            "tyre_pressure_fl": 28.5,
            "tyre_pressure_fr": 28.5,
            "tyre_pressure_rl": 26.0,
            "tyre_pressure_rr": 26.0
        }
        
        response = api_client.post(f"{BASE_URL}/api/setups", json=setup_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        assert response.status_code == 200, f"Failed to create setup: {response.text}"
        setup = response.json()
        
        assert setup["group_id"] == group_id
        assert setup["name"] == setup_data["name"]
        print(f"Created setup '{setup['name']}' in group '{group['name']}'")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/setups/{setup['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_08_get_group_setups(self, api_client, auth_token):
        """Test getting setups within a group"""
        # Get vehicles
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create a group
        group_data = {
            "name": f"TEST_GroupSetups_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "track_name": "Group Setups Track"
        }
        group_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = group_response.json()
        group_id = group['id']
        
        # Create 2 setups in the group
        setup_ids = []
        for i in range(2):
            setup_data = {
                "name": f"TEST_GroupSetup_{i}_{uuid.uuid4().hex[:8]}",
                "vehicle_id": vehicle_id,
                "group_id": group_id,
                "conditions": "wet" if i == 0 else "dry"
            }
            setup_response = api_client.post(f"{BASE_URL}/api/setups", json=setup_data, headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            })
            setup_ids.append(setup_response.json()['id'])
        
        # Get setups in group
        response = api_client.get(f"{BASE_URL}/api/setup-groups/{group_id}/setups", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        assert response.status_code == 200
        setups = response.json()
        assert len(setups) >= 2
        print(f"Found {len(setups)} setups in group")
        
        # Cleanup
        for setup_id in setup_ids:
            api_client.delete(f"{BASE_URL}/api/setups/{setup_id}", headers={
                "Authorization": f"Bearer {auth_token}"
            })
        api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_09_update_setup_group_assignment(self, api_client, auth_token):
        """Test updating a setup's group assignment"""
        # Get vehicles
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create a group
        group_data = {
            "name": f"TEST_AssignGroup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id
        }
        group_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = group_response.json()
        group_id = group['id']
        
        # Create setup without group
        setup_data = {
            "name": f"TEST_AssignSetup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id
        }
        setup_response = api_client.post(f"{BASE_URL}/api/setups", json=setup_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        setup = setup_response.json()
        setup_id = setup['id']
        
        # Update setup to assign to group
        update_response = api_client.put(f"{BASE_URL}/api/setups/{setup_id}", json={
            "group_id": group_id
        }, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        
        assert update_response.status_code == 200
        updated_setup = update_response.json()
        assert updated_setup["group_id"] == group_id
        print(f"Successfully assigned setup to group")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/setups/{setup_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_10_delete_group_ungroups_setups(self, api_client, auth_token):
        """Test that deleting a group ungroups setups (doesn't delete them)"""
        # Get vehicles
        vehicles_response = api_client.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        vehicles = vehicles_response.json()
        if len(vehicles) == 0:
            pytest.skip("No vehicles available")
        
        vehicle_id = vehicles[0]['id']
        
        # Create a group
        group_data = {
            "name": f"TEST_DeleteUngroup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id
        }
        group_response = api_client.post(f"{BASE_URL}/api/setup-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        group = group_response.json()
        group_id = group['id']
        
        # Create setup in group
        setup_data = {
            "name": f"TEST_UngroupSetup_{uuid.uuid4().hex[:8]}",
            "vehicle_id": vehicle_id,
            "group_id": group_id
        }
        setup_response = api_client.post(f"{BASE_URL}/api/setups", json=setup_data, headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        setup = setup_response.json()
        setup_id = setup['id']
        
        # Delete the group
        delete_response = api_client.delete(f"{BASE_URL}/api/setup-groups/{group_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert delete_response.status_code == 200
        
        # Verify setup still exists but is ungrouped
        get_setup_response = api_client.get(f"{BASE_URL}/api/setups/{setup_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_setup_response.status_code == 200
        setup_after = get_setup_response.json()
        assert setup_after["group_id"] is None
        print(f"Setup still exists and is now ungrouped")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/setups/{setup_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
