import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [users, setUsers] = useState([]);
  const [teamOverview, setTeamOverview] = useState({});
  const [individualPerformance, setIndividualPerformance] = useState([]);
  const [productivityTrends, setProductivityTrends] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [kanbanTasks, setKanbanTasks] = useState({ todo: [], in_progress: [], done: [], blocked: [] });
  const [timeEntries, setTimeEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize sample data and fetch all analytics
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Initialize sample data first
      await axios.post(`${API}/init-sample-data`);
      
      // Then fetch all data
      await Promise.all([
        fetchUsers(),
        fetchTeamOverview(),
        fetchIndividualPerformance(),
        fetchProductivityTrends(),
        fetchLeaderboard(),
        fetchKanbanTasks(),
        fetchTimeEntries(),
        fetchBurnoutAnalysis()
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error("Error initializing data:", error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
      if (response.data.length > 0 && !selectedUser) {
        setSelectedUser(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTeamOverview = async () => {
    try {
      const response = await axios.get(`${API}/analytics/team-overview`);
      setTeamOverview(response.data);
    } catch (error) {
      console.error("Error fetching team overview:", error);
    }
  };

  const fetchIndividualPerformance = async () => {
    try {
      const response = await axios.get(`${API}/analytics/individual-performance`);
      setIndividualPerformance(response.data);
    } catch (error) {
      console.error("Error fetching individual performance:", error);
    }
  };

  const fetchProductivityTrends = async () => {
    try {
      const response = await axios.get(`${API}/analytics/productivity-trends`);
      setProductivityTrends(response.data);
    } catch (error) {
      console.error("Error fetching productivity trends:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/analytics/team-leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchKanbanTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks/kanban`);
      setKanbanTasks(response.data);
    } catch (error) {
      console.error("Error fetching kanban tasks:", error);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const response = await axios.get(`${API}/time-entries`);
      setTimeEntries(response.data);
    } catch (error) {
      console.error("Error fetching time entries:", error);
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      const response = await axios.get(`${API}/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchBurnoutAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/analytics/burnout-analysis`);
      setBurnoutAnalysis(response.data);
    } catch (error) {
      console.error("Error fetching burnout analysis:", error);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    try {
      // Update task status
      await axios.put(`${API}/tasks/${draggedTask.id}`, {
        status: newStatus
      });
      
      // Refresh kanban data
      await fetchKanbanTasks();
      await fetchTeamOverview();
      
      setDraggedTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBurnoutColor = (risk) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const formatBadge = (badge) => {
    const badgeMap = {
      'task_master_10': '🏆 Task Master',
      'task_master_50': '🏆 Task Expert',
      'task_master_100': '🏆 Task Legend',
      'consistent_7_days': '⚡ Consistent'
    };
    return badgeMap[badge] || badge;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading The Third Angle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">The Third Angle</h1>
                <p className="text-gray-600">Enhanced Team Productivity Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (selectedUser && !showNotifications) {
                      fetchNotifications(selectedUser);
                    }
                  }}
                  className="bg-blue-100 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h4v14z" />
                  </svg>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map(notification => (
                          <div key={notification.id} className={`p-3 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}>
                            <div className="font-medium text-sm text-gray-900">{notification.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_date).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">{teamOverview.team_size} Team Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Team Overview', icon: '📊' },
              { key: 'performance', label: 'Individual Performance', icon: '👤' },
              { key: 'trends', label: 'Productivity Trends', icon: '📈' },
              { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { key: 'kanban', label: 'Task Board', icon: '📋' },
              { key: 'burnout', label: 'Burnout Analysis', icon: '⚡' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Team Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Enhanced Team Productivity Dashboard</h2>
                  <p className="text-blue-100 text-lg mb-6">
                    Advanced analytics with burnout detection, task assignment, and real-time collaboration features.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold">{teamOverview.completion_rate || 0}%</div>
                      <div className="text-blue-100">Completion Rate</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold">{teamOverview.tasks_completed_today || 0}</div>
                      <div className="text-blue-100">Tasks Today</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1648134859182-98df6e93ef58?w=400&h=300&fit=crop&auto=format" 
                    alt="Team Analytics Dashboard" 
                    className="rounded-lg shadow-lg w-full max-w-md"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{teamOverview.total_tasks || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{teamOverview.completed_tasks || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{teamOverview.in_progress_tasks || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Blocked</p>
                    <p className="text-2xl font-bold text-red-600">{teamOverview.blocked_tasks || 0}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Unassigned</p>
                    <p className="text-2xl font-bold text-orange-600">{teamOverview.unassigned_tasks || 0}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Burnout Alert */}
            {(teamOverview.high_burnout_users > 0 || teamOverview.medium_burnout_users > 0) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Burnout Alert:</strong> {teamOverview.high_burnout_users} team member(s) at high risk, {teamOverview.medium_burnout_users} at medium risk. 
                      <button 
                        onClick={() => setActiveTab('burnout')}
                        className="ml-2 underline hover:text-yellow-800"
                      >
                        View analysis →
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Individual Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Individual Performance Metrics with Badges</h3>
              <div className="grid gap-6">
                {individualPerformance.map((user, index) => (
                  <div key={user.user_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-gray-600 text-sm">Productivity Score: {user.productivity_score}%</p>
                          <div className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getBurnoutColor(user.burnout_risk)}`}>
                            {user.burnout_risk} burnout risk
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-6">
                          <div>
                            <p className="text-2xl font-bold text-green-600">{user.completed_tasks}</p>
                            <p className="text-gray-600 text-sm">Tasks Done</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{user.hours_this_week}h</p>
                            <p className="text-gray-600 text-sm">This Week</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-indigo-600">{user.completion_rate}%</p>
                            <p className="text-gray-600 text-sm">Completion</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    {user.badges.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {user.badges.map(badge => (
                            <span key={badge} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {formatBadge(badge)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(user.productivity_score, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Productivity Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Productivity Trends (Last 30 Days)</h3>
              
              {/* Task Completion Trends */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Daily Task Completions</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {productivityTrends.task_completion_trends && productivityTrends.task_completion_trends.length > 0 ? (
                    <div className="grid grid-cols-7 gap-2">
                      {productivityTrends.task_completion_trends.slice(-14).map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">
                            {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div 
                            className="bg-blue-500 rounded mx-auto transition-all duration-300 hover:bg-blue-600"
                            style={{ 
                              height: `${Math.max(day.count * 8, 8)}px`,
                              width: '20px'
                            }}
                            title={`${day.count} tasks completed`}
                          ></div>
                          <div className="text-xs text-gray-800 mt-1">{day.count}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No task completion data available</p>
                  )}
                </div>
              </div>

              {/* Time Logging Trends with Overtime Detection */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Daily Hours Logged (with Overtime)</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {productivityTrends.time_logging_trends && productivityTrends.time_logging_trends.length > 0 ? (
                    <div className="grid grid-cols-7 gap-2">
                      {productivityTrends.time_logging_trends.slice(-14).map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">
                            {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="relative">
                            <div 
                              className="bg-green-500 rounded mx-auto transition-all duration-300 hover:bg-green-600"
                              style={{ 
                                height: `${Math.max(day.total_hours * 3, 8)}px`,
                                width: '20px'
                              }}
                              title={`${day.total_hours.toFixed(1)} hours logged`}
                            ></div>
                            {day.overtime_hours > 0 && (
                              <div 
                                className="bg-red-500 rounded mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"
                                style={{ 
                                  height: `${day.overtime_hours * 3}px`,
                                  width: '20px'
                                }}
                                title={`${day.overtime_hours.toFixed(1)} overtime hours`}
                              ></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-800 mt-1">{day.total_hours.toFixed(1)}h</div>
                          {day.overtime_hours > 0 && (
                            <div className="text-xs text-red-600">⚠️ OT</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No time logging data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Monthly Leaderboard with Achievement Badges</h3>
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://images.unsplash.com/photo-1590650624342-f527904ca1b3?w=300&h=200&fit=crop&auto=format" 
                    alt="Team Collaboration" 
                    className="w-16 h-12 rounded-lg object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <div key={user.user_id} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${
                    index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100' :
                    index === 1 ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100' :
                    index === 2 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100' :
                    'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : user.rank}
                      </div>
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-gray-600 text-sm">Rank #{user.rank}</p>
                        <div className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getBurnoutColor(user.burnout_risk)}`}>
                          {user.burnout_risk} risk
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{user.tasks_completed}</p>
                        <p className="text-xs text-gray-600">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{user.hours_logged}h</p>
                        <p className="text-xs text-gray-600">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">{user.points}</p>
                        <p className="text-xs text-gray-600">Points</p>
                      </div>
                      {user.badges.length > 0 && (
                        <div className="text-center">
                          <div className="flex flex-wrap gap-1">
                            {user.badges.slice(0, 2).map(badge => (
                              <span key={badge} className="text-xs">
                                {formatBadge(badge).split(' ')[0]}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600">Badges</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board Tab */}
        {activeTab === 'kanban' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Interactive Task Board</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(kanbanTasks).map(([status, tasks]) => (
                  <div
                    key={status}
                    className="bg-gray-50 rounded-lg p-4 min-h-96"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 capitalize">
                        {status.replace('_', ' ')} ({tasks.length})
                      </h4>
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'todo' ? 'bg-gray-400' :
                        status === 'in_progress' ? 'bg-blue-500' :
                        status === 'done' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-3">
                      {tasks.map(task => {
                        const assignedUser = users.find(u => u.id === task.assigned_to);
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-gray-600 text-xs mb-2 line-clamp-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {assignedUser && (
                                  <img
                                    src={assignedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser.name)}&background=random`}
                                    alt={assignedUser.name}
                                    className="w-6 h-6 rounded-full"
                                    title={assignedUser.name}
                                  />
                                )}
                                {task.assigned_users?.length > 0 && (
                                  <div className="text-xs text-gray-500">+{task.assigned_users.length}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                {task.comments_count > 0 && (
                                  <span className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {task.comments_count}
                                  </span>
                                )}
                                {task.estimated_hours && (
                                  <span>{task.estimated_hours}h</span>
                                )}
                              </div>
                            </div>
                            
                            {task.tags?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {task.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Burnout Analysis Tab */}
        {activeTab === 'burnout' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Team Burnout Analysis</h3>
              
              <div className="grid gap-6">
                {burnoutAnalysis.map(user => (
                  <div key={user.user_id} className={`border-2 rounded-lg p-6 ${getBurnoutColor(user.burnout_risk)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm font-medium capitalize">{user.burnout_risk} Burnout Risk</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{user.total_hours_week}h</p>
                            <p className="text-gray-600 text-sm">Total Hours</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">{user.overtime_hours_week}h</p>
                            <p className="text-gray-600 text-sm">Overtime</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{user.avg_daily_hours}</p>
                            <p className="text-gray-600 text-sm">Avg Daily</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {user.burnout_risk === 'high' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                          ⚠️ <strong>High Burnout Risk:</strong> Consider reducing workload and encouraging breaks.
                        </p>
                      </div>
                    )}
                    
                    {user.burnout_risk === 'medium' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          ⚡ <strong>Medium Burnout Risk:</strong> Monitor workload and ensure work-life balance.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Burnout Prevention Tips:</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Encourage regular breaks and time off</li>
                  <li>• Set realistic deadlines and expectations</li>
                  <li>• Promote open communication about workload</li>
                  <li>• Implement flexible working arrangements</li>
                  <li>• Recognize and reward achievements</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;