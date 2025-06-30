import React from 'react';
import { CheckCircle, X, Clock } from 'lucide-react';
import { Task } from '../types';

interface TaskProposalCardProps {
  task: Task;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
}

const TaskProposalCard: React.FC<TaskProposalCardProps> = ({
  task,
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mt-1">
            Proposed
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onApprove(task.id)}
            className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            title="Approve task"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReject(task.id)}
            className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
            title="Reject task"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">{task.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">${task.estimatedPay}</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{task.estimatedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProposalCard;