import React, { useState } from 'react';
import { Clock, User, CheckCircle2, Play, FileText, Upload, Sparkles, StickyNote, Edit2, Save, X } from 'lucide-react';
import { Task } from '../types';
import BudgetEditor from './BudgetEditor';
import TaskAISuggestions from './TaskAISuggestions';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onClaim: (taskId: string, claimedBy: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onClaim, onTaskUpdate }) => {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [freelancerName, setFreelancerName] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(task.userNotes || '');

  const handleSaveNotes = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, { userNotes: notesValue });
    }
    setEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(task.userNotes || '');
    setEditingNotes(false);
  };
  const handlePayChange = (newPay: number) => {
    // In a real app, this would update the task
    console.log('Task pay change requested:', newPay);
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'open':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Open</span>;
      case 'claimed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Claimed</span>;
      case 'in-progress':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">In Progress</span>;
      case 'submitted':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Submitted</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Completed</span>;
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'open':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'claimed':
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'submitted':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleClaim = () => {
    if (freelancerName.trim()) {
      onClaim(task.id, freelancerName);
      setShowClaimForm(false);
      setFreelancerName('');
    }
  };

  const canProgress = () => {
    if (task.status === 'claimed') return true;
    if (task.status === 'in-progress') return true;
    if (task.status === 'submitted') return true;
    return false;
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

  const canShowAISuggestions = () => {
    return ['open', 'claimed', 'in-progress', 'submitted'].includes(task.status);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {canShowAISuggestions() && (
            <button
              onClick={() => setShowAISuggestions(!showAISuggestions)}
              className={`p-1 rounded-full transition-colors ${
                showAISuggestions 
                  ? 'text-purple-800 bg-purple-200' 
                  : 'text-purple-600 hover:bg-purple-100'
              }`}
              title="AI Automation Suggestions"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setEditingNotes(!editingNotes)}
            className={`p-1 rounded-full transition-colors ${
              editingNotes || task.userNotes
                ? 'text-orange-800 bg-orange-200' 
                : 'text-orange-600 hover:bg-orange-100'
            }`}
            title="Task Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          {getStatusBadge()}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>

      {/* Task Notes Section */}
      {(editingNotes || task.userNotes) && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <StickyNote className="w-3 h-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-900">Task Notes</span>
          </div>
          
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add task context... e.g., 'This graphic artist has final say' or 'Use bright colors for emotional impact'"
                className="w-full px-2 py-1 border border-orange-300 rounded text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                rows={2}
              />
              <div className="flex space-x-1">
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelNotes}
                  className="flex items-center space-x-1 px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-xs text-orange-800 italic">{task.userNotes}</p>
              <button
                onClick={() => setEditingNotes(true)}
                className="p-1 text-orange-600 hover:text-orange-800 rounded transition-colors"
                title="Edit notes"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
      {showAISuggestions && canShowAISuggestions() && (
        <TaskAISuggestions
          task={task}
          onClose={() => setShowAISuggestions(false)}
          channelContext={task.userNotes}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <BudgetEditor
            label="Task Pay"
            value={task.estimatedPay}
            onChange={handlePayChange}
            min={5}
            max={200}
            size="sm"
          />
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{task.estimatedTime}</span>
          </div>
        </div>
      </div>

      {task.claimedBy && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>Claimed by {task.claimedBy}</span>
        </div>
      )}

      {task.status === 'open' && (
        <div className="space-y-2">
          {!showClaimForm ? (
            <button
              onClick={() => setShowClaimForm(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Claim Task
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={freelancerName}
                onChange={(e) => setFreelancerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleClaim}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowClaimForm(false);
                    setFreelancerName('');
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canProgress() && (
        <div className="space-y-2">
          {task.status === 'in-progress' && (
            <div className="flex items-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Upload files here</span>
            </div>
          )}
          <button
            onClick={() => onStatusChange(task.id, getNextStatus())}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {getNextStatusLabel()}
          </button>
        </div>
      )}

      {task.status === 'completed' && task.completedAt && (
        <div className="text-xs text-gray-500 mt-2">
          Completed on {task.completedAt.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default TaskCard;