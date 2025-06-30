import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Filter, List, Grid } from 'lucide-react';
import { Task, Channel } from '../types';

interface OrganizationCalendarProps {
  channels: Channel[];
  onTaskClick?: (task: Task) => void;
}

interface CalendarTask extends Task {
  channelName: string;
  channelColor: string;
  daysUntilDue?: number;
  estimatedCompletionDate: Date;
}

const OrganizationCalendar: React.FC<OrganizationCalendarProps> = ({
  channels,
  onTaskClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'in-progress' | 'submitted'>('all');

  // Channel colors for visual distinction
  const channelColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
  ];

  // Get all claimed/active tasks with additional metadata
  const calendarTasks = useMemo(() => {
    const tasks: CalendarTask[] = [];
    
    channels.forEach((channel, channelIndex) => {
      const activeTasks = channel.tasks.filter(task => 
        ['claimed', 'in-progress', 'submitted'].includes(task.status)
      );
      
      activeTasks.forEach(task => {
        // Estimate completion date based on task creation and estimated time
        const estimatedHours = parseInt(task.estimatedTime.split('-')[0]) || 2;
        const estimatedCompletionDate = new Date(task.createdAt);
        estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(estimatedHours / 8));
        
        // Calculate days until due
        const today = new Date();
        const timeDiff = estimatedCompletionDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        tasks.push({
          ...task,
          channelName: channel.name,
          channelColor: channelColors[channelIndex % channelColors.length],
          daysUntilDue,
          estimatedCompletionDate,
        });
      });
    });
    
    return tasks.filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });
  }, [channels, statusFilter]);

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateIter = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const tasksForDay = calendarTasks.filter(task => {
        const taskDate = task.estimatedCompletionDate;
        return taskDate.toDateString() === currentDateIter.toDateString();
      });
      
      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.toDateString() === new Date().toDateString(),
        tasks: tasksForDay,
      });
      
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    
    return days;
  };

  // Generate week view days
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      const tasksForDay = calendarTasks.filter(task => {
        const taskDate = task.estimatedCompletionDate;
        return taskDate.toDateString() === day.toDateString();
      });
      
      days.push({
        date: day,
        isToday: day.toDateString() === new Date().toDateString(),
        tasks: tasksForDay,
      });
    }
    
    return days;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getTaskStatusColor = (task: CalendarTask) => {
    switch (task.status) {
      case 'claimed': return 'border-blue-500 bg-blue-50';
      case 'in-progress': return 'border-yellow-500 bg-yellow-50';
      case 'submitted': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getUrgencyIndicator = (task: CalendarTask) => {
    if (!task.daysUntilDue) return null;
    
    if (task.daysUntilDue < 0) {
      return <AlertTriangle className="w-3 h-3 text-red-600" title="Overdue" />;
    } else if (task.daysUntilDue <= 1) {
      return <Clock className="w-3 h-3 text-orange-600" title="Due soon" />;
    } else if (task.daysUntilDue <= 3) {
      return <TrendingUp className="w-3 h-3 text-yellow-600" title="Due this week" />;
    }
    return null;
  };

  const taskStats = useMemo(() => {
    const stats = {
      claimed: calendarTasks.filter(t => t.status === 'claimed').length,
      inProgress: calendarTasks.filter(t => t.status === 'in-progress').length,
      submitted: calendarTasks.filter(t => t.status === 'submitted').length,
      overdue: calendarTasks.filter(t => t.daysUntilDue && t.daysUntilDue < 0).length,
      totalValue: calendarTasks.reduce((sum, t) => sum + t.estimatedPay, 0),
    };
    return stats;
  }, [calendarTasks]);

  const formatDateHeader = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      const weekDays = generateWeekDays();
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Organization Calendar</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 text-sm ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Active</option>
              <option value="claimed">Claimed</option>
              <option value="in-progress">In Progress</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Claimed</div>
            <div className="text-lg font-bold text-blue-900">{taskStats.claimed}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-sm text-yellow-600 font-medium">In Progress</div>
            <div className="text-lg font-bold text-yellow-900">{taskStats.inProgress}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Submitted</div>
            <div className="text-lg font-bold text-purple-900">{taskStats.submitted}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-red-600 font-medium">Overdue</div>
            <div className="text-lg font-bold text-red-900">{taskStats.overdue}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Total Value</div>
            <div className="text-lg font-bold text-green-900">${taskStats.totalValue}</div>
          </div>
        </div>

        {/* Navigation */}
        {viewMode !== 'list' && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate('prev')}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">{formatDateHeader()}</h3>
            
            <button
              onClick={() => navigateDate('next')}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-100 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${day.isToday ? 'text-blue-600' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {day.tasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={`text-xs p-1 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow ${getTaskStatusColor(task)}`}
                      title={`${task.title} - ${task.claimedBy}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">{task.title}</span>
                        {getUrgencyIndicator(task)}
                      </div>
                    </div>
                  ))}
                  {day.tasks.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-4">
            {generateWeekDays().map((day, index) => (
              <div key={index} className="space-y-2">
                <div className={`text-center p-2 rounded-lg ${
                  day.isToday ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                }`}>
                  <div className="text-sm font-medium">
                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {day.date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-2 min-h-[200px]">
                  {day.tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getTaskStatusColor(task)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{task.channelName}</span>
                        {getUrgencyIndicator(task)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{task.title}</div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span>{task.claimedBy}</span>
                        <DollarSign className="w-3 h-3" />
                        <span>${task.estimatedPay}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Group tasks by date */}
            {Object.entries(
              calendarTasks.reduce((groups, task) => {
                const dateKey = task.estimatedCompletionDate.toDateString();
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(task);
                return groups;
              }, {} as Record<string, CalendarTask[]>)
            )
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([dateKey, tasks]) => (
                <div key={dateKey} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">
                      {new Date(dateKey).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">{tasks.length} task(s)</p>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`w-3 h-3 rounded-full ${task.channelColor}`}></span>
                              <span className="text-sm font-medium text-gray-600">{task.channelName}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {task.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{task.claimedBy}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>${task.estimatedPay}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{task.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 text-right">
                            {getUrgencyIndicator(task)}
                            {task.daysUntilDue !== undefined && (
                              <div className={`text-xs mt-1 ${
                                task.daysUntilDue < 0 ? 'text-red-600' :
                                task.daysUntilDue <= 1 ? 'text-orange-600' :
                                task.daysUntilDue <= 3 ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {task.daysUntilDue < 0 
                                  ? `${Math.abs(task.daysUntilDue)} days overdue`
                                  : task.daysUntilDue === 0
                                  ? 'Due today'
                                  : `${task.daysUntilDue} days left`
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            
            {calendarTasks.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
                <p className="text-gray-600">There are no claimed, in-progress, or submitted tasks to display.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationCalendar;