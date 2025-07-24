import React, { useState, useEffect } from "react";
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
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

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
        fetchTasks(),
        fetchTimeEntries()
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

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
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
                <p className="text-gray-600">Team Productivity Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              { key: 'tasks', label: 'Task Management', icon: '✓' }
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
                  <h2 className="text-3xl font-bold mb-4">Team Productivity Dashboard</h2>
                  <p className="text-blue-100 text-lg mb-6">
                    Track, analyze, and optimize your team's productivity with real-time insights and analytics.
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

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <p className="text-gray-600 text-sm font-medium">Team Score</p>
                    <p className="text-2xl font-bold text-indigo-600">{teamOverview.team_productivity_score || 0}%</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Individual Performance Metrics</h3>
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

              {/* Time Logging Trends */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Daily Hours Logged</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {productivityTrends.time_logging_trends && productivityTrends.time_logging_trends.length > 0 ? (
                    <div className="grid grid-cols-7 gap-2">
                      {productivityTrends.time_logging_trends.slice(-14).map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">
                            {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div 
                            className="bg-green-500 rounded mx-auto transition-all duration-300 hover:bg-green-600"
                            style={{ 
                              height: `${Math.max(day.total_hours * 3, 8)}px`,
                              width: '20px'
                            }}
                            title={`${day.total_hours.toFixed(1)} hours logged`}
                          ></div>
                          <div className="text-xs text-gray-800 mt-1">{day.total_hours.toFixed(1)}h</div>
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
                <h3 className="text-xl font-bold text-gray-900">Monthly Leaderboard</h3>
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task Management Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Task Management Overview</h3>
              
              {/* Task Status Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">To Do</h4>
                  <div className="space-y-2">
                    {tasks.filter(task => task.status === 'todo').slice(0, 3).map(task => (
                      <div key={task.id} className="bg-white p-2 rounded border-l-4 border-gray-400">
                        <p className="text-sm font-medium">{task.title}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      +{Math.max(0, tasks.filter(task => task.status === 'todo').length - 3)} more
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">In Progress</h4>
                  <div className="space-y-2">
                    {tasks.filter(task => task.status === 'in_progress').slice(0, 3).map(task => (
                      <div key={task.id} className="bg-white p-2 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-medium">{task.title}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      +{Math.max(0, tasks.filter(task => task.status === 'in_progress').length - 3)} more
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2">Completed</h4>
                  <div className="space-y-2">
                    {tasks.filter(task => task.status === 'done').slice(0, 3).map(task => (
                      <div key={task.id} className="bg-white p-2 rounded border-l-4 border-green-400">
                        <p className="text-sm font-medium">{task.title}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      +{Math.max(0, tasks.filter(task => task.status === 'done').length - 3)} more
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Tasks Table */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Recent Tasks</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.slice(0, 10).map(task => {
                        const assignedUser = users.find(u => u.id === task.assigned_to);
                        return (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                <div className="text-sm text-gray-500">{task.description || 'No description'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src={assignedUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser?.name || 'Unknown')}&background=random`}
                                  alt={assignedUser?.name}
                                  className="w-8 h-8 rounded-full mr-2"
                                />
                                <span className="text-sm text-gray-900">{assignedUser?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(task.created_date).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;