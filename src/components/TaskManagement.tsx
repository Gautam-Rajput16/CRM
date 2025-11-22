import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  X,
  Trash2,
  Calendar,
  User,
  Tag,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit3,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../hooks/useAuth';
import { Task, TaskPriority, TaskStatus } from '../types/Task';
import { TaskDailyUpdateModal } from './TaskDailyUpdateModal';
import { DailyUpdatesViewModal } from './DailyUpdatesViewModal';
import { useTaskDailyUpdates } from '../hooks/useTaskDailyUpdates';
import { TaskDailyUpdate } from '../types/TaskDailyUpdate';
import { toast } from 'react-hot-toast';

interface TaskManagementProps {
  viewMode?: 'admin' | 'employee';
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ viewMode = 'admin' }) => {
  const { user } = useAuth();
  const { profiles } = useProfiles(true); // Include all roles, we'll filter manually
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { tasks, isLoading, createTask, updateTask, updateTaskStatus, deleteTask } = useTasks(
    viewMode === 'employee' ? user?.id : undefined,
    refreshFlag
  );
  const { getTodayUpdate, updates } = useTaskDailyUpdates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [showDailyUpdatesViewModal, setShowDailyUpdatesViewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);
  const [selectedTaskForView, setSelectedTaskForView] = useState<Task | null>(null);
  const [todayUpdate, setTodayUpdate] = useState<TaskDailyUpdate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [overdueAssigneeFilter, setOverdueAssigneeFilter] = useState<string>('all');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    tags: '',
  });

  // Edit task form state
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    tags: '',
  });

  // Filter profiles to show all non-admin users (exclude only 'admin' role)
  const nonAdminProfiles = profiles.filter(p => p.role !== 'admin');
  const currentUserProfile = profiles.find(p => p.id === user?.id);

  // Filter tasks and sort so latest assigned appear first
  const filteredTasks = useMemo(() => {
    // Sort by createdAt descending (newest first)
    const sortedTasks = [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return sortedTasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignedTo === assigneeFilter;
      const matchesAssignedBy = assignedByFilter === 'all' || task.assignedBy === assignedByFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesAssignedBy;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, assignedByFilter]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => t.status === 'pending'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      completed: filteredTasks.filter(t => t.status === 'completed'),
    };
  }, [filteredTasks]);

  // Map taskId to latest daily update info
  const dailyUpdateMap = useMemo(() => {
    const map: Record<string, { lastUpdateDate: string; hasTodayUpdate: boolean }> = {};
    const today = new Date().toISOString().split('T')[0];

    updates.forEach(update => {
      const existing = map[update.taskId];
      const isNewer = !existing || new Date(update.updateDate) > new Date(existing.lastUpdateDate);
      const hasToday = update.updateDate === today || existing?.hasTodayUpdate;

      if (!existing || isNewer) {
        map[update.taskId] = { lastUpdateDate: update.updateDate, hasTodayUpdate: hasToday };
      } else if (hasToday && !existing.hasTodayUpdate) {
        map[update.taskId] = { ...existing, hasTodayUpdate: true };
      }
    });

    return map;
  }, [updates]);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedProfile = nonAdminProfiles.find(p => p.id === newTask.assignedTo);
    if (!selectedProfile) {
      toast.error('Invalid assignee selected');
      return;
    }

    const success = await createTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending',
      assignedTo: newTask.assignedTo,
      assignedToName: selectedProfile.name,
      assignedBy: user?.id || '',
      assignedByName: currentUserProfile?.name || 'Admin',
      dueDate: newTask.dueDate,
      dueTime: newTask.dueTime,
      tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()) : [],
    });
    
    // Show success notification with assignee info
    if (success) {
      const priorityEmoji = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[newTask.priority] || '📋';
      
      toast.success(
        `${priorityEmoji} Task assigned to ${selectedProfile.name}!\nThey will be notified immediately.`,
        { duration: 5000 }
      );
    }

    if (success) {
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        tags: '',
      });
      setRefreshFlag(prev => !prev);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
    setRefreshFlag(prev => !prev);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      setRefreshFlag(prev => !prev);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      dueTime: task.dueTime || '',
      tags: task.tags ? task.tags.join(', ') : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTask.title || !editTask.assignedTo || !editTask.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedProfile = nonAdminProfiles.find(p => p.id === editTask.assignedTo);
    if (!selectedProfile) {
      toast.error('Invalid assignee selected');
      return;
    }

    const success = await updateTask(editingTask.id, {
      title: editTask.title,
      description: editTask.description,
      priority: editTask.priority,
      assignedTo: editTask.assignedTo,
      assignedToName: selectedProfile.name,
      dueDate: editTask.dueDate,
      dueTime: editTask.dueTime,
      tags: editTask.tags ? editTask.tags.split(',').map(t => t.trim()) : [],
    });

    if (success) {
      setShowEditModal(false);
      setEditingTask(null);
      setEditTask({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        tags: '',
      });
      setRefreshFlag(prev => !prev);
      toast.success('Task updated successfully!');
    }
  };

  const handleDailyUpdate = async (task: Task) => {
    setSelectedTaskForUpdate(task);
    // Get today's update if it exists
    const update = await getTodayUpdate(task.id, user?.id || '');
    setTodayUpdate(update);
    setShowDailyUpdateModal(true);
  };

  const handleViewDailyUpdates = (task: Task) => {
    setSelectedTaskForView(task);
    setShowDailyUpdatesViewModal(true);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
    }
  };

  // A task is overdue only after both its due date and due time (if any) have passed
  const isOverdue = (task: Task) => {
    if (task.status === 'completed') return false;
    if (!task.dueDate) return false;

    // Start from the stored dueDate string so we support 'YYYY-MM-DD', ISO strings, etc.
    const dueDateTime = new Date(task.dueDate);
    if (Number.isNaN(dueDateTime.getTime())) return false;

    if (task.dueTime) {
      // dueTime can be 'HH:MM' or 'HH:MM:SS'
      const [hStr, mStr, sStr] = task.dueTime.split(':');
      const hours = Number(hStr ?? 0);
      const minutes = Number(mStr ?? 0);
      const seconds = Number(sStr ?? 0);
      dueDateTime.setHours(hours, minutes, seconds, 999);
    } else {
      // No time set: treat as due at end of day local time
      dueDateTime.setHours(23, 59, 59, 999);
    }

    return new Date() > dueDateTime;
  };

  // Calculate overdue tasks
  const overdueTasks = useMemo(() => {
    return filteredTasks.filter(task => isOverdue(task));
  }, [filteredTasks]);

  // Filter overdue tasks by assignee for modal
  const filteredOverdueTasks = useMemo(() => {
    if (overdueAssigneeFilter === 'all') return overdueTasks;
    return overdueTasks.filter(task => task.assignedTo === overdueAssigneeFilter);
  }, [overdueTasks, overdueAssigneeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
            <p className="text-gray-600">
              {viewMode === 'admin' ? 'Manage and assign tasks to your team' : 'View and update your assigned tasks'}
            </p>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            {viewMode === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-5 w-5" />
                Create Task
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {viewMode === 'admin' && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Assignees</option>
              {nonAdminProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          )}

          {viewMode === 'admin' && (
            <select
              value={assignedByFilter}
              onChange={(e) => setAssignedByFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Assigners</option>
              {profiles
                .filter(profile => profile.role && ['admin', 'team_leader', 'sales_team_leader', 'operations_team_leader'].includes(profile.role))
                .map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTasks.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{tasksByStatus.pending.length}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{tasksByStatus.in_progress.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Overdue Tasks Card - Clickable */}
        <div 
          onClick={() => setShowOverdueModal(true)}
          className="bg-white p-4 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const updateInfo = dailyUpdateMap[task.id];
                return (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isOverdue(task) ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {isOverdue(task) && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 break-words">{task.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span><strong>Assigned to:</strong> {task.assignedToName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-blue-500" />
                            <span><strong>Assigned by:</strong> {task.assignedByName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span><strong>Assigned:</strong> {new Date(task.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.dueTime && <span className="ml-1">{task.dueTime}</span>}
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              <span>{task.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {updateInfo && (
                          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-blue-600">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span>
                              <strong>{updateInfo.hasTodayUpdate ? 'Updated today' : 'Last update:'}</strong>
                              {!updateInfo.hasTodayUpdate && ` ${new Date(updateInfo.lastUpdateDate).toLocaleDateString()}`}
                            </span>
                          </div>
                        )}

                        {expandedTask === task.id && task.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700"><strong>Notes:</strong> {task.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:ml-4 md:justify-end mt-1 md:mt-0">
                        {/* Admins/TL can always change status, employees cannot change completed tasks */}
                        {(viewMode === 'admin' || task.status !== 'completed') && (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                        
                        {/* Daily Update Actions */}
                        {viewMode === 'admin' ? (
                          // Admin: Only view daily updates (eye button)
                          <button
                            onClick={() => handleViewDailyUpdates(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View daily updates"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        ) : task.assignedTo === user?.id ? (
                          // Employee: Can add daily updates (green button) and view them (eye button)
                          <>
                            <button
                              onClick={() => handleDailyUpdate(task)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Add daily update"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDailyUpdates(task)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View daily updates"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                        
                        {viewMode === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit task"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select employee</option>
                        {nonAdminProfiles.map(profile => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Time
                      </label>
                      <input
                        type="time"
                        value={newTask.dueTime}
                        onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., urgent, follow-up, client-meeting"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editTask.title}
                      onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editTask.description}
                      onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editTask.priority}
                        onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as TaskPriority })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editTask.assignedTo}
                        onChange={(e) => setEditTask({ ...editTask, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select employee</option>
                        {nonAdminProfiles.map(profile => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={editTask.dueDate}
                        onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Time
                      </label>
                      <input
                        type="time"
                        value={editTask.dueTime}
                        onChange={(e) => setEditTask({ ...editTask, dueTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editTask.tags}
                      onChange={(e) => setEditTask({ ...editTask, tags: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., urgent, follow-up, client-meeting"
                    />
                  </div>


                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
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

      {/* Overdue Tasks Modal */}
      {showOverdueModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowOverdueModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="text-xl font-bold text-red-900">Overdue Tasks</h3>
                        <p className="text-sm text-red-700">{overdueTasks.length} tasks past due date</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowOverdueModal(false)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-red-600" />
                    </button>
                  </div>

                  {/* Employee Filter */}
                  {viewMode === 'admin' && (
                    <div className="mt-4">
                      <select
                        value={overdueAssigneeFilter}
                        onChange={(e) => setOverdueAssigneeFilter(e.target.value)}
                        className="px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="all">All Employees ({overdueTasks.length})</option>
                        {nonAdminProfiles.map(profile => {
                          const employeeOverdueCount = overdueTasks.filter(t => t.assignedTo === profile.id).length;
                          if (employeeOverdueCount === 0) return null;
                          return (
                            <option key={profile.id} value={profile.id}>
                              {profile.name} ({employeeOverdueCount})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {filteredOverdueTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg font-medium">No overdue tasks!</p>
                      <p className="text-gray-500 text-sm mt-2">All tasks are on track</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOverdueTasks.map(task => {
                        const daysOverdue = Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div
                            key={task.id}
                            className="border-2 border-red-300 rounded-lg p-5 bg-red-50 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-900 text-lg">{task.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                    {task.priority.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span><strong>Assigned to:</strong> {task.assignedToName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span><strong>Assigned by:</strong> {task.assignedByName || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-green-500" />
                                    <span><strong>Assigned:</strong> {new Date(task.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-red-600 font-medium">
                                    <Calendar className="h-4 w-4" />
                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs">
                                      {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                    </span>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-gray-700 text-sm mb-3 bg-white p-3 rounded border border-red-200">
                                    {task.description}
                                  </p>
                                )}

                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Tag className="h-4 w-4 text-gray-500" />
                                    {task.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-white text-gray-700 rounded-full text-xs border border-red-200"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {viewMode === 'admin' && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>

                            {/* Status Update Buttons */}
                            <div className="flex gap-2 pt-3 border-t border-red-200">
                              <button
                                onClick={() => handleStatusChange(task.id, 'pending')}
                                disabled={task.status === 'pending'}
                                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Set Pending
                              </button>
                              <button
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                disabled={task.status === 'in_progress'}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Start Progress
                              </button>
                              <button
                                onClick={() => handleStatusChange(task.id, 'completed')}
                                disabled={task.status === 'completed'}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Mark Complete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowOverdueModal(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
