import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateWorkDescription, generateDailyInsight } from '../services/geminiService';
import { Button } from '../components/Button';
import { Plus, Clock, Users, Sparkles, Pencil, CheckSquare, AlertCircle, Home, Mail, Phone, UserPlus, Search, MapPin, FileSpreadsheet, Download, Calendar as CalendarIcon, List, Crown, ChevronLeft, ChevronRight, ClipboardList, Copy, RefreshCw, Bell } from 'lucide-react';
import { WorkItem, TimeSlot, User } from '../types';

export const AdminDashboard: React.FC = () => {
  const { workItems, addWorkItem, updateWorkItem, workerStatuses, updateWorkerStatus, users, addUser, joinCode, regenerateJoinCode, sendMessage } = useData();
  const { user } = useAuth();
  
  // View Modes
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState<number | null>(null); // Work ID
  const [aiInsight, setAiInsight] = useState<string>('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Work Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('Morning');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [assignWorkerSearch, setAssignWorkerSearch] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState<number | null>(null);

  // Worker Form State
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerAddress, setNewWorkerAddress] = useState('');

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Generate Insight on Load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysWork = workItems.filter(w => w.date === today);
    const relevantStatus = workerStatuses.filter(s => todaysWork.map(w => w.id).includes(s.workId));
    
    const interested = relevantStatus.filter(s => s.interest === true).length;
    const notInterested = relevantStatus.filter(s => s.interest === false).length;

    generateDailyInsight(todaysWork.length, interested, notInterested).then(setAiInsight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems, workerStatuses]);

  const workers = users.filter(u => u.role === 'worker');

  // Calculate worker availability
  const workerAvailability = useMemo(() => {
    const conflictingWorkItems = workItems.filter(w => 
      w.date === date && 
      w.timeSlot === timeSlot && 
      w.id !== editingId
    );
    
    const conflictingWorkIds = conflictingWorkItems.map(w => w.id);
    const busyMap = new Map<number, string>();

    workerStatuses.forEach(s => {
      if (conflictingWorkIds.includes(s.workId)) {
        const work = conflictingWorkItems.find(w => w.id === s.workId);
        if (work) {
          busyMap.set(s.userId, `${work.title} (${work.place})`);
        }
      }
    });

    return busyMap;
  }, [workItems, workerStatuses, date, timeSlot, editingId]);

  const handleAiGenerate = async () => {
    if (!title || !place) return;
    setGeneratingDesc(true);
    const desc = await generateWorkDescription(title, place, timeSlot);
    setDescription(desc);
    setGeneratingDesc(false);
  };

  const handleEdit = (work: WorkItem) => {
    setTitle(work.title);
    setPlace(work.place);
    setDate(work.date);
    setTimeSlot(work.timeSlot);
    setStartTime(work.startTime);
    setEndTime(work.endTime);
    setDescription(work.description);
    setTeamLeaderId(work.teamLeaderId || null);
    
    const assignedWorkerIds = workerStatuses
      .filter(s => s.workId === work.id)
      .map(s => s.userId);
    setSelectedWorkers(assignedWorkerIds);

    setEditingId(work.id);
    setShowWorkModal(true);
  };

  const resetWorkForm = () => {
    setTitle('');
    setPlace('');
    setDate(new Date().toISOString().split('T')[0]);
    setTimeSlot('Morning');
    setStartTime('');
    setEndTime('');
    setDescription('');
    setSelectedWorkers([]);
    setAssignWorkerSearch('');
    setEditingId(null);
    setTeamLeaderId(null);
    setShowWorkModal(false);
  };

  const resetWorkerForm = () => {
    setNewWorkerName('');
    setNewWorkerEmail('');
    setNewWorkerPhone('');
    setNewWorkerAddress('');
    setShowWorkerModal(false);
  };

  const toggleWorker = (userId: number) => {
    setSelectedWorkers(prev => {
        const newSelection = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
        // If we deselect the leader, clear the leader field
        if (teamLeaderId === userId && !newSelection.includes(userId)) {
            setTeamLeaderId(null);
        }
        return newSelection;
    });
  };

  const toggleAllWorkers = () => {
    const visibleWorkers = workers.filter(w => 
        w.name.toLowerCase().includes(assignWorkerSearch.toLowerCase()) || 
        w.email.toLowerCase().includes(assignWorkerSearch.toLowerCase())
    );
    
    const visibleIds = visibleWorkers.map(w => w.id);
    const allSelected = visibleIds.every(id => selectedWorkers.includes(id));

    if (allSelected) {
      // Deselect all visible
      setSelectedWorkers(prev => prev.filter(id => !visibleIds.includes(id)));
      if (teamLeaderId && visibleIds.includes(teamLeaderId)) setTeamLeaderId(null);
    } else {
      // Select all visible
      const newSelected = new Set([...selectedWorkers, ...visibleIds]);
      setSelectedWorkers(Array.from(newSelected));
    }
  };

  const selectAvailableWorkers = () => {
    const visibleWorkers = workers.filter(w => 
        w.name.toLowerCase().includes(assignWorkerSearch.toLowerCase()) || 
        w.email.toLowerCase().includes(assignWorkerSearch.toLowerCase())
    );

    const availableIds = visibleWorkers
        .filter(w => !workerAvailability.has(w.id))
        .map(w => w.id);
        
    const newSelected = new Set([...selectedWorkers, ...availableIds]);
    setSelectedWorkers(Array.from(newSelected));
  };

  const handleWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (editingId) {
      const original = workItems.find(w => w.id === editingId);
      if (original) {
        updateWorkItem({
          ...original,
          title,
          place,
          date,
          timeSlot,
          startTime,
          endTime,
          description,
          teamLeaderId
        }, selectedWorkers);
      }
    } else {
      addWorkItem({
        title,
        place,
        date,
        timeSlot,
        startTime,
        endTime,
        description,
        createdBy: user.id,
        teamLeaderId
      }, selectedWorkers);
    }
    resetWorkForm();
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
        name: newWorkerName,
        email: newWorkerEmail,
        role: 'worker',
        phone: newWorkerPhone,
        address: newWorkerAddress,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newWorkerName)}&background=random`
    });
    resetWorkerForm();
  };

  const handleSendReminder = (work: WorkItem) => {
    const statuses = workerStatuses.filter(s => s.workId === work.id);
    const recipientIds = statuses.map(s => s.userId);
    
    // Broadcast message
    recipientIds.forEach(userId => {
        sendMessage({
            fromAdminId: user!.id,
            toUserId: userId,
            workId: work.id,
            content: `🔔 Reminder: You have a shift for "${work.title}" at ${work.place} tomorrow (${work.date} ${work.startTime}). Please confirm your attendance.`
        });
    });
    alert(`Sent notifications to ${recipientIds.length} workers.`);
  };

  // EXPORT FUNCTIONS
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportWorkersCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address'];
    const rows = workers.map(w => [w.id, w.name, w.email, w.phone || '', w.address || ''].map(f => `"${f}"`).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `workers_list_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportScheduleCSV = () => {
    const headers = ['Work Title', 'Date', 'Time Slot', 'Location', 'Team Leader', 'Worker Name', 'Status', 'Attendance', 'Time In'];
    const rows: string[] = [];

    workItems.forEach(work => {
        const statuses = workerStatuses.filter(s => s.workId === work.id);
        const leader = users.find(u => u.id === work.teamLeaderId);
        statuses.forEach(status => {
            const worker = users.find(u => u.id === status.userId);
            if (worker) {
                const interestStr = status.interest === true ? 'Interested' : (status.interest === false ? 'Not Interested' : 'Pending');
                const attendStr = status.attendance === true ? 'Present' : (status.attendance === false ? 'Absent' : '-');
                const timeIn = status.attendanceTime || '';
                rows.push([
                    work.title,
                    work.date,
                    work.timeSlot,
                    work.place,
                    leader ? leader.name : 'None',
                    worker.name,
                    interestStr,
                    attendStr,
                    timeIn
                ].map(f => `"${f}"`).join(','));
            }
        });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `work_schedule_${new Date().toISOString().split('T')[0]}.csv`);
  };


  const getSlotColor = (slot: TimeSlot) => {
    switch(slot) {
      case 'Morning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Noon': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Night': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getSlotDotColor = (slot: TimeSlot) => {
    switch(slot) {
      case 'Morning': return 'bg-amber-400';
      case 'Noon': return 'bg-orange-500';
      case 'Night': return 'bg-indigo-600';
    }
  };

  // Calendar Logic
  const monthStart = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
  const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday

  const handlePrevMonth = () => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  
  const calendarDays = [];
  // Padding for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), i));
  }

  // Filter logic
  const sortedWork = [...workItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredWork = sortedWork.filter(work => {
    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || (
        work.title.toLowerCase().includes(query) ||
        work.place.toLowerCase().includes(query) ||
        // Also search by assigned worker name
        workerStatuses.filter(s => s.workId === work.id).map(s => s.userId).some(id => users.find(u => u.id === id)?.name.toLowerCase().includes(query))
    );
    return matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm">Manage work assignments and view status.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-start md:items-center">
             {/* JOIN CODE CARD */}
             <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 flex items-center gap-3">
                <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Join Code</div>
                <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900 font-mono font-bold tracking-wider">{joinCode}</code>
                    <button onClick={regenerateJoinCode} className="text-indigo-400 hover:text-indigo-600" title="Generate New Code">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => navigator.clipboard.writeText(joinCode)} 
                        className="text-indigo-400 hover:text-indigo-600"
                        title="Copy to Clipboard"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
             </div>

             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-4 h-4 mr-2" /> List
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                </button>
             </div>

            <Button variant="outline" onClick={exportWorkersCSV} title="Export Worker List to CSV">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                List
            </Button>
            <Button variant="outline" onClick={exportScheduleCSV} title="Export Schedule to CSV">
                <Download className="w-4 h-4 mr-2 text-blue-600" />
                Schedule
            </Button>
            
            <Button variant="outline" onClick={() => setShowWorkerModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Worker
            </Button>
            <Button onClick={() => { resetWorkForm(); setShowWorkModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Work
            </Button>
        </div>
      </div>

      {aiInsight && (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 p-4 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-violet-900 text-sm">Daily AI Insight</h4>
            <p className="text-violet-700 text-sm">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* VIEW: CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-slate-500" />
                    {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px border-b border-slate-200">
                {calendarDays.map((day, idx) => {
                    if (!day) return <div key={idx} className="bg-slate-50/50 min-h-[120px]"></div>;
                    
                    const dayString = day.toISOString().split('T')[0];
                    const dayWork = workItems.filter(w => w.date === dayString);
                    const isToday = dayString === new Date().toISOString().split('T')[0];

                    return (
                        <div key={idx} className={`bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                    {day.getDate()}
                                </span>
                                {dayWork.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{dayWork.length}</span>}
                            </div>
                            <div className="mt-2 space-y-1">
                                {dayWork.map(work => (
                                    <button 
                                        key={work.id}
                                        onClick={() => handleEdit(work)}
                                        className="w-full text-left text-xs p-1.5 rounded bg-slate-50 border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getSlotDotColor(work.timeSlot)}`}></span>
                                            <span className="font-medium text-slate-900 truncate">{work.timeSlot}</span>
                                        </div>
                                        <div className="text-slate-500 truncate pl-3">{work.title}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* VIEW: LIST */}
      {viewMode === 'list' && (
        <>
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-shadow"
                placeholder="Search by title, location, or assigned worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Work List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWork.length > 0 ? (
                filteredWork.map(work => {
                    const statuses = workerStatuses.filter(s => s.workId === work.id);
                    const interestedCount = statuses.filter(s => s.interest === true).length;
                    const notInterestedCount = statuses.filter(s => s.interest === false).length;
                    const confirmedCount = statuses.filter(s => s.attendance === true).length;
                    const leader = users.find(u => u.id === work.teamLeaderId);

                    return (
                        <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSlotColor(work.timeSlot)}`}>
                                {work.timeSlot}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs font-medium">{work.date}</span>
                                <button 
                                onClick={() => handleEdit(work)} 
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
                                title="Edit Work"
                                >
                                <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                onClick={() => handleSendReminder(work)} 
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                                title="Notify/Remind Workers"
                                >
                                <Bell className="w-4 h-4" />
                                </button>
                            </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{work.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{work.description}</p>
                            
                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {work.startTime} - {work.endTime}
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(work.place)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-600 group-hover:text-blue-600 group-hover:underline transition-colors truncate"
                                    onClick={(e) => e.stopPropagation()}
                                    title="View on Map"
                                    >
                                    {work.place}
                                    </a>
                                </div>
                                {leader && (
                                    <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                        <Crown className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                        <span className="truncate">Leader: {leader.name}</span>
                                        {leader.phone && (
                                            <span className="text-xs text-slate-400 font-normal">({leader.phone})</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-lg font-bold text-emerald-600">{interestedCount}</div>
                                <div className="text-xs text-slate-400">Interested</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-red-500">{notInterestedCount}</div>
                                <div className="text-xs text-slate-400">Declined</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-blue-600">{confirmedCount}</div>
                                <div className="text-xs text-slate-400">Attending</div>
                            </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex -space-x-2 overflow-hidden">
                            {statuses.slice(0, 4).map(s => {
                                const w = users.find(u => u.id === s.userId);
                                const borderColor = s.interest === true ? 'ring-emerald-400' : (s.interest === false ? 'ring-red-300' : 'ring-white');
                                const isLeader = w?.id === work.teamLeaderId;
                                return w ? (
                                    <div key={s.id} className="relative inline-block">
                                        <img className={`h-8 w-8 rounded-full ring-2 ${borderColor} bg-white object-cover`} src={w.avatar} alt={w.name} title={`${w.name} (${s.interest === true ? 'Interested' : (s.interest === false ? 'Not Interested' : 'Pending')})`} />
                                        {isLeader && <div className="absolute -top-1.5 -right-0.5 text-[8px] bg-indigo-500 text-white rounded-full p-0.5 ring-1 ring-white"><Crown size={8} fill="white" /></div>}
                                    </div>
                                ) : null;
                            })}
                            {statuses.length > 4 && (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 text-[10px] text-slate-600 font-medium">
                                    +{statuses.length - 4}
                                </div>
                            )}
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-8" 
                                onClick={() => setShowAttendanceModal(work.id)}
                            >
                                <ClipboardList className="w-3.5 h-3.5 mr-1" />
                                Attendance
                            </Button>
                        </div>
                        </div>
                    );
                })
                ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900">No results found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try searching for a different title, location, or worker name.</p>
                </div>
                )}
            </div>
        </>
      )}

      {/* Add Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900">Add New Worker</h3>
                    <button onClick={resetWorkerForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                <form onSubmit={handleWorkerSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input required type="text" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="e.g. Alex Johnson" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input required type="email" value={newWorkerEmail} onChange={e => setNewWorkerEmail(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="alex@worker.com" />
                        <p className="text-xs text-slate-500 mt-1">This email will be used as their login password.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input required type="tel" value={newWorkerPhone} onChange={e => setNewWorkerPhone(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="e.g. 555-0199" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                        <input required type="text" value={newWorkerAddress} onChange={e => setNewWorkerAddress(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="e.g. 42 Main St" />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="secondary" onClick={resetWorkerForm} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Create Worker</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Attendance Manager Modal */}
      {showAttendanceModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        Attendance Sheet
                    </h3>
                    <button onClick={() => setShowAttendanceModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead>
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time In</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {workerStatuses
                                .filter(s => s.workId === showAttendanceModal)
                                .map(status => {
                                    const worker = users.find(u => u.id === status.userId);
                                    if (!worker) return null;
                                    const isLeader = workItems.find(w => w.id === showAttendanceModal)?.teamLeaderId === worker.id;
                                    
                                    return (
                                        <tr key={status.id}>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8">
                                                        <img className="h-8 w-8 rounded-full bg-slate-200" src={worker.avatar} alt="" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-slate-900 flex items-center gap-1">
                                                            {worker.name}
                                                            {isLeader && <Crown className="w-3 h-3 text-indigo-500" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{worker.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    status.interest === true ? 'bg-green-100 text-green-800' : 
                                                    (status.interest === false ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
                                                }`}>
                                                    {status.interest === true ? 'Interested' : (status.interest === false ? 'Declined' : 'Pending')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateWorkerStatus(status.workId, status.userId, 'attendance', true)}
                                                        className={`px-3 py-1 rounded text-xs font-medium border ${status.attendance === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button 
                                                        onClick={() => updateWorkerStatus(status.workId, status.userId, 'attendance', false)}
                                                        className={`px-3 py-1 rounded text-xs font-medium border ${status.attendance === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {status.attendance === true ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <input 
                                                            type="time" 
                                                            className="border-b border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent text-sm w-24"
                                                            value={status.attendanceTime || ''}
                                                            onChange={(e) => updateWorkerStatus(status.workId, status.userId, 'attendance', true, e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <Button onClick={() => setShowAttendanceModal(null)}>Close</Button>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Work Modal */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Work Details' : 'Assign New Work'}</h3>
              <button onClick={resetWorkForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleWorkSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">Work Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Work Title</label>
                        <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Wedding Catering" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input required type="text" value={place} onChange={e => setPlace(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 pl-9 border focus:ring-blue-500 focus:border-blue-500" placeholder="Location address" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                          <select value={timeSlot} onChange={e => setTimeSlot(e.target.value as TimeSlot)} className="w-full border-slate-300 rounded-lg p-2.5 border">
                            <option value="Morning">Morning</option>
                            <option value="Noon">Noon</option>
                            <option value="Night">Night</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                          <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                          <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Description
                          <button type="button" onClick={handleAiGenerate} disabled={generatingDesc || !title || !place} className="ml-2 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                            {generatingDesc ? 'Generating...' : '✨ Generate with AI'}
                          </button>
                        </label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-blue-500 focus:border-blue-500" placeholder="Work duties and requirements..." />
                      </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Assign Workers</h4>
                        <div className="flex gap-2">
                            <button type="button" onClick={selectAvailableWorkers} className="text-xs text-blue-600 hover:text-blue-800">Select Available</button>
                            <span className="text-slate-300">|</span>
                            <button type="button" onClick={toggleAllWorkers} className="text-xs text-blue-600 hover:text-blue-800">Toggle All</button>
                        </div>
                     </div>
                     
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Filter workers..." 
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                            value={assignWorkerSearch}
                            onChange={(e) => setAssignWorkerSearch(e.target.value)}
                        />
                     </div>

                     <div className="h-48 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 space-y-1 p-1">
                        {workers
                            .filter(w => w.name.toLowerCase().includes(assignWorkerSearch.toLowerCase()) || w.email.toLowerCase().includes(assignWorkerSearch.toLowerCase()))
                            .map(worker => {
                                const isBusy = workerAvailability.has(worker.id);
                                const busyDetails = workerAvailability.get(worker.id);
                                return (
                                    <div 
                                        key={worker.id} 
                                        className={`flex items-start p-2 rounded-md transition-colors cursor-pointer border ${
                                            selectedWorkers.includes(worker.id) 
                                                ? 'bg-blue-50 border-blue-200' 
                                                : (isBusy ? 'bg-amber-50 border-amber-100' : 'hover:bg-white border-transparent')
                                        }`}
                                        onClick={() => toggleWorker(worker.id)}
                                    >
                                        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 mr-3 transition-colors ${selectedWorkers.includes(worker.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                            {selectedWorkers.includes(worker.id) && <CheckSquare size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-900 truncate">{worker.name}</div>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail size={10} /> {worker.email}
                                                </div>
                                                {worker.address && (
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                                        <Home size={10} /> {worker.address}
                                                    </div>
                                                )}
                                            </div>
                                            {isBusy && (
                                                <div className="flex items-start gap-1 mt-1.5 text-xs text-amber-700 font-medium bg-amber-100/50 p-1 rounded">
                                                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                                    <span>Busy: {busyDetails}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        {workers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No workers found.</p>}
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Team Leader (Sub Manager)
                            <span className="ml-1 text-xs font-normal text-slate-500">- Optional</span>
                        </label>
                        <div className="relative">
                            <Crown className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                            <select 
                                value={teamLeaderId || ''} 
                                onChange={e => setTeamLeaderId(e.target.value ? Number(e.target.value) : null)} 
                                className="w-full border-slate-300 rounded-lg p-2.5 pl-9 border focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                disabled={selectedWorkers.length === 0}
                            >
                                <option value="">No Leader Assigned</option>
                                {users
                                    .filter(u => selectedWorkers.includes(u.id))
                                    .map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.phone ? `(${u.phone})` : ''}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        {selectedWorkers.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1">Select workers first to assign a leader.</p>
                        )}
                     </div>
                  </div>
              </div>

            </form>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={resetWorkForm}>Cancel</Button>
              <Button onClick={handleWorkSubmit}>{editingId ? 'Save Changes' : 'Create Assignment'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};