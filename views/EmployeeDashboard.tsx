import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateFollowUpMessage } from '../services/geminiService';
import { Button } from '../components/Button';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Users, Phone, Crown, UserCheck, UserX, Bell, X } from 'lucide-react';
import { WorkItem, TimeSlot, User } from '../types';

export const EmployeeDashboard: React.FC = () => {
  const { workItems, workerStatuses, updateWorkerStatus, sendMessage, users, messages } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TimeSlot>('Morning');
  const [showNotifications, setShowNotifications] = useState(false);
  
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const getCurrentTime = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // Filter messages for this user
  const myNotifications = messages.filter(m => m.toUserId === user.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Helper to check if a specific action is allowed
  const isActionAllowed = (work: WorkItem, action: 'interest' | 'attendance') => {
    // Attendance only allowed if interested AND it is today
    if (action === 'attendance') {
        const status = workerStatuses.find(s => s.workId === work.id && s.userId === user.id);
        return status?.interest === true && work.date === today;
    }
    return true;
  };

  const handleInterest = async (workId: number, interested: boolean, workTitle: string) => {
    updateWorkerStatus(workId, user.id, 'interest', interested);
    
    // AI Magic: Draft a quick message to the system/admin
    // In a real app, this would go to the specific admin. Here we simulate it.
    try {
        const msg = await generateFollowUpMessage(workTitle, user.name, interested ? 'interested' : 'not_interested');
        if(msg) {
            sendMessage({
                fromAdminId: user.id, // Using user ID here as sender
                toUserId: 1, // Hardcoded to Admin ID 1 for simulation
                workId,
                content: msg
            });
        }
    } catch(e) { console.error(e) }
  };

  const handleAttendance = (workId: number, attending: boolean) => {
    updateWorkerStatus(workId, user.id, 'attendance', attending, attending ? getCurrentTime() : undefined);
  };

  const handleTeamMemberAttendance = (workId: number, memberId: number, attending: boolean) => {
    updateWorkerStatus(workId, memberId, 'attendance', attending, attending ? getCurrentTime() : undefined);
  };

  const filteredWork = workItems.filter(w => w.timeSlot === activeTab).sort((a,b) => b.id - a.id);

  return (
    <div className="space-y-6 relative">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold">Welcome, {user.name}</h2>
            <p className="text-blue-100 mt-1 font-medium opacity-90">Supply Service Dashboard</p>
        </div>
        <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
            <Bell className="text-white w-6 h-6" />
            {myNotifications.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600"></span>
            )}
        </button>
      </div>

      {/* NOTIFICATION CENTER */}
      {showNotifications && (
        <div className="absolute top-24 right-0 z-20 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {myNotifications.length > 0 ? (
                    myNotifications.map((msg, i) => (
                        <div key={msg.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <p className="text-sm text-slate-800">{msg.content}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    <div className="p-6 text-center text-slate-400 text-sm">No new notifications.</div>
                )}
            </div>
        </div>
      )}

      {/* Time Slot Tabs */}
      <div className="flex p-1 space-x-1 bg-slate-100 rounded-xl">
        {(['Morning', 'Noon', 'Night'] as TimeSlot[]).map((slot) => (
          <button
            key={slot}
            onClick={() => setActiveTab(slot)}
            className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all
              ${activeTab === slot 
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/[0.12]'
              }`}
          >
            {slot}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredWork.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">No work available for this slot.</p>
            </div>
        )}

        {filteredWork.map(work => {
            const status = workerStatuses.find(s => s.workId === work.id && s.userId === user.id);
            if (!status) return null; // Should not happen given context init

            const isLeader = work.teamLeaderId === user.id;

            return (
              <div key={work.id} className={`bg-white rounded-xl shadow-sm border p-5 relative overflow-hidden ${isLeader ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-200'}`}>
                 {/* Status Badge */}
                 <div className="absolute top-0 right-0 p-4 flex gap-2">
                    {isLeader && <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200"><Crown className="w-3 h-3" /> Team Leader</span>}
                    {status.attendance === true && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        <Clock className="w-3 h-3" /> {status.attendanceTime || 'Attending'}
                      </span>
                    )}
                    {status.attendance === false && <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Absent</span>}
                    {status.attendance === null && status.interest === true && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Interested</span>}
                    {status.attendance === null && status.interest === false && <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-full">Declined</span>}
                 </div>

                 <div className="pr-32">
                    <h3 className="text-lg font-bold text-slate-900">{work.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2 mb-3 flex-wrap">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {work.date}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {work.startTime} - {work.endTime}
                        </span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(work.place)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors group"
                          title="Open in Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5" /> 
                          <span className="underline decoration-blue-300 group-hover:decoration-blue-500 underline-offset-2">{work.place}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-50" />
                        </a>
                    </div>
                    <p className="text-slate-600 text-sm mb-6">{work.description}</p>
                 </div>

                 {/* Team Leader Section: My Team */}
                 {isLeader && (
                    <div className="mb-6 bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                                <Users className="w-4 h-4" /> My Team Members
                            </h4>
                            <span className="text-[10px] text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-100">
                                Mark your team's attendance
                            </span>
                        </div>
                        <div className="space-y-3">
                            {workerStatuses
                                .filter(s => s.workId === work.id && s.userId !== user.id)
                                .map(s => {
                                    const member = users.find(u => u.id === s.userId);
                                    if (!member) return null;
                                    return (
                                        <div key={member.id} className="bg-white p-3 rounded-md shadow-sm border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <img src={member.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                                        {member.name}
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.interest === true ? 'bg-green-100 text-green-700' : (s.interest === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')}`}>
                                                            {s.interest === true ? 'Confirmed Interest' : (s.interest === false ? 'Declined Interest' : 'Pending Interest')}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                        {member.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {member.address}</span>}
                                                    </div>
                                                    {member.phone && (
                                                        <div className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {member.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Leader Controls */}
                                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                <button 
                                                    onClick={() => handleTeamMemberAttendance(work.id, member.id, true)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                        s.attendance === true 
                                                        ? 'bg-green-500 text-white shadow-sm' 
                                                        : 'bg-white text-slate-600 hover:bg-green-50 hover:text-green-600 border border-slate-200'
                                                    }`}
                                                    title="Mark Present"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" /> Present
                                                </button>
                                                <button 
                                                    onClick={() => handleTeamMemberAttendance(work.id, member.id, false)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                        s.attendance === false 
                                                        ? 'bg-red-500 text-white shadow-sm' 
                                                        : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200'
                                                    }`}
                                                    title="Mark Absent"
                                                >
                                                    <UserX className="w-3.5 h-3.5" /> Absent
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                            {workerStatuses.filter(s => s.workId === work.id && s.userId !== user.id).length === 0 && (
                                <p className="text-xs text-indigo-400 italic text-center py-2">No other members assigned to your team yet.</p>
                            )}
                        </div>
                    </div>
                 )}

                 {/* Action Buttons Area */}
                 <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-4">
                    {/* Interest Selection */}
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Your Interest</p>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                variant={status.interest === true ? 'primary' : 'outline'}
                                onClick={() => handleInterest(work.id, true, work.title)}
                                className={status.interest === true ? 'bg-blue-600 border-blue-600' : ''}
                            >
                                <ThumbsUp className="w-3 h-3 mr-2" /> Interested
                            </Button>
                            <Button 
                                size="sm" 
                                variant={status.interest === false ? 'danger' : 'outline'}
                                onClick={() => handleInterest(work.id, false, work.title)}
                                className={status.interest === false ? 'bg-red-600 text-white border-red-600' : ''}
                            >
                                <ThumbsDown className="w-3 h-3 mr-2" /> Not Interested
                            </Button>
                        </div>
                    </div>

                    {/* Attendance Selection (Only if interested) */}
                    {status.interest === true && (
                         <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Your Attendance</p>
                            {work.date !== today ? (
                                <p className="text-xs text-slate-400 italic">Available on work day</p>
                            ) : (
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant={status.attendance === true ? 'success' : 'outline'}
                                        onClick={() => handleAttendance(work.id, true)}
                                    >
                                        <CheckCircle className="w-3 h-3 mr-2" /> Come
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={status.attendance === false ? 'danger' : 'outline'}
                                        onClick={() => handleAttendance(work.id, false)}
                                    >
                                        <XCircle className="w-3 h-3 mr-2" /> Not Come
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};