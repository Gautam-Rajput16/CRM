import React, { useState, useEffect } from 'react';
import {
  Users,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  MoreVertical,
  UserCheck,
  Target,
  LogOut,
  UserCircle,
  Grid3X3,
  List,
  Eye,
  Trash2,
  X,
  Save,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useProfiles } from '../hooks/useProfiles';
import { TaskStatus, TaskPriority } from '../types/Task';
import { TaskDailyUpdateModal } from './TaskDailyUpdateModal';
import { DailyUpdatesViewModal } from './DailyUpdatesViewModal';
import { useTaskDailyUpdates } from '../hooks/useTaskDailyUpdates';
import { TaskDailyUpdate } from '../types/TaskDailyUpdate';
import { TaskNotificationBell } from './TaskNotificationBell';
import { toast } from 'react-hot-toast';

interface OperationsTeamLeaderDashboardProps {
  onLogout?: () => void;
}

export const OperationsTeamLeaderDashboard: React.FC<OperationsTeamLeaderDashboardProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const { profiles } = useProfiles(true);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { tasks, isLoading, createTask, updateTaskStatus, deleteTask } = useTasks(undefined, refreshFlag);
  const { getTodayUpdate } = useTaskDailyUpdates();
  
  // UI State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTaskTab, setActiveTaskTab] = useState<'team' | 'personal'>('team');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [showDailyUpdatesViewModal, setShowDailyUpdatesViewModal] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<any>(null);
  const [selectedTaskForView, setSelectedTaskForView] = useState<any>(null);
  const [todayUpdate, setTodayUpdate] = useState<TaskDailyUpdate | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  // New Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    tags: ''
  });

  // Get operations team members
  const operationsTeamMembers = profiles.filter(p => 
    p.role === 'operations_team' || p.role === 'operations_team_leader'
  );

  // Separate team tasks and personal tasks
  const teamTasks = tasks.filter(task => {
    const assignedProfile = profiles.find(p => p.id === task.assignedTo);
    return assignedProfile && (assignedProfile.role === 'operations_team' || assignedProfile.role === 'operations_team_leader') && task.assignedTo !== user?.id;
  });

  const personalTasks = tasks.filter(task => {
    return task.assignedTo === user?.id;
  });

  // Get current tab tasks
  const currentTabTasks = activeTaskTab === 'team' ? teamTasks : personalTasks;

  // Apply filters to current tab tasks
  const filteredTasks = currentTabTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Combined tasks for stats calculation
  const operationsTasks = [...teamTasks, ...personalTasks];

  // Calculate comprehensive stats
  const stats = {
    totalTasks: operationsTasks.length,
    pendingTasks: operationsTasks.filter(t => t.status === 'pending').length,
    inProgressTasks: operationsTasks.filter(t => t.status === 'in_progress').length,
    completedTasks: operationsTasks.filter(t => t.status === 'completed').length,
    overdueTasks: operationsTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate < new Date() && t.status !== 'completed';
    }).length,
    highPriorityTasks: operationsTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    teamMembers: operationsTeamMembers.length,
    completionRate: operationsTasks.length > 0 ? Math.round((operationsTasks.filter(t => t.status === 'completed').length / operationsTasks.length) * 100) : 0
  };

  // Team performance stats
  const teamStats = operationsTeamMembers.map(member => {
    const memberTasks = operationsTasks.filter(t => t.assignedTo === member.id);
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      totalTasks: memberTasks.length,
      completedTasks: memberTasks.filter(t => t.status === 'completed').length,
      pendingTasks: memberTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: memberTasks.filter(t => t.status === 'in_progress').length,
      completionRate: memberTasks.length > 0 ? Math.round((memberTasks.filter(t => t.status === 'completed').length / memberTasks.length) * 100) : 0,
      overdueTasks: memberTasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate < new Date() && t.status !== 'completed';
      }).length
    };
  });

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const assignedProfile = profiles.find(p => p.id === newTask.assignedTo);
    const taskData = {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending' as TaskStatus,
      assignedTo: newTask.assignedTo,
      assignedToName: assignedProfile?.name || 'Unknown',
      assignedBy: user?.id || '',
      assignedByName: user?.name || 'Unknown',
      dueDate: newTask.dueDate.split('T')[0],
      dueTime: newTask.dueTime || newTask.dueDate.split('T')[1]?.substring(0, 5),
      tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()) : [],
      relatedLeadId: undefined,
      relatedLeadName: undefined,
      notes: ''
    };

    const success = await createTask(taskData);
    if (success) {
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        tags: ''
      });
      
      // Switch to appropriate tab based on who the task is assigned to
      if (newTask.assignedTo === user?.id) {
        setActiveTaskTab('personal');
      } else {
        setActiveTaskTab('team');
      }
      
      setRefreshFlag(prev => !prev);
      toast.success('Task assigned successfully!');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const success = await updateTaskStatus(taskId, status);
    if (success) {
      setRefreshFlag(prev => !prev);
      toast.success(`Task ${status === 'completed' ? 'completed' : 'updated'} successfully!`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const success = await deleteTask(taskId);
      if (success) {
        setRefreshFlag(prev => !prev);
        toast.success('Task deleted successfully!');
      }
    }
  };

  const handleDailyUpdate = async (task: any) => {
    setSelectedTaskForUpdate(task);
    // Get today's update if it exists
    const update = await getTodayUpdate(task.id, user?.id || '');
    setTodayUpdate(update);
    setShowDailyUpdateModal(true);
  };

  const handleViewDailyUpdates = (task: any) => {
    setSelectedTaskForView(task);
    setShowDailyUpdatesViewModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) onLogout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'tasks', label: 'Task Management', icon: <CheckCircle2 className="h-5 w-5" /> },
    { id: 'team', label: 'Team Overview', icon: <Users className="h-5 w-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 bg-white shadow-lg flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Operations Leader</h1>
              <p className="text-sm text-gray-500">Team Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle className="h-8 w-8 text-gray-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Operations Leader</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
              <p className="text-gray-600">Manage operations team and track performance</p>
            </div>
            
            <div className="flex items-center gap-3">
              <TaskNotificationBell />
              
              {activeSection === 'tasks' && (
                <>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Assign Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'dashboard' && <DashboardContent stats={stats} teamStats={teamStats} />}
          {activeSection === 'tasks' && (
            <TaskManagementContent
              tasks={filteredTasks}
              isLoading={isLoading}
              viewMode={viewMode}
              activeTaskTab={activeTaskTab}
              setActiveTaskTab={setActiveTaskTab}
              teamTasksCount={teamTasks.length}
              personalTasksCount={personalTasks.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              operationsTeamMembers={operationsTeamMembers}
              currentUserId={user?.id}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onViewTask={(task) => {
                setSelectedTask(task);
                setShowTaskDetails(true);
              }}
              onEditTask={(task) => {
                console.log('Edit task:', task);
              }}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          )}
          {activeSection === 'team' && <TeamOverviewContent teamStats={teamStats} />}
          {activeSection === 'analytics' && <AnalyticsContent stats={stats} teamStats={teamStats} />}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          newTask={newTask}
          setNewTask={setNewTask}
          operationsTeamMembers={operationsTeamMembers}
          onCreateTask={handleCreateTask}
        />
      )}

      {/* Daily Update Modal */}
      {showDailyUpdateModal && selectedTaskForUpdate && (
        <TaskDailyUpdateModal
          isOpen={showDailyUpdateModal}
          onClose={() => {
            setShowDailyUpdateModal(false);
            setSelectedTaskForUpdate(null);
            setTodayUpdate(null);
            setRefreshFlag(prev => !prev); // Refresh tasks to show updated progress
          }}
          task={selectedTaskForUpdate}
          existingUpdate={todayUpdate}
        />
      )}

      {/* Daily Updates View Modal */}
      {showDailyUpdatesViewModal && selectedTaskForView && (
        <DailyUpdatesViewModal
          isOpen={showDailyUpdatesViewModal}
          onClose={() => {
            setShowDailyUpdatesViewModal(false);
            setSelectedTaskForView(null);
          }}
          task={selectedTaskForView}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={showTaskDetails}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onUpdateStatus={handleUpdateTaskStatus}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
};

// Dashboard Content Component
const DashboardContent: React.FC<any> = ({ stats, teamStats }) => (
  <div className="space-y-6">
    {/* Welcome Section */}
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-2">Operations Command Center</h2>
      <p className="text-indigo-100">Monitor team performance and manage operations efficiently</p>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
          </div>
          <CheckCircle2 className="h-12 w-12 text-indigo-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.completionRate}%</p>
          </div>
          <TrendingUp className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue Tasks</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdueTasks}</p>
          </div>
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Team Members</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.teamMembers}</p>
          </div>
          <Users className="h-12 w-12 text-blue-600" />
        </div>
      </div>
    </div>

    {/* Status Overview */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <span className="text-sm font-medium">{stats.pendingTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <span className="text-sm font-medium">{stats.inProgressTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <span className="text-sm font-medium">{stats.completedTasks}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-3">
          {teamStats
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 5)
            .map((member, index) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.totalTasks} tasks</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">{member.completionRate}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  </div>
);

// Task Management Content Component
const TaskManagementContent: React.FC<any> = ({
  tasks,
  isLoading,
  viewMode,
  activeTaskTab,
  setActiveTaskTab,
  teamTasksCount,
  personalTasksCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  operationsTeamMembers,
  currentUserId,
  onUpdateTaskStatus,
  onDeleteTask,
  onViewTask,
  onEditTask,
  getPriorityColor,
  getStatusColor
}) => (
  <div className="space-y-6">
    {/* Tab Navigation */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTaskTab('team')}
          className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTaskTab === 'team'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Team Tasks
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
            activeTaskTab === 'team' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {teamTasksCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTaskTab('personal')}
          className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTaskTab === 'personal'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          My Tasks
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
            activeTaskTab === 'personal' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {personalTasksCount}
          </span>
        </button>
      </div>
    </div>

    {/* Filters */}
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Assignees</option>
          {operationsTeamMembers.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        
        <button
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setPriorityFilter('all');
            setAssigneeFilter('all');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>

    {/* Tasks Display */}
    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    ) : tasks.length === 0 ? (
      <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
        <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">No tasks match your current filters or no tasks have been assigned yet.</p>
      </div>
    ) : viewMode === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            currentUserId={currentUserId}
            onUpdateStatus={onUpdateTaskStatus}
            onDeleteTask={onDeleteTask}
            onViewTask={onViewTask}
            onEditTask={onEditTask}
            onDailyUpdate={handleDailyUpdate}
            onViewDailyUpdates={handleViewDailyUpdates}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    ) : (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onUpdateStatus={onUpdateTaskStatus}
                onDeleteTask={onDeleteTask}
                onViewTask={onViewTask}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// Task Card Component
const TaskCard: React.FC<any> = ({ task, currentUserId, onUpdateStatus, onDeleteTask, onViewTask, onEditTask, onDailyUpdate, onViewDailyUpdates, getPriorityColor, getStatusColor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isMyTask = task.assignedTo === currentUserId;

  return (
    <div className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow ${
      isOverdue ? 'border-red-300 bg-red-50' : 
      isMyTask ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {isMyTask && (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
              My Task
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {isOverdue && (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
              Overdue
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
              <button
                onClick={() => {
                  onViewTask(task);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button
                onClick={() => {
                  onDailyUpdate && onDailyUpdate(task);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Daily Update
              </button>
              <button
                onClick={() => {
                  onViewDailyUpdates && onViewDailyUpdates(task);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Updates
              </button>
              <button
                onClick={() => {
                  onEditTask && onEditTask(task);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDeleteTask(task.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-green-500" />
          <span>Assigned: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCheck className="h-4 w-4" />
          <span>{task.assignedToName}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {task.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(task.id, 'in_progress')}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Start
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            onClick={() => onUpdateStatus(task.id, 'completed')}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Complete
          </button>
        )}
        {task.status === 'completed' && (
          <div className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-center text-sm font-medium">
            ✓ Completed
          </div>
        )}
      </div>
    </div>
  );
};

// Task Row Component
const TaskRow: React.FC<any> = ({ task, currentUserId, onUpdateStatus, onDeleteTask, onViewTask, getPriorityColor, getStatusColor }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isMyTask = task.assignedTo === currentUserId;

  return (
    <tr className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : isMyTask ? 'bg-indigo-50' : ''}`}>
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            {isMyTask && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                My Task
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">{task.description}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{task.assignedToName}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {new Date(task.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && <span className="block text-xs">Overdue</span>}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewTask(task)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Team Overview Content Component
const TeamOverviewContent: React.FC<{ teamStats: any[] }> = ({ teamStats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamStats.map((member) => (
        <div key={member.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle className="h-10 w-10 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{member.totalTasks}</p>
              <p className="text-xs text-gray-500">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{member.completionRate}%</p>
              <p className="text-xs text-gray-500">Completion Rate</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">{member.completedTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium text-blue-600">{member.inProgressTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending:</span>
              <span className="font-medium text-gray-600">{member.pendingTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overdue:</span>
              <span className="font-medium text-red-600">{member.overdueTasks}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Analytics Content Component
const AnalyticsContent: React.FC<{ stats: any; teamStats: any[] }> = ({ stats, teamStats }) => (
  <div className="space-y-6">
    {/* Performance Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overall Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.completionRate}%</p>
          </div>
          <TrendingUp className="h-12 w-12 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Average Tasks per Member</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {stats.teamMembers > 0 ? Math.round(stats.totalTasks / stats.teamMembers) : 0}
            </p>
          </div>
          <Users className="h-12 w-12 text-blue-600" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">High Priority Tasks</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.highPriorityTasks}</p>
          </div>
          <AlertTriangle className="h-12 w-12 text-orange-600" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue Tasks</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdueTasks}</p>
          </div>
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
      </div>
    </div>
    
    {/* Team Performance Chart */}
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance Comparison</h3>
      <div className="space-y-4">
        {teamStats
          .sort((a, b) => b.completionRate - a.completionRate)
          .map((member, index) => (
            <div key={member.id} className="flex items-center gap-4">
              <div className="w-4 text-sm font-medium text-gray-500">#{index + 1}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{member.name}</span>
                  <span className="text-sm text-gray-600">{member.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${member.completionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {member.completedTasks}/{member.totalTasks}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

// Create Task Modal Component
const CreateTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  newTask: any;
  setNewTask: (task: any) => void;
  operationsTeamMembers: any[];
  onCreateTask: () => void;
}> = ({ isOpen, onClose, newTask, setNewTask, operationsTeamMembers, onCreateTask }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Assign New Task</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter task title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Enter task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select team member</option>
                {operationsTeamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
            <input
              type="datetime-local"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={newTask.tags}
              onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="urgent, client-work, etc."
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Assign Task
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Details Modal Component
const TaskDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}> = ({ isOpen, onClose, task, onUpdateStatus, onDeleteTask, getPriorityColor, getStatusColor }) => {
  if (!isOpen || !task) return null;

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Task Header */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
            <p className="text-gray-600">{task.description}</p>
          </div>
          
          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{task.assignedToName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assigned By</label>
                <p className="text-sm text-gray-900">{task.assignedByName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {new Date(task.dueDate).toLocaleDateString()}
                  {task.dueTime && ` at ${task.dueTime}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-sm text-gray-900">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => onUpdateStatus(task.id, 'in_progress')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Task
                </button>
              )}
              {task.status === 'in_progress' && (
                <button
                  onClick={() => onUpdateStatus(task.id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
            <button
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsTeamLeaderDashboard;
