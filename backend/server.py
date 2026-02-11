from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import httpx
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import hashlib
import jwt
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'rallycommand-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Resend Configuration (using HTTP API)
# Check multiple possible env var names for flexibility
RESEND_API_KEY = os.environ.get('RESEND_API_KEY') or os.environ.get('resend_api_key') or os.environ.get('RESEND_KEY') or ''
RESEND_API_URL = "https://api.resend.com/emails"
FEEDBACK_RECIPIENT = "francisdevstudios@gmail.com"

# Log API key status on startup
if RESEND_API_KEY:
    print(f"✓ Resend API key configured (starts with: {RESEND_API_KEY[:10]}...)")
else:
    print("⚠ WARNING: RESEND_API_KEY not found in environment variables!")

# Create the main app
# Disable redirect_slashes to prevent 405 errors on POST requests in production
app = FastAPI(redirect_slashes=False)

# CORS middleware - must be added before routes
# Using allow_origin_regex to allow all origins while supporting credentials
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None  # Required when changing email

class AccountDelete(BaseModel):
    password: str

class InventoryItemCreate(BaseModel):
    name: str
    category: str  # parts, tools, fluids
    subcategory: str = ""  # panel, suspension, driveline, powertrain, other (only for parts)
    condition: str = ""  # new, used-good, used-fair, poor-damaged (only for parts)
    quantity: int = 0
    location: str = ""
    part_number: str = ""
    supplier: str = ""
    supplier_url: str = ""
    price: float = 0.0
    min_stock: int = 1
    notes: str = ""
    photos: List[str] = []
    vehicle_ids: List[str] = []

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    location: Optional[str] = None
    part_number: Optional[str] = None
    supplier: Optional[str] = None
    supplier_url: Optional[str] = None
    price: Optional[float] = None
    min_stock: Optional[int] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    vehicle_ids: Optional[List[str]] = None

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    subcategory: str = ""
    condition: str = ""
    quantity: int
    location: str
    part_number: str
    supplier: str
    supplier_url: str = ""
    price: float
    min_stock: int
    notes: str
    photos: List[str] = []
    vehicle_ids: List[str] = []
    user_id: str
    created_at: str
    updated_at: str

class UsageLogCreate(BaseModel):
    item_id: str
    quantity_used: int
    reason: str = ""
    event_name: str = ""

class UsageLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    item_id: str
    user_id: str
    quantity_used: int
    reason: str
    event_name: str
    created_at: str

class VehicleCreate(BaseModel):
    make: str
    model: str
    registration: str = ""
    vin: str = ""
    photo: str = ""

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    registration: Optional[str] = None
    vin: Optional[str] = None
    photo: Optional[str] = None

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    make: str
    model: str
    registration: str
    vin: str
    photo: str
    user_id: str
    created_at: str
    updated_at: str

class CornerValues(BaseModel):
    front_left: float = 0
    front_right: float = 0
    rear_left: float = 0
    rear_right: float = 0

class SetupCreate(BaseModel):
    name: str
    vehicle_id: str
    group_id: Optional[str] = None  # Optional group assignment
    conditions: str = ""  # e.g., raining, sunny, dry, wet, mixed
    # Tyre information
    tyre_compound: str = ""  # hard, medium, soft
    tyre_type: str = ""  # slick, wet, rally, gravel
    tyre_size: str = ""
    tyre_condition: str = ""  # new, roaded, used, poor
    # Tyre pressures
    tyre_pressure_fl: float = 0
    tyre_pressure_fr: float = 0
    tyre_pressure_rl: float = 0
    tyre_pressure_rr: float = 0
    ride_height_fl: float = 0
    ride_height_fr: float = 0
    ride_height_rl: float = 0
    ride_height_rr: float = 0
    camber_front: float = 0
    camber_rear: float = 0
    toe_front: float = 0
    toe_rear: float = 0
    spring_rate_front: float = 0
    spring_rate_rear: float = 0
    damper_front: float = 0
    damper_rear: float = 0
    arb_front: float = 0
    arb_rear: float = 0
    aero_front: str = ""
    aero_rear: str = ""
    event_name: str = ""
    event_date: str = ""
    rating: int = 0
    notes: str = ""

class SetupUpdate(BaseModel):
    name: Optional[str] = None
    group_id: Optional[str] = None  # Can be set to assign to group, or "" to remove from group
    conditions: Optional[str] = None
    tyre_compound: Optional[str] = None
    tyre_type: Optional[str] = None
    tyre_size: Optional[str] = None
    tyre_condition: Optional[str] = None
    tyre_pressure_fl: Optional[float] = None
    tyre_pressure_fr: Optional[float] = None
    tyre_pressure_rl: Optional[float] = None
    tyre_pressure_rr: Optional[float] = None
    ride_height_fl: Optional[float] = None
    ride_height_fr: Optional[float] = None
    ride_height_rl: Optional[float] = None
    ride_height_rr: Optional[float] = None
    camber_front: Optional[float] = None
    camber_rear: Optional[float] = None
    toe_front: Optional[float] = None
    toe_rear: Optional[float] = None
    spring_rate_front: Optional[float] = None
    spring_rate_rear: Optional[float] = None
    damper_front: Optional[float] = None
    damper_rear: Optional[float] = None
    arb_front: Optional[float] = None
    arb_rear: Optional[float] = None
    aero_front: Optional[str] = None
    aero_rear: Optional[str] = None
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    rating: Optional[int] = None
    notes: Optional[str] = None

class Setup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    vehicle_id: str
    user_id: str
    group_id: Optional[str] = None  # Optional group assignment
    conditions: str = ""
    tyre_compound: str = ""
    tyre_type: str = ""
    tyre_size: str = ""
    tyre_condition: str = ""
    tyre_pressure_fl: float = 0
    tyre_pressure_fr: float = 0
    tyre_pressure_rl: float = 0
    tyre_pressure_rr: float = 0
    ride_height_fl: float = 0
    ride_height_fr: float = 0
    ride_height_rl: float = 0
    ride_height_rr: float = 0
    camber_front: float = 0
    camber_rear: float = 0
    toe_front: float = 0
    toe_rear: float = 0
    spring_rate_front: float = 0
    spring_rate_rear: float = 0
    damper_front: float = 0
    damper_rear: float = 0
    arb_front: float = 0
    arb_rear: float = 0
    aero_front: str = ""
    aero_rear: str = ""
    event_name: str = ""
    event_date: str = ""
    rating: int = 0
    notes: str = ""
    created_at: str = ""
    updated_at: str = ""

# Setup Group Models
class SetupGroupCreate(BaseModel):
    name: str
    vehicle_id: str
    track_name: str = ""
    date: str = ""

class SetupGroupUpdate(BaseModel):
    name: Optional[str] = None
    track_name: Optional[str] = None
    date: Optional[str] = None

class SetupGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    vehicle_id: str
    user_id: str
    track_name: str = ""
    date: str = ""
    created_at: str = ""
    updated_at: str = ""

class DashboardStats(BaseModel):
    total_items: int
    low_stock_count: int
    total_value: float
    categories: dict
    recent_activity: List[dict]
    recent_setups: List[dict] = []
    recent_repairs: List[dict] = []

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Validate email
    if not re.match(r"[^@]+@[^@]+\.[^@]+", user_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email.lower())
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email.lower(),
            name=user_data.name,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one(
        {"email": credentials.email.lower()},
        {"_id": 0}
    )
    if not user or user["password"] != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ============== ACCOUNT ROUTES ==============

@api_router.put("/account")
async def update_account(update_data: AccountUpdate, current_user: dict = Depends(get_current_user)):
    """Update account details. Email change requires password confirmation."""
    updates = {}
    
    # Update name if provided
    if update_data.name is not None:
        if not update_data.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        updates["name"] = update_data.name.strip()
    
    # Update email if provided (requires password)
    if update_data.email is not None:
        if not update_data.current_password:
            raise HTTPException(status_code=400, detail="Password required to change email")
        
        # Verify current password
        if current_user["password"] != hash_password(update_data.current_password):
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        # Validate new email
        new_email = update_data.email.lower().strip()
        if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email is already in use
        existing = await db.users.find_one({"email": new_email, "id": {"$ne": current_user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        
        updates["email"] = new_email
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": updates}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated_user

@api_router.get("/account/export")
async def export_account_data(current_user: dict = Depends(get_current_user)):
    """Export all user data as JSON."""
    user_id = current_user["id"]
    
    # Gather all user data
    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {
            "id": current_user["id"],
            "email": current_user["email"],
            "name": current_user["name"],
            "created_at": current_user.get("created_at")
        },
        "vehicles": [],
        "inventory": [],
        "repairs": [],
        "setups": [],
        "stocktakes": [],
        "feedback": []
    }
    
    # Get vehicles
    vehicles = await db.vehicles.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    export_data["vehicles"] = vehicles
    
    # Get inventory
    inventory = await db.inventory.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    export_data["inventory"] = inventory
    
    # Get repairs
    repairs = await db.repairs.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    export_data["repairs"] = repairs
    
    # Get setups for user's vehicles
    vehicle_ids = [v["id"] for v in vehicles]
    if vehicle_ids:
        setups = await db.setups.find({"vehicle_id": {"$in": vehicle_ids}}, {"_id": 0}).to_list(None)
        export_data["setups"] = setups
    
    # Get stocktakes
    stocktakes = await db.stocktake_records.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    export_data["stocktakes"] = stocktakes
    
    # Get feedback
    feedback = await db.feedback.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    export_data["feedback"] = feedback
    
    return export_data

class ImportData(BaseModel):
    vehicles: List[dict] = []
    inventory: List[dict] = []
    repairs: List[dict] = []
    setups: List[dict] = []
    stocktakes: List[dict] = []

@api_router.post("/account/import")
async def import_account_data(import_data: ImportData, current_user: dict = Depends(get_current_user)):
    """Import user data from a JSON file. Creates new records with new IDs."""
    user_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()
    
    stats = {
        "vehicles_imported": 0,
        "inventory_imported": 0,
        "repairs_imported": 0,
        "setups_imported": 0,
        "stocktakes_imported": 0,
        "errors": []
    }
    
    # Map old vehicle IDs to new ones
    vehicle_id_map = {}
    
    # Import vehicles
    for vehicle in import_data.vehicles:
        try:
            old_id = vehicle.get("id")
            new_id = str(uuid.uuid4())
            vehicle_id_map[old_id] = new_id
            
            new_vehicle = {
                "id": new_id,
                "make": vehicle.get("make", "Unknown"),
                "model": vehicle.get("model", "Unknown"),
                "registration": vehicle.get("registration", ""),
                "vin": vehicle.get("vin", ""),
                "photo": vehicle.get("photo", ""),
                "user_id": user_id,
                "created_at": now,
                "updated_at": now
            }
            await db.vehicles.insert_one(new_vehicle)
            stats["vehicles_imported"] += 1
        except Exception as e:
            stats["errors"].append(f"Vehicle import error: {str(e)}")
    
    # Import inventory
    for item in import_data.inventory:
        try:
            # Map old vehicle IDs to new ones
            old_vehicle_ids = item.get("vehicle_ids", [])
            new_vehicle_ids = [vehicle_id_map.get(vid, vid) for vid in old_vehicle_ids if vid in vehicle_id_map]
            
            new_item = {
                "id": str(uuid.uuid4()),
                "name": item.get("name", "Unknown"),
                "part_number": item.get("part_number", ""),
                "category": item.get("category", "parts"),
                "subcategory": item.get("subcategory", ""),
                "quantity": item.get("quantity", 0),
                "min_stock": item.get("min_stock", 1),
                "price": item.get("price", 0),
                "supplier": item.get("supplier", ""),
                "location": item.get("location", ""),
                "notes": item.get("notes", ""),
                "photos": item.get("photos", []),
                "vehicle_ids": new_vehicle_ids,
                "condition": item.get("condition", ""),
                "user_id": user_id,
                "created_at": now,
                "updated_at": now
            }
            await db.inventory.insert_one(new_item)
            stats["inventory_imported"] += 1
        except Exception as e:
            stats["errors"].append(f"Inventory import error: {str(e)}")
    
    # Import repairs
    for repair in import_data.repairs:
        try:
            old_vehicle_id = repair.get("vehicle_id")
            new_vehicle_id = vehicle_id_map.get(old_vehicle_id)
            
            if not new_vehicle_id:
                stats["errors"].append(f"Repair skipped: vehicle not found")
                continue
            
            new_repair = {
                "id": str(uuid.uuid4()),
                "vehicle_id": new_vehicle_id,
                "cause_of_damage": repair.get("cause_of_damage", ""),
                "affected_area": repair.get("affected_area", ""),
                "parts_used": repair.get("parts_used", []),
                "total_parts_cost": repair.get("total_parts_cost", 0),
                "repair_details": repair.get("repair_details", ""),
                "technicians": repair.get("technicians", []),
                "user_id": user_id,
                "created_at": now,
                "updated_at": now
            }
            await db.repairs.insert_one(new_repair)
            stats["repairs_imported"] += 1
        except Exception as e:
            stats["errors"].append(f"Repair import error: {str(e)}")
    
    # Import setups
    for setup in import_data.setups:
        try:
            old_vehicle_id = setup.get("vehicle_id")
            new_vehicle_id = vehicle_id_map.get(old_vehicle_id)
            
            if not new_vehicle_id:
                stats["errors"].append(f"Setup skipped: vehicle not found")
                continue
            
            new_setup = {
                "id": str(uuid.uuid4()),
                "name": setup.get("name", "Imported Setup"),
                "vehicle_id": new_vehicle_id,
                "user_id": user_id,
                "conditions": setup.get("conditions", ""),
                "tyre_compound": setup.get("tyre_compound", ""),
                "tyre_type": setup.get("tyre_type", ""),
                "tyre_size": setup.get("tyre_size", ""),
                "tyre_condition": setup.get("tyre_condition", ""),
                "tyre_pressure_fl": setup.get("tyre_pressure_fl", 0),
                "tyre_pressure_fr": setup.get("tyre_pressure_fr", 0),
                "tyre_pressure_rl": setup.get("tyre_pressure_rl", 0),
                "tyre_pressure_rr": setup.get("tyre_pressure_rr", 0),
                "ride_height_fl": setup.get("ride_height_fl", 0),
                "ride_height_fr": setup.get("ride_height_fr", 0),
                "ride_height_rl": setup.get("ride_height_rl", 0),
                "ride_height_rr": setup.get("ride_height_rr", 0),
                "camber_front": setup.get("camber_front", 0),
                "camber_rear": setup.get("camber_rear", 0),
                "toe_front": setup.get("toe_front", 0),
                "toe_rear": setup.get("toe_rear", 0),
                "spring_rate_front": setup.get("spring_rate_front", 0),
                "spring_rate_rear": setup.get("spring_rate_rear", 0),
                "damper_front": setup.get("damper_front", 0),
                "damper_rear": setup.get("damper_rear", 0),
                "arb_front": setup.get("arb_front", 0),
                "arb_rear": setup.get("arb_rear", 0),
                "aero_front": setup.get("aero_front", ""),
                "aero_rear": setup.get("aero_rear", ""),
                "event_name": setup.get("event_name", ""),
                "event_date": setup.get("event_date", ""),
                "rating": setup.get("rating", 0),
                "notes": setup.get("notes", ""),
                "created_at": now,
                "updated_at": now
            }
            await db.setups.insert_one(new_setup)
            stats["setups_imported"] += 1
        except Exception as e:
            stats["errors"].append(f"Setup import error: {str(e)}")
    
    # Import stocktakes
    for stocktake in import_data.stocktakes:
        try:
            new_stocktake = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "items": stocktake.get("items", []),
                "notes": stocktake.get("notes", ""),
                "status": stocktake.get("status", "completed"),
                "created_at": now,
                "applied_at": stocktake.get("applied_at")
            }
            await db.stocktake_records.insert_one(new_stocktake)
            stats["stocktakes_imported"] += 1
        except Exception as e:
            stats["errors"].append(f"Stocktake import error: {str(e)}")
    
    return {
        "status": "success",
        "message": "Data imported successfully",
        "stats": stats
    }

@api_router.delete("/account")
async def delete_account(delete_data: AccountDelete, current_user: dict = Depends(get_current_user)):
    """Delete account and all associated data. Requires password confirmation."""
    # Verify password
    if current_user["password"] != hash_password(delete_data.password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    user_id = current_user["id"]
    
    # Get vehicle IDs for deleting setups
    vehicles = await db.vehicles.find({"user_id": user_id}, {"id": 1}).to_list(None)
    vehicle_ids = [v["id"] for v in vehicles]
    
    # Delete all user data
    await db.inventory.delete_many({"user_id": user_id})
    await db.usage_logs.delete_many({"user_id": user_id})
    await db.repairs.delete_many({"user_id": user_id})
    await db.stocktake_records.delete_many({"user_id": user_id})
    await db.feedback.delete_many({"user_id": user_id})
    
    # Delete setups for user's vehicles
    if vehicle_ids:
        await db.setups.delete_many({"vehicle_id": {"$in": vehicle_ids}})
    
    # Delete vehicles
    await db.vehicles.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"status": "success", "message": "Account and all data deleted"}


# ============== INVENTORY ROUTES ==============

@api_router.post("/inventory", response_model=InventoryItem)
async def create_item(item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Only set subcategory and condition if category is 'parts'
    subcategory = item.subcategory if item.category == 'parts' else ""
    condition = item.condition if item.category == 'parts' else ""
    
    item_doc = {
        "id": item_id,
        "name": item.name,
        "category": item.category,
        "subcategory": subcategory,
        "condition": condition,
        "quantity": item.quantity,
        "location": item.location,
        "part_number": item.part_number,
        "supplier": item.supplier,
        "supplier_url": item.supplier_url,
        "price": item.price,
        "min_stock": item.min_stock,
        "notes": item.notes,
        "photos": item.photos[:3],  # Limit to 3 photos
        "vehicle_ids": item.vehicle_ids[:2],  # Limit to 2 vehicles
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    await db.inventory.insert_one(item_doc)
    
    return InventoryItem(**item_doc)

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_items(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    vehicle_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    
    if category:
        query["category"] = category
    
    if subcategory:
        query["subcategory"] = subcategory
    
    if vehicle_id:
        query["vehicle_ids"] = vehicle_id
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"part_number": {"$regex": search, "$options": "i"}},
            {"supplier": {"$regex": search, "$options": "i"}}
        ]
    
    items = await db.inventory.find(query, {"_id": 0}).to_list(1000)
    
    if low_stock:
        items = [item for item in items if item["quantity"] <= item["min_stock"]]
    
    return [InventoryItem(**item) for item in items]

@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one(
        {"id": item_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return InventoryItem(**item)

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_item(
    item_id: str,
    update: InventoryItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    item = await db.inventory.find_one(
        {"id": item_id, "user_id": current_user["id"]}
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Clear subcategory and condition if category is changed to non-parts
    if update.category and update.category != 'parts':
        update_data["subcategory"] = ""
        update_data["condition"] = ""
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    updated_item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    return InventoryItem(**updated_item)

@api_router.delete("/inventory/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.inventory.delete_one(
        {"id": item_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Also delete usage logs for this item
    await db.usage_logs.delete_many({"item_id": item_id})
    
    return {"message": "Item deleted successfully"}

# ============== USAGE LOG ROUTES ==============

@api_router.post("/usage", response_model=UsageLog)
async def create_usage_log(
    log: UsageLogCreate,
    current_user: dict = Depends(get_current_user)
):
    # Verify item exists and belongs to user
    item = await db.inventory.find_one(
        {"id": log.item_id, "user_id": current_user["id"]}
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update item quantity
    new_quantity = item["quantity"] - log.quantity_used
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient quantity")
    
    await db.inventory.update_one(
        {"id": log.item_id},
        {"$set": {
            "quantity": new_quantity,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create usage log
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    log_doc = {
        "id": log_id,
        "item_id": log.item_id,
        "user_id": current_user["id"],
        "quantity_used": log.quantity_used,
        "reason": log.reason,
        "event_name": log.event_name,
        "created_at": now
    }
    await db.usage_logs.insert_one(log_doc)
    
    return UsageLog(**log_doc)

@api_router.get("/usage/{item_id}", response_model=List[UsageLog])
async def get_usage_logs(item_id: str, current_user: dict = Depends(get_current_user)):
    logs = await db.usage_logs.find(
        {"item_id": item_id, "user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [UsageLog(**log) for log in logs]

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    total_items = len(items)
    low_stock_count = sum(1 for item in items if item["quantity"] <= item["min_stock"])
    total_value = sum(item["price"] * item["quantity"] for item in items)
    
    categories = {}
    for item in items:
        cat = item["category"]
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    # Recent activity (usage logs)
    recent_logs = await db.usage_logs.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    # Enrich logs with item names - only include logs where item still exists
    recent_activity = []
    for log in recent_logs:
        item = await db.inventory.find_one({"id": log["item_id"]}, {"_id": 0, "name": 1})
        if item:  # Only add if item still exists
            recent_activity.append({
                "id": log["id"],
                "item_id": log["item_id"],
                "item_name": item["name"],
                "quantity_used": log["quantity_used"],
                "reason": log["reason"],
                "event_name": log["event_name"],
                "created_at": log["created_at"]
            })
    
    # Get recent setups with vehicle info
    recent_setups_raw = await db.setups.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    recent_setups = []
    for setup in recent_setups_raw:
        vehicle = await db.vehicles.find_one({"id": setup["vehicle_id"]}, {"_id": 0, "make": 1, "model": 1})
        if vehicle:
            recent_setups.append({
                "id": setup["id"],
                "name": setup["name"],
                "vehicle_id": setup["vehicle_id"],
                "vehicle_name": f"{vehicle['make']} {vehicle['model']}",
                "event_name": setup.get("event_name", ""),
                "conditions": setup.get("conditions", ""),
                "rating": setup.get("rating", 0),
                "created_at": setup["created_at"]
            })
    
    # Get recent repairs with vehicle info
    recent_repairs_raw = await db.repairs.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    recent_repairs = []
    for repair in recent_repairs_raw:
        vehicle = await db.vehicles.find_one({"id": repair["vehicle_id"]}, {"_id": 0, "make": 1, "model": 1})
        if vehicle:
            recent_repairs.append({
                "id": repair["id"],
                "vehicle_id": repair["vehicle_id"],
                "vehicle_name": f"{vehicle['make']} {vehicle['model']}",
                "cause_of_damage": repair["cause_of_damage"],
                "affected_area": repair.get("affected_area", ""),
                "total_parts_cost": repair["total_parts_cost"],
                "created_at": repair["created_at"]
            })
    
    return DashboardStats(
        total_items=total_items,
        low_stock_count=low_stock_count,
        total_value=total_value,
        categories=categories,
        recent_activity=recent_activity,
        recent_setups=recent_setups,
        recent_repairs=recent_repairs
    )

# ============== VEHICLE ROUTES ==============

@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle: VehicleCreate, current_user: dict = Depends(get_current_user)):
    # Check if user already has 2 vehicles
    existing_count = await db.vehicles.count_documents({"user_id": current_user["id"]})
    if existing_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum 2 vehicles allowed")
    
    vehicle_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    vehicle_doc = {
        "id": vehicle_id,
        "make": vehicle.make,
        "model": vehicle.model,
        "registration": vehicle.registration,
        "vin": vehicle.vin,
        "photo": vehicle.photo,
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    await db.vehicles.insert_one(vehicle_doc)
    
    return Vehicle(**vehicle_doc)

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    vehicles = await db.vehicles.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(2)
    
    return [Vehicle(**v) for v in vehicles]

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one(
        {"id": vehicle_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return Vehicle(**vehicle)

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: str,
    update: VehicleUpdate,
    current_user: dict = Depends(get_current_user)
):
    vehicle = await db.vehicles.find_one(
        {"id": vehicle_id, "user_id": current_user["id"]}
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": update_data}
    )
    
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return Vehicle(**updated_vehicle)

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vehicles.delete_one(
        {"id": vehicle_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Remove this vehicle from all inventory items
    await db.inventory.update_many(
        {"user_id": current_user["id"], "vehicle_ids": vehicle_id},
        {"$pull": {"vehicle_ids": vehicle_id}}
    )
    
    # Delete all setups for this vehicle
    await db.setups.delete_many({"vehicle_id": vehicle_id})
    
    # Delete all repairs for this vehicle
    await db.repairs.delete_many({"vehicle_id": vehicle_id})
    
    return {"message": "Vehicle deleted successfully"}

# ============== SETUP ROUTES ==============

@api_router.post("/setups", response_model=Setup)
async def create_setup(setup: SetupCreate, current_user: dict = Depends(get_current_user)):
    # Verify vehicle exists and belongs to user
    vehicle = await db.vehicles.find_one(
        {"id": setup.vehicle_id, "user_id": current_user["id"]}
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Verify group exists if provided
    if setup.group_id:
        group = await db.setup_groups.find_one(
            {"id": setup.group_id, "user_id": current_user["id"], "vehicle_id": setup.vehicle_id}
        )
        if not group:
            raise HTTPException(status_code=404, detail="Setup group not found")
    
    setup_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    setup_doc = {
        "id": setup_id,
        "name": setup.name,
        "vehicle_id": setup.vehicle_id,
        "user_id": current_user["id"],
        "group_id": setup.group_id,
        "conditions": setup.conditions,
        "tyre_compound": setup.tyre_compound,
        "tyre_type": setup.tyre_type,
        "tyre_size": setup.tyre_size,
        "tyre_condition": setup.tyre_condition,
        "tyre_pressure_fl": setup.tyre_pressure_fl,
        "tyre_pressure_fr": setup.tyre_pressure_fr,
        "tyre_pressure_rl": setup.tyre_pressure_rl,
        "tyre_pressure_rr": setup.tyre_pressure_rr,
        "ride_height_fl": setup.ride_height_fl,
        "ride_height_fr": setup.ride_height_fr,
        "ride_height_rl": setup.ride_height_rl,
        "ride_height_rr": setup.ride_height_rr,
        "camber_front": setup.camber_front,
        "camber_rear": setup.camber_rear,
        "toe_front": setup.toe_front,
        "toe_rear": setup.toe_rear,
        "spring_rate_front": setup.spring_rate_front,
        "spring_rate_rear": setup.spring_rate_rear,
        "damper_front": setup.damper_front,
        "damper_rear": setup.damper_rear,
        "arb_front": setup.arb_front,
        "arb_rear": setup.arb_rear,
        "aero_front": setup.aero_front,
        "aero_rear": setup.aero_rear,
        "event_name": setup.event_name,
        "event_date": setup.event_date,
        "rating": min(max(setup.rating, 0), 5),
        "notes": setup.notes,
        "created_at": now,
        "updated_at": now
    }
    await db.setups.insert_one(setup_doc)
    
    return Setup(**setup_doc)

@api_router.get("/setups/vehicle/{vehicle_id}", response_model=List[Setup])
async def get_vehicle_setups(
    vehicle_id: str, 
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"vehicle_id": vehicle_id, "user_id": current_user["id"]}
    
    # If search parameter is provided, search in name, event_name, and conditions
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"event_name": {"$regex": search, "$options": "i"}},
            {"conditions": {"$regex": search, "$options": "i"}}
        ]
    
    setups = await db.setups.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [Setup(**s) for s in setups]

@api_router.get("/setups/{setup_id}", response_model=Setup)
async def get_setup(setup_id: str, current_user: dict = Depends(get_current_user)):
    setup = await db.setups.find_one(
        {"id": setup_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")
    return Setup(**setup)

@api_router.put("/setups/{setup_id}", response_model=Setup)
async def update_setup(
    setup_id: str,
    update: SetupUpdate,
    current_user: dict = Depends(get_current_user)
):
    setup = await db.setups.find_one(
        {"id": setup_id, "user_id": current_user["id"]}
    )
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Handle group_id - allow setting to empty string to remove from group
    if "group_id" in update.model_dump():
        group_id_value = update.group_id
        if group_id_value == "" or group_id_value is None:
            update_data["group_id"] = None
        else:
            # Verify group exists and belongs to same vehicle
            group = await db.setup_groups.find_one(
                {"id": group_id_value, "user_id": current_user["id"], "vehicle_id": setup["vehicle_id"]}
            )
            if not group:
                raise HTTPException(status_code=404, detail="Setup group not found or belongs to different vehicle")
            update_data["group_id"] = group_id_value
    
    if "rating" in update_data:
        update_data["rating"] = min(max(update_data["rating"], 0), 5)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.setups.update_one(
        {"id": setup_id},
        {"$set": update_data}
    )
    
    updated_setup = await db.setups.find_one({"id": setup_id}, {"_id": 0})
    return Setup(**updated_setup)

@api_router.delete("/setups/{setup_id}")
async def delete_setup(setup_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.setups.delete_one(
        {"id": setup_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Setup not found")
    
    return {"message": "Setup deleted successfully"}

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def api_root():
    return {"message": "RallyCommand API"}

# Health check at actual root "/" for deployment platforms
@app.get("/")
async def root():
    return {"status": "ok", "message": "RallyCommand API is running"}

# ============== REPAIR LOG MODELS ==============

class RepairPartUsed(BaseModel):
    name: str
    source: str  # 'inventory' or 'new'
    inventory_item_id: Optional[str] = None
    quantity: int = 1
    cost: float = 0.0

class RepairLogCreate(BaseModel):
    vehicle_id: str
    cause_of_damage: str
    affected_area: str = ""
    parts_used: List[RepairPartUsed] = []
    total_parts_cost: float = 0.0
    repair_details: str = ""
    technicians: List[str] = []

class RepairLogUpdate(BaseModel):
    cause_of_damage: Optional[str] = None
    affected_area: Optional[str] = None
    parts_used: Optional[List[RepairPartUsed]] = None
    total_parts_cost: Optional[float] = None
    repair_details: Optional[str] = None
    technicians: Optional[List[str]] = None

class RepairLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_id: str
    user_id: str
    cause_of_damage: str
    affected_area: str = ""
    parts_used: List[dict]
    total_parts_cost: float
    repair_details: str
    technicians: List[str]
    created_at: str
    updated_at: str

# ============== REPAIR LOG ROUTES ==============

@api_router.post("/repairs", response_model=RepairLog)
async def create_repair_log(repair: RepairLogCreate, current_user: dict = Depends(get_current_user)):
    # Verify vehicle exists and belongs to user
    vehicle = await db.vehicles.find_one(
        {"id": repair.vehicle_id, "user_id": current_user["id"]}
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Process parts and calculate costs
    parts_data = []
    total_cost = 0.0
    
    for part in repair.parts_used:
        part_entry = {
            "name": part.name,
            "source": part.source,
            "inventory_item_id": part.inventory_item_id,
            "quantity": part.quantity,
            "cost": part.cost
        }
        
        # If from inventory, get the price and optionally deduct quantity
        if part.source == "inventory" and part.inventory_item_id:
            inv_item = await db.inventory.find_one(
                {"id": part.inventory_item_id, "user_id": current_user["id"]},
                {"_id": 0}
            )
            if inv_item:
                part_entry["cost"] = inv_item["price"] * part.quantity
                # Optionally deduct from inventory
                new_qty = inv_item["quantity"] - part.quantity
                if new_qty >= 0:
                    await db.inventory.update_one(
                        {"id": part.inventory_item_id},
                        {"$set": {"quantity": new_qty, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
        
        total_cost += part_entry["cost"]
        parts_data.append(part_entry)
    
    repair_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    repair_doc = {
        "id": repair_id,
        "vehicle_id": repair.vehicle_id,
        "user_id": current_user["id"],
        "cause_of_damage": repair.cause_of_damage,
        "affected_area": repair.affected_area,
        "parts_used": parts_data,
        "total_parts_cost": total_cost if total_cost > 0 else repair.total_parts_cost,
        "repair_details": repair.repair_details,
        "technicians": repair.technicians,
        "created_at": now,
        "updated_at": now
    }
    await db.repairs.insert_one(repair_doc)
    
    return RepairLog(**repair_doc)

@api_router.get("/repairs", response_model=List[RepairLog])
async def get_all_repairs(current_user: dict = Depends(get_current_user)):
    repairs = await db.repairs.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [RepairLog(**r) for r in repairs]

@api_router.get("/repairs/vehicle/{vehicle_id}", response_model=List[RepairLog])
async def get_vehicle_repairs(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    repairs = await db.repairs.find(
        {"vehicle_id": vehicle_id, "user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [RepairLog(**r) for r in repairs]

@api_router.get("/repairs/{repair_id}", response_model=RepairLog)
async def get_repair(repair_id: str, current_user: dict = Depends(get_current_user)):
    repair = await db.repairs.find_one(
        {"id": repair_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not repair:
        raise HTTPException(status_code=404, detail="Repair log not found")
    return RepairLog(**repair)

@api_router.put("/repairs/{repair_id}", response_model=RepairLog)
async def update_repair(
    repair_id: str,
    update: RepairLogUpdate,
    current_user: dict = Depends(get_current_user)
):
    repair = await db.repairs.find_one(
        {"id": repair_id, "user_id": current_user["id"]}
    )
    if not repair:
        raise HTTPException(status_code=404, detail="Repair log not found")
    
    update_data = {}
    if update.cause_of_damage is not None:
        update_data["cause_of_damage"] = update.cause_of_damage
    if update.affected_area is not None:
        update_data["affected_area"] = update.affected_area
    if update.parts_used is not None:
        update_data["parts_used"] = [p.model_dump() for p in update.parts_used]
    if update.total_parts_cost is not None:
        update_data["total_parts_cost"] = update.total_parts_cost
    if update.repair_details is not None:
        update_data["repair_details"] = update.repair_details
    if update.technicians is not None:
        update_data["technicians"] = update.technicians
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.repairs.update_one(
        {"id": repair_id},
        {"$set": update_data}
    )
    
    updated_repair = await db.repairs.find_one({"id": repair_id}, {"_id": 0})
    return RepairLog(**updated_repair)

@api_router.delete("/repairs/{repair_id}")
async def delete_repair(repair_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.repairs.delete_one(
        {"id": repair_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repair log not found")
    
    return {"message": "Repair log deleted successfully"}

# ============== STOCKTAKE MODELS ==============

class StocktakeItem(BaseModel):
    item_id: str
    item_name: str
    location: str
    expected_quantity: int
    actual_quantity: int
    difference: int
    price: float
    value_difference: float

class StocktakeCreate(BaseModel):
    items: List[StocktakeItem]
    notes: str = ""

class Stocktake(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[dict]
    total_items_counted: int
    items_matched: int
    items_over: int
    items_under: int
    total_value_difference: float
    status: str  # 'completed', 'applied'
    notes: str
    created_at: str
    applied_at: Optional[str] = None

# ============== STOCKTAKE ROUTES ==============

@api_router.post("/stocktakes", response_model=Stocktake)
async def create_stocktake(stocktake: StocktakeCreate, current_user: dict = Depends(get_current_user)):
    stocktake_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate summary stats
    items_data = [item.model_dump() for item in stocktake.items]
    total_items = len(items_data)
    items_matched = sum(1 for item in items_data if item["difference"] == 0)
    items_over = sum(1 for item in items_data if item["difference"] > 0)
    items_under = sum(1 for item in items_data if item["difference"] < 0)
    total_value_diff = sum(item["value_difference"] for item in items_data)
    
    stocktake_doc = {
        "id": stocktake_id,
        "user_id": current_user["id"],
        "items": items_data,
        "total_items_counted": total_items,
        "items_matched": items_matched,
        "items_over": items_over,
        "items_under": items_under,
        "total_value_difference": total_value_diff,
        "status": "completed",
        "notes": stocktake.notes,
        "created_at": now,
        "applied_at": None
    }
    await db.stocktakes.insert_one(stocktake_doc)
    
    return Stocktake(**stocktake_doc)

@api_router.get("/stocktakes", response_model=List[Stocktake])
async def get_stocktakes(current_user: dict = Depends(get_current_user)):
    stocktakes = await db.stocktakes.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [Stocktake(**s) for s in stocktakes]

@api_router.get("/stocktakes/{stocktake_id}", response_model=Stocktake)
async def get_stocktake(stocktake_id: str, current_user: dict = Depends(get_current_user)):
    stocktake = await db.stocktakes.find_one(
        {"id": stocktake_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not stocktake:
        raise HTTPException(status_code=404, detail="Stocktake not found")
    return Stocktake(**stocktake)

@api_router.post("/stocktakes/{stocktake_id}/apply")
async def apply_stocktake(stocktake_id: str, current_user: dict = Depends(get_current_user)):
    stocktake = await db.stocktakes.find_one(
        {"id": stocktake_id, "user_id": current_user["id"]}
    )
    if not stocktake:
        raise HTTPException(status_code=404, detail="Stocktake not found")
    
    if stocktake.get("status") == "applied":
        raise HTTPException(status_code=400, detail="Stocktake already applied")
    
    # Update inventory quantities based on stocktake
    now = datetime.now(timezone.utc).isoformat()
    for item in stocktake["items"]:
        await db.inventory.update_one(
            {"id": item["item_id"], "user_id": current_user["id"]},
            {"$set": {"quantity": item["actual_quantity"], "updated_at": now}}
        )
    
    # Mark stocktake as applied
    await db.stocktakes.update_one(
        {"id": stocktake_id},
        {"$set": {"status": "applied", "applied_at": now}}
    )
    
    return {"message": "Stocktake applied successfully", "items_updated": len(stocktake["items"])}

@api_router.delete("/stocktakes/{stocktake_id}")
async def delete_stocktake(stocktake_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.stocktakes.delete_one(
        {"id": stocktake_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stocktake not found")
    
    return {"message": "Stocktake deleted successfully"}

# ============== FEEDBACK MODELS ==============

class FeedbackRequest(BaseModel):
    name: str
    email: str = ""  # Optional - empty string if not provided
    feedback_type: str  # 'bug' or 'feature'
    message: str

# ============== FEEDBACK ROUTES ==============

@api_router.get("/feedback/status")
async def check_feedback_status():
    """Check if email service is configured (for debugging)"""
    api_key_configured = bool(RESEND_API_KEY) and len(RESEND_API_KEY) > 10
    return {
        "email_configured": api_key_configured,
        "api_key_prefix": RESEND_API_KEY[:10] + "..." if api_key_configured else "NOT SET",
        "recipient": FEEDBACK_RECIPIENT
    }

@api_router.post("/feedback")
async def send_feedback(feedback: FeedbackRequest):
    """Send feedback/bug report via email using Resend HTTP API"""
    
    # Validate email if provided
    if feedback.email:
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, feedback.email):
            raise HTTPException(status_code=400, detail="Invalid email address format")
        # Check for allowed domains (.com or .co.nz)
        if not (feedback.email.lower().endswith('.com') or feedback.email.lower().endswith('.co.nz')):
            raise HTTPException(status_code=400, detail="Email must end with .com or .co.nz")
    
    feedback_type_label = "Bug Report" if feedback.feedback_type == "bug" else "Feature Request"
    
    # Log the API key status for debugging
    logging.info(f"RESEND_API_KEY configured: {bool(RESEND_API_KEY)}, length: {len(RESEND_API_KEY) if RESEND_API_KEY else 0}")
    
    # Store in database first (always)
    feedback_doc = {
        "id": str(uuid.uuid4()),
        "name": feedback.name,
        "email": feedback.email,
        "feedback_type": feedback.feedback_type,
        "message": feedback.message,
        "email_sent": False,
        "email_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Try to send email if API key is configured
    if RESEND_API_KEY:
        # Build email row only if email was provided
        email_row = ""
        if feedback.email:
            email_row = f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                        <a href="mailto:{feedback.email}" style="color: #dc2626;">{feedback.email}</a>
                    </td>
                </tr>"""
        else:
            email_row = """
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #9ca3af; font-style: italic;">Not provided</td>
                </tr>"""
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626; margin-bottom: 20px;">RallyCommand {feedback_type_label}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 120px;">Type:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">{feedback_type_label}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Name:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{feedback.name}</td>
                </tr>
                {email_row}
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; vertical-align: top;">Message:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">{feedback.message}</td>
                </tr>
            </table>
            
            <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
                Sent from RallyCommand App on {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}
            </p>
        </div>
        """
        
        email_payload = {
            "from": "onboarding@resend.dev",
            "to": [FEEDBACK_RECIPIENT],
            "subject": f"[RallyCommand] {feedback_type_label}: {feedback.name}",
            "html": html_content
        }
        
        # Only add reply_to if email was provided
        if feedback.email:
            email_payload["reply_to"] = feedback.email
        
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        logging.info(f"Sending feedback email via HTTP POST from {feedback.email} to {FEEDBACK_RECIPIENT}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    RESEND_API_URL,
                    json=email_payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logging.info(f"Email sent successfully: {result}")
                    feedback_doc["email_sent"] = True
                    feedback_doc["email_id"] = result.get("id")
                else:
                    logging.error(f"Resend API error: {response.status_code} - {response.text}")
                    feedback_doc["email_error"] = f"{response.status_code}: {response.text}"
        except Exception as e:
            logging.error(f"Failed to send email via HTTP: {type(e).__name__}: {str(e)}")
            feedback_doc["email_error"] = str(e)
            # Continue - we'll still save to database
    else:
        logging.warning("RESEND_API_KEY not configured - storing feedback in database only")
        feedback_doc["email_error"] = "API key not configured"
    
    # Save to database
    await db.feedback.insert_one(feedback_doc)
    
    return {
        "status": "success",
        "message": "Feedback sent successfully. Thank you!",
        "email_sent": feedback_doc.get("email_sent", False),
        "email_id": feedback_doc.get("email_id")
    }

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
