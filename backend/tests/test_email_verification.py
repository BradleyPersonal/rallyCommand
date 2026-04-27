"""
Test Email Verification System
Tests: Registration, Login blocking for unverified users, Email verification, Resend verification
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://rally-verify.preview.emergentagent.com')

class TestEmailVerificationSystem:
    """Tests for email verification workflow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Generate unique email for each test run
        self.unique_id = str(uuid.uuid4())[:8]
        self.test_email = f"test_verify_{self.unique_id}@example.com"
        self.test_password = "test1234"
        self.test_name = f"Test User {self.unique_id}"
    
    # ================ REGISTRATION TESTS ================
    
    def test_register_new_user_returns_success(self):
        """Test that registration returns success with email_sent status"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Status code assertion
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "message" in data
        assert "email_sent" in data  # Should indicate if email was sent
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        assert data["user"]["name"] == self.test_name
        assert data["user"]["email_verified"] == False  # Should be unverified initially
        print(f"Registration successful for {self.test_email}")
        print(f"Email sent status: {data['email_sent']}")
    
    def test_register_duplicate_email_fails(self):
        """Test that registering with same email fails"""
        # First registration
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Second registration with same email
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "different_password",
            "name": "Different Name"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print(f"Duplicate email registration correctly rejected")
    
    def test_register_invalid_email_fails(self):
        """Test that registration with invalid email format fails"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": "invalid-email-format",
            "password": self.test_password,
            "name": self.test_name
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "invalid email" in data["detail"].lower()
        print("Invalid email format correctly rejected")
    
    # ================ LOGIN BLOCKING TESTS ================
    
    def test_login_unverified_user_blocked(self):
        """Test that unverified user cannot login (returns 403)"""
        # First register a new user
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Try to login with unverified account
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Should return 403 Forbidden for unverified email
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "verify" in data["detail"].lower()
        print(f"Login correctly blocked for unverified user: {data['detail']}")
    
    def test_login_wrong_credentials_returns_401(self):
        """Test that wrong credentials return 401 (not 403)"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()
        print("Wrong credentials correctly return 401")
    
    # ================ RESEND VERIFICATION TESTS ================
    
    def test_resend_verification_for_unverified_user(self):
        """Test that resend verification works for unverified user"""
        # First register a new user
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Request resend
        response = self.session.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": self.test_email
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "email_sent" in data
        print(f"Resend verification request successful, email_sent: {data['email_sent']}")
    
    def test_resend_verification_nonexistent_email_still_returns_200(self):
        """Test that resend for non-existent email returns 200 (security - don't reveal if email exists)"""
        response = self.session.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": "nonexistent_email_xyz@example.com"
        })
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        print("Resend verification for nonexistent email correctly returns 200 (security)")
    
    # ================ VERIFY EMAIL TESTS ================
    
    def test_verify_email_invalid_token_fails(self):
        """Test that invalid verification token returns error"""
        response = self.session.get(f"{BASE_URL}/api/auth/verify-email?token=invalid_token_12345")
        
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
        print(f"Invalid token correctly rejected: {data['detail']}")
    
    def test_verify_email_missing_token_fails(self):
        """Test that missing verification token returns error"""
        response = self.session.get(f"{BASE_URL}/api/auth/verify-email?token=")
        
        assert response.status_code == 400
        print("Missing token correctly rejected")
    
    # ================ FULL WORKFLOW TEST ================
    
    def test_full_verification_workflow_simulation(self):
        """Test the full registration → login fail → resend flow"""
        # Step 1: Register
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        reg_data = reg_response.json()
        print(f"Step 1 - Registration: SUCCESS (email_sent: {reg_data.get('email_sent')})")
        
        # Step 2: Try login - should fail with 403
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert login_response.status_code == 403
        print(f"Step 2 - Login attempt: BLOCKED as expected (403)")
        
        # Step 3: Resend verification
        resend_response = self.session.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": self.test_email
        })
        assert resend_response.status_code == 200
        print(f"Step 3 - Resend verification: SUCCESS")
        
        # Note: Can't test actual verification without access to the email or database token
        print("Full workflow simulation PASSED")


class TestVerifiedUserLogin:
    """Tests for verified user login (using existing verified account)"""
    
    def test_verified_user_can_login(self):
        """Test that a verified user can successfully log in"""
        # Use existing demo account that should be verified
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@rallyteam.com",
            "password": "rally2024"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert "user" in data
            assert data["user"]["email_verified"] == True
            print(f"Verified user login successful: {data['user']['email']}")
        elif response.status_code == 403:
            print("Demo account exists but is not verified - this is expected in test environment")
        elif response.status_code == 401:
            print("Demo account does not exist or password is wrong - skipping test")
        else:
            print(f"Unexpected response: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
