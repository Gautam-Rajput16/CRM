import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Search,
  Calendar,
  User,
  Plus,
  MoreVertical,
  Trash2,
  ListTodo,
  LayoutGrid,
  List,
  LogOut,
  Settings,
  UserCircle,
  X,
  Save,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useProfiles } from '../hooks/useProfiles';
import { TaskStatus, TaskPriority } from '../types/Task';
import { TaskDailyUpdateModal } from './TaskDailyUpdateModal';
import { useTaskDailyUpdates } from '../hooks/useTaskDailyUpdates';
import { TaskDailyUpdate } from '../types/TaskDailyUpdate';
import { TaskNotificationBell } from './TaskNotificationBell';
import { toast } from 'react-hot-toast';


interface OperationsDashboardProps {
  userRole: string;
  userId: string;
}

// Session storage utilities
const saveToSessionStorage = (key: string, data: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved to session storage: ${key}`, data);
  } catch (error) {
    console.error('Error saving to session storage:', error);
  }
};

const loadFromSessionStorage = (key: string) => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from session storage:', error);
    return null;
  }
};

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ userRole, userId }) => {
  const { user, logout } = useAuth();
  const { profiles } = useProfiles(true);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { tasks, isLoading, createTask, updateTaskStatus, deleteTask } = useTasks(
    userRole === 'operations_team' ? userId : undefined,
    refreshFlag
  );
  const { getTodayUpdate } = useTaskDailyUpdates();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'assigned' | 'todos'>('assigned');
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<any>(null);
  const [todayUpdate, setTodayUpdate] = useState<TaskDailyUpdate | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    tags: ''
  });
  
  // Simple todo state
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: ''
  });

  const isOperationsTeamLeader = userRole === 'operations_team_leader';
  const isAdmin = userRole === 'admin';
  const isOperationsTeam = userRole === 'operations_team';
  const canAssignTasks = isOperationsTeamLeader || isAdmin;
  const canCreateTasks = isOperationsTeamLeader || isAdmin || isOperationsTeam;

  // Filter profiles to show operations team members for task assignment
  const operationsProfiles = profiles.filter(p => 
    p.role === 'operations_team' || p.role === 'operations_team_leader'
  );


  // Load todos from session storage on mount
  useEffect(() => {
    const savedTodos = loadFromSessionStorage(`personalTodos_${userId}`);
    if (savedTodos && savedTodos.todos) {
      setPersonalTodos(savedTodos.todos);
      console.log('Loaded personal todos from session storage:', savedTodos.todos);
    }
  }, [userId]);

  // Save personal todos to session storage whenever they change
  useEffect(() => {
    if (personalTodos.length > 0) {
      const todosData = {
        todos: personalTodos,
        lastUpdated: new Date().toISOString(),
        userRole,
        userId
      };
      saveToSessionStorage(`personalTodos_${userId}`, todosData);
    }
  }, [personalTodos, userId, userRole]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.user-menu-dropdown') && !target.closest('.user-menu-button')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      setRefreshFlag(prev => !prev);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canAssignTasks) {
      toast.error('Only admins and operations team leaders can delete tasks');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this task?')) return;

    const success = await deleteTask(taskId);
    if (success) {
      setRefreshFlag(prev => !prev);
    }
  };

  const handleDailyUpdate = async (task: any) => {
    setSelectedTaskForUpdate(task);
    // Get today's update if it exists
    const update = await getTodayUpdate(task.id, userId);
    setTodayUpdate(update);
    setShowDailyUpdateModal(true);
  };

  const handleToggleTodo = (todoId: string) => {
    setPersonalTodos(prev => 
      prev.map(todo => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (todoId: string) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    setPersonalTodos(prev => prev.filter(todo => todo.id !== todoId));
    toast.success('Todo deleted!');
  };

  const handleCreateSimpleTodo = () => {
    if (!newTodo.title.trim()) {
      toast.error('Please enter a todo title');
      return;
    }

    const todoData = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      completed: false,
      createdAt: new Date().toISOString(),
      isPersonalTodo: true
    };
    
    setPersonalTodos(prev => [...prev, todoData]);
    setActiveTab('todos');
    setNewTodo({ title: '', description: '' });
    toast.success('Todo created!');
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const assignedToId = newTask.assignedTo || userId;
    const assignedProfile = profiles.find(p => p.id === assignedToId);
    // If it's a personal todo (assigned to self), use simple todo creation
    if (assignedToId === userId && isOperationsTeam) {
      handleCreateSimpleTodo();
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
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending' as TaskStatus,
      assignedTo: assignedToId,
      assignedToName: assignedProfile?.name || 'Unknown',
      assignedBy: userId,
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
      setRefreshFlag(prev => !prev);
      toast.success('Task assigned successfully!');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredTodos = personalTodos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const currentData = activeTab === 'assigned' ? filteredTasks : filteredTodos;
  const currentStats = activeTab === 'assigned' ? {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
  } : {
    total: filteredTodos.length,
    pending: filteredTodos.filter(t => !t.completed).length,
    inProgress: 0,
    completed: filteredTodos.filter(t => t.completed).length,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending': return <Circle className="h-5 w-5 text-gray-400" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Legacy stats for backward compatibility
  const stats = currentStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ListTodo className="h-7 w-7 text-indigo-600" />
                Operations Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {canAssignTasks ? 'Manage and assign tasks' : 'View and complete your assigned tasks'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* User Profile Section */}
              <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <UserCircle className="h-8 w-8 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Notification Bell */}
              <TaskNotificationBell />

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Create Task Button */}
              {canCreateTasks && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {isOperationsTeam ? 'New Todo' : 'New Task'}
                </button>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings button clicked!', showUserMenu);
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="user-menu-button p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  type="button"
                >
                  <Settings className="h-6 w-6 text-gray-600" />
                </button>
                
                {showUserMenu && (
                  <div 
                    className="user-menu-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs text-indigo-600 capitalize mt-1">{userRole.replace('_', ' ')}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Logout button clicked!');
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        type="button"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <ListTodo className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <Circle className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assigned'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assigned Tasks ({filteredTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('todos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'todos'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My TODOs ({filteredTodos.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterPriority('all');
                setSearchQuery('');
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
        ) : currentData.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-sm">
            <ListTodo className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'todos' 
                ? (personalTodos.length === 0 ? 'No personal todos' : 'No todos match your filters')
                : (tasks.length === 0 ? 'No assigned tasks' : 'No tasks match your filters')
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'todos'
                ? (personalTodos.length === 0
                    ? 'Create your first personal todo to get started with task management.'
                    : 'Try adjusting your search criteria or filters to find what you\'re looking for.')
                : (tasks.length === 0 
                    ? (isOperationsTeam 
                        ? 'No tasks have been assigned to you yet. Check back later or switch to the TODOs tab to create personal todos.' 
                        : 'Create a new task to get started with operations management.')
                    : 'Try adjusting your search criteria or filters to find what you\'re looking for.')
              }
            </p>
            {((activeTab === 'todos' && personalTodos.length === 0) || (activeTab === 'assigned' && tasks.length === 0 && canCreateTasks)) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {activeTab === 'todos' ? 'Create Todo' : (isOperationsTeam ? 'Create Todo' : 'Create Task')}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'todos' ? (
              currentData.map(todo => (
                <SimpleTodoCard
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                />
              ))
            ) : (
              currentData.map(item => (
                <TaskCard
                  key={item.id}
                  task={item}
                  onStatusChange={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                  onDailyUpdate={handleDailyUpdate}
                  canEdit={canAssignTasks}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                />
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'todos' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Todo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === 'todos' ? (
                  currentData.map(todo => (
                    <SimpleTodoRow
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggleTodo}
                      onDelete={handleDeleteTodo}
                    />
                  ))
                ) : (
                  currentData.map(item => (
                    <TaskRow
                      key={item.id}
                      task={item}
                      onStatusChange={handleUpdateTaskStatus}
                      onDelete={handleDeleteTask}
                      onDailyUpdate={handleDailyUpdate}
                      canEdit={canAssignTasks}
                      getPriorityColor={getPriorityColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === 'todos' || (isOperationsTeam && !newTask.assignedTo) ? 'Create New Todo' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {activeTab === 'todos' ? (
                // Simple Todo Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Todo Title *
                    </label>
                    <input
                      type="text"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="What do you need to do?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newTodo.description}
                      onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Add any additional details..."
                    />
                  </div>
                </>
              ) : (
                // Full Task Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter task title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    {canAssignTasks && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign To
                        </label>
                        <select
                          value={newTask.assignedTo}
                          onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Assign to myself</option>
                          {operationsProfiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name} ({profile.role?.replace('_', ' ') || 'Unknown Role'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="urgent, client-work, etc."
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={activeTab === 'todos' ? () => {
                  handleCreateSimpleTodo();
                  setShowCreateModal(false);
                } : handleCreateTask}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create {activeTab === 'todos' ? 'Todo' : 'Task'}
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

// Task Card Component for Grid View
const TaskCard: React.FC<any> = ({ task, onStatusChange, onDelete, onDailyUpdate, canEdit, getPriorityColor, getStatusIcon }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
              <button
                onClick={() => {
                  onDailyUpdate(task);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Daily Update
              </button>
              {canEdit && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
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
        {task.assignedToName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{task.assignedToName}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {task.status !== 'completed' && (
          <>
            {task.status === 'pending' && (
              <button
                onClick={() => onStatusChange(task.id, 'in_progress')}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Start
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={() => onStatusChange(task.id, 'completed')}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Complete
              </button>
            )}
          </>
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

// Task Row Component for List View
const TaskRow: React.FC<any> = ({ task, onStatusChange, onDelete, onDailyUpdate, canEdit, getPriorityColor, getStatusIcon }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <div>
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
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
        {new Date(task.dueDate).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {task.status !== 'completed' && (
            <>
              {task.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(task.id, 'in_progress')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Start
                </button>
              )}
              {task.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange(task.id, 'completed')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Complete
                </button>
              )}
            </>
          )}
          <button
            onClick={() => onDailyUpdate(task)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Daily Update"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          {canEdit && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// Simple Todo Card Component
const SimpleTodoCard: React.FC<any> = ({ todo, onToggle, onDelete }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${todo.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {todo.completed && <CheckCircle2 className="h-3 w-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {todo.title}
          </h3>
          {todo.description && (
            <p className={`text-xs mt-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
              {todo.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Created {new Date(todo.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Simple Todo Row Component
const SimpleTodoRow: React.FC<any> = ({ todo, onToggle, onDelete }) => {
  return (
    <tr className={`hover:bg-gray-50 ${todo.completed ? 'opacity-75' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(todo.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              todo.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {todo.completed && <CheckCircle2 className="h-3 w-3" />}
          </button>
          <div>
            <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {todo.title}
            </p>
            {todo.description && (
              <p className={`text-xs mt-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                {todo.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {new Date(todo.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default OperationsDashboard;
