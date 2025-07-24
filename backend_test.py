#!/usr/bin/env python3
"""
Backend API Testing Suite for The Third Angle Productivity Tracking App
Tests all backend endpoints to ensure proper functionality before frontend integration.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any
import time

# Get backend URL from frontend .env
BACKEND_URL = "https://e24428f9-35d1-438c-b86d-204d2c396fb6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = {
            "sample_data_init": {"status": "pending", "details": []},
            "user_management": {"status": "pending", "details": []},
            "task_management": {"status": "pending", "details": []},
            "time_tracking": {"status": "pending", "details": []},
            "analytics": {"status": "pending", "details": []}
        }
        self.sample_user_ids = []
        self.sample_task_ids = []
        
    def log_result(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test result with details"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
        if test_name.startswith("Sample Data"):
            category = "sample_data_init"
        elif test_name.startswith("User"):
            category = "user_management"
        elif test_name.startswith("Task"):
            category = "task_management"
        elif test_name.startswith("Time"):
            category = "time_tracking"
        elif test_name.startswith("Analytics"):
            category = "analytics"
        else:
            category = "general"
            
        if category in self.test_results:
            self.test_results[category]["details"].append({
                "test": test_name,
                "success": success,
                "message": message,
                "response_data": response_data
            })
            
            # Update overall status
            if not success and self.test_results[category]["status"] != "failed":
                self.test_results[category]["status"] = "failed"
            elif success and self.test_results[category]["status"] == "pending":
                self.test_results[category]["status"] = "passed"

    def test_sample_data_initialization(self):
        """Test POST /api/init-sample-data endpoint"""
        print("\n=== Testing Sample Data Initialization ===")
        
        try:
            response = self.session.post(f"{self.base_url}/init-sample-data")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Sample Data Init", True, f"Successfully initialized sample data: {data.get('message', 'No message')}")
                
                # Wait a moment for data to be fully inserted
                time.sleep(2)
                
                # Verify users were created
                users_response = self.session.get(f"{self.base_url}/users")
                if users_response.status_code == 200:
                    users = users_response.json()
                    if len(users) >= 5:
                        self.sample_user_ids = [user['id'] for user in users]
                        self.log_result("Sample Data Verification", True, f"Found {len(users)} users after initialization")
                    else:
                        self.log_result("Sample Data Verification", False, f"Expected at least 5 users, found {len(users)}")
                else:
                    self.log_result("Sample Data Verification", False, f"Failed to verify users: {users_response.status_code}")
                    
            else:
                self.log_result("Sample Data Init", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Sample Data Init", False, f"Exception: {str(e)}")

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management APIs ===")
        
        # Test GET /api/users
        try:
            response = self.session.get(f"{self.base_url}/users")
            if response.status_code == 200:
                users = response.json()
                self.log_result("User GET All", True, f"Retrieved {len(users)} users")
                
                if users:
                    # Test GET /api/users/{user_id}
                    user_id = users[0]['id']
                    user_response = self.session.get(f"{self.base_url}/users/{user_id}")
                    if user_response.status_code == 200:
                        user = user_response.json()
                        self.log_result("User GET Single", True, f"Retrieved user: {user['name']}")
                    else:
                        self.log_result("User GET Single", False, f"HTTP {user_response.status_code}")
            else:
                self.log_result("User GET All", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("User GET All", False, f"Exception: {str(e)}")
            
        # Test POST /api/users (create new user)
        try:
            new_user_data = {
                "name": "Test User",
                "email": "testuser@thirdangle.com",
                "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            }
            
            response = self.session.post(f"{self.base_url}/users", json=new_user_data)
            if response.status_code == 200:
                user = response.json()
                self.log_result("User POST Create", True, f"Created user: {user['name']} with ID: {user['id']}")
                self.sample_user_ids.append(user['id'])
            else:
                self.log_result("User POST Create", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("User POST Create", False, f"Exception: {str(e)}")

    def test_task_management(self):
        """Test task management endpoints"""
        print("\n=== Testing Task Management APIs ===")
        
        if not self.sample_user_ids:
            self.log_result("Task Management", False, "No user IDs available for task testing")
            return
            
        # Test GET /api/tasks
        try:
            response = self.session.get(f"{self.base_url}/tasks")
            if response.status_code == 200:
                tasks = response.json()
                self.log_result("Task GET All", True, f"Retrieved {len(tasks)} tasks")
                if tasks:
                    self.sample_task_ids = [task['id'] for task in tasks[:3]]  # Store some task IDs
            else:
                self.log_result("Task GET All", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Task GET All", False, f"Exception: {str(e)}")
            
        # Test POST /api/tasks (create new task)
        try:
            new_task_data = {
                "title": "Test Task",
                "description": "This is a test task for API validation",
                "priority": "high",
                "assigned_to": self.sample_user_ids[0],
                "estimated_hours": 5.0,
                "tags": ["testing", "api"]
            }
            
            response = self.session.post(f"{self.base_url}/tasks", json=new_task_data)
            if response.status_code == 200:
                task = response.json()
                self.log_result("Task POST Create", True, f"Created task: {task['title']} with ID: {task['id']}")
                self.sample_task_ids.append(task['id'])
                
                # Test PUT /api/tasks/{task_id} (update task)
                update_data = {
                    "status": "in_progress",
                    "actual_hours": 2.5
                }
                
                update_response = self.session.put(f"{self.base_url}/tasks/{task['id']}", json=update_data)
                if update_response.status_code == 200:
                    updated_task = update_response.json()
                    self.log_result("Task PUT Update", True, f"Updated task status to: {updated_task['status']}")
                else:
                    self.log_result("Task PUT Update", False, f"HTTP {update_response.status_code}")
                    
            else:
                self.log_result("Task POST Create", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Task POST Create", False, f"Exception: {str(e)}")
            
        # Test GET /api/tasks with filters
        try:
            if self.sample_user_ids:
                response = self.session.get(f"{self.base_url}/tasks?user_id={self.sample_user_ids[0]}")
                if response.status_code == 200:
                    user_tasks = response.json()
                    self.log_result("Task GET Filtered", True, f"Retrieved {len(user_tasks)} tasks for specific user")
                else:
                    self.log_result("Task GET Filtered", False, f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_result("Task GET Filtered", False, f"Exception: {str(e)}")

    def test_time_tracking(self):
        """Test time tracking endpoints"""
        print("\n=== Testing Time Tracking APIs ===")
        
        if not self.sample_user_ids:
            self.log_result("Time Tracking", False, "No user IDs available for time tracking testing")
            return
            
        # Test GET /api/time-entries
        try:
            response = self.session.get(f"{self.base_url}/time-entries")
            if response.status_code == 200:
                entries = response.json()
                self.log_result("Time Entry GET All", True, f"Retrieved {len(entries)} time entries")
            else:
                self.log_result("Time Entry GET All", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Time Entry GET All", False, f"Exception: {str(e)}")
            
        # Test POST /api/time-entries (create new time entry)
        try:
            new_time_entry = {
                "user_id": self.sample_user_ids[0],
                "task_id": self.sample_task_ids[0] if self.sample_task_ids else None,
                "description": "Test time entry for API validation",
                "hours": 2.5,
                "is_pomodoro": True
            }
            
            response = self.session.post(f"{self.base_url}/time-entries", json=new_time_entry)
            if response.status_code == 200:
                entry = response.json()
                self.log_result("Time Entry POST Create", True, f"Created time entry: {entry['hours']} hours for {entry['description']}")
            else:
                self.log_result("Time Entry POST Create", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Time Entry POST Create", False, f"Exception: {str(e)}")
            
        # Test GET /api/time-entries with filters
        try:
            if self.sample_user_ids:
                response = self.session.get(f"{self.base_url}/time-entries?user_id={self.sample_user_ids[0]}")
                if response.status_code == 200:
                    user_entries = response.json()
                    self.log_result("Time Entry GET Filtered", True, f"Retrieved {len(user_entries)} time entries for specific user")
                else:
                    self.log_result("Time Entry GET Filtered", False, f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_result("Time Entry GET Filtered", False, f"Exception: {str(e)}")

    def test_analytics_apis(self):
        """Test all analytics endpoints"""
        print("\n=== Testing Analytics APIs ===")
        
        # Test GET /api/analytics/team-overview
        try:
            response = self.session.get(f"{self.base_url}/analytics/team-overview")
            if response.status_code == 200:
                data = response.json()
                required_fields = ['team_size', 'total_tasks', 'completed_tasks', 'team_productivity_score']
                if all(field in data for field in required_fields):
                    self.log_result("Analytics Team Overview", True, f"Team size: {data['team_size']}, Total tasks: {data['total_tasks']}, Productivity: {data['team_productivity_score']}%")
                else:
                    self.log_result("Analytics Team Overview", False, f"Missing required fields in response: {data}")
            else:
                self.log_result("Analytics Team Overview", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Analytics Team Overview", False, f"Exception: {str(e)}")
            
        # Test GET /api/analytics/individual-performance
        try:
            response = self.session.get(f"{self.base_url}/analytics/individual-performance")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    user_data = data[0]
                    required_fields = ['name', 'total_tasks', 'completed_tasks', 'productivity_score']
                    if all(field in user_data for field in required_fields):
                        self.log_result("Analytics Individual Performance", True, f"Retrieved performance data for {len(data)} users")
                    else:
                        self.log_result("Analytics Individual Performance", False, f"Missing required fields in user data: {user_data}")
                else:
                    self.log_result("Analytics Individual Performance", False, f"Expected list of users, got: {type(data)}")
            else:
                self.log_result("Analytics Individual Performance", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Analytics Individual Performance", False, f"Exception: {str(e)}")
            
        # Test GET /api/analytics/productivity-trends
        try:
            response = self.session.get(f"{self.base_url}/analytics/productivity-trends")
            if response.status_code == 200:
                data = response.json()
                required_fields = ['task_completion_trends', 'time_logging_trends']
                if all(field in data for field in required_fields):
                    task_trends = len(data['task_completion_trends'])
                    time_trends = len(data['time_logging_trends'])
                    self.log_result("Analytics Productivity Trends", True, f"Task trends: {task_trends} data points, Time trends: {time_trends} data points")
                else:
                    self.log_result("Analytics Productivity Trends", False, f"Missing required fields in response: {data}")
            else:
                self.log_result("Analytics Productivity Trends", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Analytics Productivity Trends", False, f"Exception: {str(e)}")
            
        # Test GET /api/analytics/team-leaderboard
        try:
            response = self.session.get(f"{self.base_url}/analytics/team-leaderboard")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    leader_data = data[0]
                    required_fields = ['name', 'tasks_completed', 'hours_logged', 'points', 'rank']
                    if all(field in leader_data for field in required_fields):
                        self.log_result("Analytics Team Leaderboard", True, f"Retrieved leaderboard with {len(data)} users, leader: {leader_data['name']} ({leader_data['points']} points)")
                    else:
                        self.log_result("Analytics Team Leaderboard", False, f"Missing required fields in leader data: {leader_data}")
                else:
                    self.log_result("Analytics Team Leaderboard", False, f"Expected list of users, got: {type(data)}")
            else:
                self.log_result("Analytics Team Leaderboard", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Analytics Team Leaderboard", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests in the correct order"""
        print(f"🚀 Starting Backend API Tests for The Third Angle")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test in priority order as specified in review request
        self.test_sample_data_initialization()
        self.test_user_management()
        self.test_task_management()
        self.test_time_tracking()
        self.test_analytics_apis()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 BACKEND API TEST SUMMARY")
        print("=" * 60)
        
        overall_success = True
        for category, result in self.test_results.items():
            status_icon = "✅" if result["status"] == "passed" else "❌" if result["status"] == "failed" else "⏳"
            category_name = category.replace("_", " ").title()
            print(f"{status_icon} {category_name}: {result['status'].upper()}")
            
            if result["status"] == "failed":
                overall_success = False
                # Show failed tests
                failed_tests = [detail for detail in result["details"] if not detail["success"]]
                for failed in failed_tests:
                    print(f"   ❌ {failed['test']}: {failed['message']}")
        
        print("\n" + "=" * 60)
        if overall_success:
            print("🎉 ALL BACKEND APIS ARE WORKING CORRECTLY!")
        else:
            print("⚠️  SOME BACKEND APIS HAVE ISSUES - SEE DETAILS ABOVE")
        print("=" * 60)
        
        return overall_success

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)