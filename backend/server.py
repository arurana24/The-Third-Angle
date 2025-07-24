from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import asyncio
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="The Third Angle API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class GoalType(str, Enum):
    TASK_BASED = "task_based"
    TIME_BASED = "time_based"
    OKR = "okr"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: str = "team_member"
    joined_date: datetime = Field(default_factory=datetime.utcnow)
    productivity_score: float = 0.0
    total_tasks_completed: int = 0
    total_hours_logged: float = 0.0

class UserCreate(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assigned_to: str  # user_id
    project_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    tags: List[str] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    assigned_to: str
    project_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    actual_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None

class TimeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    task_id: Optional[str] = None
    description: str
    hours: float
    date: datetime = Field(default_factory=datetime.utcnow)
    is_pomodoro: bool = False

class TimeEntryCreate(BaseModel):
    user_id: str
    task_id: Optional[str] = None
    description: str
    hours: float
    is_pomodoro: bool = False

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    goal_type: GoalType
    target_value: float
    current_value: float = 0.0
    deadline: Optional[datetime] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False

class GoalCreate(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = None
    goal_type: GoalType
    target_value: float
    deadline: Optional[datetime] = None

class DailyStandup(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    what_i_did: str
    what_ill_do: str
    blockers: Optional[str] = None

class DailyStandupCreate(BaseModel):
    user_id: str
    what_i_did: str
    what_ill_do: str
    blockers: Optional[str] = None

class ProductivityMetrics(BaseModel):
    user_id: str
    date: datetime
    tasks_completed: int = 0
    hours_logged: float = 0.0
    productivity_score: float = 0.0
    focus_time: float = 0.0
    break_time: float = 0.0

# User routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Task routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate):
    # Verify user exists
    user = await db.users.find_one({"id": task_data.assigned_to})
    if not user:
        raise HTTPException(status_code=404, detail="Assigned user not found")
    
    task = Task(**task_data.dict())
    await db.tasks.insert_one(task.dict())
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(user_id: Optional[str] = None, status: Optional[TaskStatus] = None):
    query = {}
    if user_id:
        query["assigned_to"] = user_id
    if status:
        query["status"] = status
    
    tasks = await db.tasks.find(query).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    
    # If status is being updated to done, record completion date
    if update_data.get("status") == TaskStatus.DONE and task["status"] != TaskStatus.DONE:
        update_data["completed_date"] = datetime.utcnow()
        
        # Update user's completed tasks count
        await db.users.update_one(
            {"id": task["assigned_to"]}, 
            {"$inc": {"total_tasks_completed": 1}}
        )
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# Time tracking routes
@api_router.post("/time-entries", response_model=TimeEntry)
async def create_time_entry(time_data: TimeEntryCreate):
    time_entry = TimeEntry(**time_data.dict())
    await db.time_entries.insert_one(time_entry.dict())
    
    # Update user's total hours
    await db.users.update_one(
        {"id": time_data.user_id},
        {"$inc": {"total_hours_logged": time_data.hours}}
    )
    
    # Update task's actual hours if task_id provided
    if time_data.task_id:
        await db.tasks.update_one(
            {"id": time_data.task_id},
            {"$inc": {"actual_hours": time_data.hours}}
        )
    
    return time_entry

@api_router.get("/time-entries", response_model=List[TimeEntry])
async def get_time_entries(user_id: Optional[str] = None, task_id: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if task_id:
        query["task_id"] = task_id
    
    entries = await db.time_entries.find(query).sort("date", -1).to_list(1000)
    return [TimeEntry(**entry) for entry in entries]

# Goals routes
@api_router.post("/goals", response_model=Goal)
async def create_goal(goal_data: GoalCreate):
    goal = Goal(**goal_data.dict())
    await db.goals.insert_one(goal.dict())
    return goal

@api_router.get("/goals", response_model=List[Goal])
async def get_goals(user_id: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    goals = await db.goals.find(query).to_list(1000)
    return [Goal(**goal) for goal in goals]

# Standup routes
@api_router.post("/standups", response_model=DailyStandup)
async def create_standup(standup_data: DailyStandupCreate):
    # Check if user already has standup for today
    today = datetime.utcnow().date()
    existing = await db.standups.find_one({
        "user_id": standup_data.user_id,
        "date": {"$gte": datetime.combine(today, datetime.min.time())}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Standup already exists for today")
    
    standup = DailyStandup(**standup_data.dict())
    await db.standups.insert_one(standup.dict())
    return standup

@api_router.get("/standups", response_model=List[DailyStandup])
async def get_standups(user_id: Optional[str] = None, date: Optional[datetime] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if date:
        start_date = datetime.combine(date.date(), datetime.min.time())
        end_date = start_date + timedelta(days=1)
        query["date"] = {"$gte": start_date, "$lt": end_date}
    
    standups = await db.standups.find(query).sort("date", -1).to_list(1000)
    return [DailyStandup(**standup) for standup in standups]

# Analytics routes
@api_router.get("/analytics/team-overview")
async def get_team_overview():
    # Get all users
    users = await db.users.find().to_list(1000)
    
    # Get tasks stats
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"status": TaskStatus.DONE})
    in_progress_tasks = await db.tasks.count_documents({"status": TaskStatus.IN_PROGRESS})
    
    # Get today's productivity
    today = datetime.utcnow().date()
    today_tasks = await db.tasks.count_documents({
        "completed_date": {"$gte": datetime.combine(today, datetime.min.time())}
    })
    
    # Calculate team productivity score (based on task completion rate)
    productivity_score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return {
        "team_size": len(users),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "tasks_completed_today": today_tasks,
        "team_productivity_score": round(productivity_score, 1),
        "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    }

@api_router.get("/analytics/individual-performance")
async def get_individual_performance():
    users = await db.users.find().to_list(1000)
    performance_data = []
    
    for user in users:
        user_tasks = await db.tasks.count_documents({"assigned_to": user["id"]})
        completed_tasks = await db.tasks.count_documents({
            "assigned_to": user["id"], 
            "status": TaskStatus.DONE
        })
        
        # Get time entries for the last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        time_entries = await db.time_entries.find({
            "user_id": user["id"],
            "date": {"$gte": week_ago}
        }).to_list(1000)
        
        hours_this_week = sum(entry["hours"] for entry in time_entries)
        
        # Calculate productivity score
        completion_rate = (completed_tasks / user_tasks * 100) if user_tasks > 0 else 0
        productivity_score = (completion_rate + min(hours_this_week * 2, 100)) / 2
        
        performance_data.append({
            "user_id": user["id"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url"),
            "total_tasks": user_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": round(completion_rate, 1),
            "hours_this_week": round(hours_this_week, 1),
            "productivity_score": round(productivity_score, 1)
        })
    
    # Sort by productivity score
    performance_data.sort(key=lambda x: x["productivity_score"], reverse=True)
    return performance_data

@api_router.get("/analytics/productivity-trends")
async def get_productivity_trends():
    # Get last 30 days of data
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Get daily task completions
    pipeline = [
        {
            "$match": {
                "completed_date": {"$gte": thirty_days_ago},
                "status": TaskStatus.DONE
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$completed_date"
                    }
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    task_trends = await db.tasks.aggregate(pipeline).to_list(30)
    
    # Get daily time entries
    time_pipeline = [
        {
            "$match": {
                "date": {"$gte": thirty_days_ago}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$date"
                    }
                },
                "total_hours": {"$sum": "$hours"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    time_trends = await db.time_entries.aggregate(time_pipeline).to_list(30)
    
    return {
        "task_completion_trends": task_trends,
        "time_logging_trends": time_trends
    }

@api_router.get("/analytics/team-leaderboard")
async def get_team_leaderboard():
    users = await db.users.find().to_list(1000)
    leaderboard = []
    
    for user in users:
        # Get tasks completed this month
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_tasks = await db.tasks.count_documents({
            "assigned_to": user["id"],
            "status": TaskStatus.DONE,
            "completed_date": {"$gte": current_month}
        })
        
        # Get hours logged this month
        time_entries = await db.time_entries.find({
            "user_id": user["id"],
            "date": {"$gte": current_month}
        }).to_list(1000)
        
        monthly_hours = sum(entry["hours"] for entry in time_entries)
        
        # Calculate points (tasks completed * 10 + hours * 2)
        points = monthly_tasks * 10 + monthly_hours * 2
        
        leaderboard.append({
            "user_id": user["id"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url"),
            "tasks_completed": monthly_tasks,
            "hours_logged": round(monthly_hours, 1),
            "points": round(points, 1),
            "rank": 0  # Will be set after sorting
        })
    
    # Sort by points and assign ranks
    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    for i, user in enumerate(leaderboard):
        user["rank"] = i + 1
    
    return leaderboard

# Initialize with sample data
@api_router.post("/init-sample-data")
async def init_sample_data():
    # Clear existing data
    await db.users.delete_many({})
    await db.tasks.delete_many({})
    await db.time_entries.delete_many({})
    await db.goals.delete_many({})
    await db.standups.delete_many({})
    
    # Create sample users
    sample_users = [
        {"name": "Alex Johnson", "email": "alex@thirdangle.com", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"},
        {"name": "Sarah Chen", "email": "sarah@thirdangle.com", "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"},
        {"name": "Mike Rodriguez", "email": "mike@thirdangle.com", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"},
        {"name": "Emma Wilson", "email": "emma@thirdangle.com", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"},
        {"name": "David Kim", "email": "david@thirdangle.com", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
    ]
    
    user_ids = []
    for user_data in sample_users:
        user = User(**user_data)
        await db.users.insert_one(user.dict())
        user_ids.append(user.id)
    
    # Create sample tasks with various statuses and completion dates
    task_templates = [
        {"title": "Design Landing Page", "description": "Create wireframes and mockups", "priority": Priority.HIGH},
        {"title": "API Development", "description": "Build REST endpoints", "priority": Priority.HIGH},
        {"title": "User Authentication", "description": "Implement login system", "priority": Priority.MEDIUM},
        {"title": "Database Migration", "description": "Update schema", "priority": Priority.LOW},
        {"title": "Testing Suite", "description": "Write unit tests", "priority": Priority.MEDIUM},
        {"title": "UI Components", "description": "Build reusable components", "priority": Priority.HIGH},
        {"title": "Performance Optimization", "description": "Improve load times", "priority": Priority.LOW},
        {"title": "Documentation", "description": "API documentation", "priority": Priority.MEDIUM},
        {"title": "Code Review", "description": "Review pull requests", "priority": Priority.HIGH},
        {"title": "Bug Fixes", "description": "Fix reported issues", "priority": Priority.MEDIUM},
    ]
    
    # Create tasks over the last 30 days
    for i, template in enumerate(task_templates):
        for j, user_id in enumerate(user_ids):
            if (i + j) % 3 == 0:  # Create tasks for some users
                created_date = datetime.utcnow() - timedelta(days=30-i*2)
                task_data = {
                    **template,
                    "assigned_to": user_id,
                    "created_date": created_date,
                    "estimated_hours": 4.0 + (i % 5),
                }
                
                # Randomly assign status and completion dates
                if i % 3 == 0:  # Completed tasks
                    task_data["status"] = TaskStatus.DONE
                    task_data["completed_date"] = created_date + timedelta(days=1+i%5)
                    task_data["actual_hours"] = task_data["estimated_hours"] + (i % 3 - 1)
                elif i % 3 == 1:  # In progress
                    task_data["status"] = TaskStatus.IN_PROGRESS
                    task_data["actual_hours"] = (task_data["estimated_hours"] / 2)
                # else: TODO status (default)
                
                task = Task(**task_data)
                await db.tasks.insert_one(task.dict())
    
    # Create sample time entries
    for user_id in user_ids:
        for day in range(30):
            date = datetime.utcnow() - timedelta(days=day)
            if day % 7 not in [5, 6]:  # Weekdays only
                # Morning session
                time_entry = TimeEntry(
                    user_id=user_id,
                    description=f"Morning work session",
                    hours=3.5 + (day % 3) * 0.5,
                    date=date.replace(hour=9),
                    is_pomodoro=True
                )
                await db.time_entries.insert_one(time_entry.dict())
                
                # Afternoon session
                time_entry = TimeEntry(
                    user_id=user_id,
                    description=f"Afternoon work session",
                    hours=4.0 + (day % 2) * 0.5,
                    date=date.replace(hour=14)
                )
                await db.time_entries.insert_one(time_entry.dict())
    
    # Update user statistics
    for user_id in user_ids:
        completed_tasks = await db.tasks.count_documents({
            "assigned_to": user_id,
            "status": TaskStatus.DONE
        })
        
        total_hours = sum([
            entry["hours"] for entry in await db.time_entries.find({
                "user_id": user_id
            }).to_list(1000)
        ])
        
        productivity_score = (completed_tasks * 10) + (total_hours * 0.5)
        
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "total_tasks_completed": completed_tasks,
                    "total_hours_logged": total_hours,
                    "productivity_score": productivity_score
                }
            }
        )
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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