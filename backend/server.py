from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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

# Create the main app
app = FastAPI()

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

class InventoryItemCreate(BaseModel):
    name: str
    category: str  # parts, tools, fluids
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

class DashboardStats(BaseModel):
    total_items: int
    low_stock_count: int
    total_value: float
    categories: dict
    recent_activity: List[dict]

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

# ============== INVENTORY ROUTES ==============

@api_router.post("/inventory", response_model=InventoryItem)
async def create_item(item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    item_doc = {
        "id": item_id,
        "name": item.name,
        "category": item.category,
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
    search: Optional[str] = None,
    low_stock: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    
    if category:
        query["category"] = category
    
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
    
    # Enrich logs with item names
    recent_activity = []
    for log in recent_logs:
        item = await db.inventory.find_one({"id": log["item_id"]}, {"_id": 0, "name": 1})
        recent_activity.append({
            "id": log["id"],
            "item_name": item["name"] if item else "Unknown",
            "quantity_used": log["quantity_used"],
            "reason": log["reason"],
            "event_name": log["event_name"],
            "created_at": log["created_at"]
        })
    
    return DashboardStats(
        total_items=total_items,
        low_stock_count=low_stock_count,
        total_value=total_value,
        categories=categories,
        recent_activity=recent_activity
    )

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "RallyCommand API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
