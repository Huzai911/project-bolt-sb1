import React, { useState } from 'react';
import { X, User, DollarSign, Clock, Calendar, MessageCircle, CheckCircle, AlertTriangle, Edit2, Save } from 'lucide-react';
import { Task } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  channelName?: string;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
  onStatusChange,
  channelName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  React.useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        estimatedPay: task.estimatedPay,
        estimatedTime: task.estimatedTime,
        userNotes: task.userNotes || '',
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, editedTask);
    }
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'claimed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canProgress = () => {
    return ['claimed', 'in-progress', 'submitted'].includes(task.status);
  };

  const getNextStatus = (): Task['status'] => {
    switch (task.status) {
      case 'claimed': return 'in-progress';
      case 'in-progress': return 'submitted';
      case 'submitted': return 'completed';
      default: return task.status;
    }
  };

  const getNextStatusLabel = () => {
    switch (task.status) {
      case 'claimed': return 'Start Work';
      case 'in-progress': return 'Submit Work';
      case 'submitted': return 'Mark Complete';
      default: return '';
    }
  };

  const getDaysFromCreation = () => {
    const today = new Date();
    const created = new Date(task.createdAt);
    const diffTime = today.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstimatedCompletionDate = () => {
    const estimatedHours = parseInt(task.estimatedTime.split('-')[0]) || 2;
    const completionDate = new Date(task.createdAt);
    completionDate.setDate(completionDate.getDate() + Math.ceil(estimatedHours / 8));
    return completionDate;
  };

  const isOverdue = () => {
    const estimatedCompletion = getEstimatedCompletionDate();
    const today = new Date();
    return estimatedCompletion < today && task.status !== 'completed';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {channelName && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    #{channelName}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('-', ' ').toUpperCase()}
                </span>
                {isOverdue() && (
                  <span className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-lg text-sm">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Overdue</span>
                  </span>
                )}
              </div>
              
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-xl font-bold text-gray-900 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                  title="Save changes"
                >
                  <Save className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            ) : (
              <p className="text-gray-700">{task.description}</p>
            )}
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    value={editedTask.estimatedPay}
                    onChange={(e) => setEditedTask({ ...editedTask, estimatedPay: parseInt(e.target.value) || 0 })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-lg font-medium text-gray-900">${task.estimatedPay}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time</label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={editedTask.estimatedTime}
                    onChange={(e) => setEditedTask({ ...editedTask, estimatedTime: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2-3 hours"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{task.estimatedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{task.claimedBy || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{task.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Est. Completion:</span>
                  <span className={`${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                    {getEstimatedCompletionDate().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Days since created:</span>
                  <span className="text-gray-900">{getDaysFromCreation()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={editedTask.userNotes}
                onChange={(e) => setEditedTask({ ...editedTask, userNotes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Add task context, special instructions, or notes..."
              />
            ) : (
              <div className={`p-3 rounded-lg ${task.userNotes ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className="text-gray-700">
                  {task.userNotes || 'No notes added yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Completion Status */}
          {task.completedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Task Completed</span>
              </div>
              <p className="text-sm text-green-700">
                Completed on {task.completedAt.toLocaleDateString()} at {task.completedAt.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between">
              <div className="flex space-x-3">
                {canProgress() && (
                  <button
                    onClick={() => handleStatusChange(getNextStatus())}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{getNextStatusLabel()}</span>
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;