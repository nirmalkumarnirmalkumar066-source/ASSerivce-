import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, WorkItem, WorkerStatus, Message } from '../types';

interface DataContextType {
  users: User[];
  workItems: WorkItem[];
  workerStatuses: WorkerStatus[];
  messages: Message[];
  joinCode: string;
  addUser: (user: Omit<User, 'id'>) => void;
  addWorkItem: (item: Omit<WorkItem, 'id'>, assignedWorkerIds: number[]) => void;
  updateWorkItem: (item: WorkItem, assignedWorkerIds: number[]) => void;
  updateWorkerStatus: (workId: number, userId: number, type: 'interest' | 'attendance', value: boolean, time?: string) => void;
  sendMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  getWorkStatusForUser: (workId: number, userId: number) => WorkerStatus | undefined;
  regenerateJoinCode: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock Data
const MOCK_USERS: User[] = [
  { id: 1, name: "Admin Major", email: "admin@as.service", role: 'admin', avatar: "https://picsum.photos/100/100", address: "Headquarters, 1st Ave", phone: "555-0100" },
  { id: 2, name: "John Doe", email: "john@worker.com", role: 'worker', avatar: "https://picsum.photos/101/101", address: "123 Maple St, North District", phone: "555-0101" },
  { id: 3, name: "Jane Smith", email: "jane@worker.com", role: 'worker', avatar: "https://picsum.photos/102/102", address: "456 Oak Ave, South Park", phone: "555-0102" },
  { id: 4, name: "Mike Ross", email: "mike@worker.com", role: 'worker', avatar: "https://picsum.photos/103/103", address: "789 Pine Ln, City Center", phone: "555-0103" },
];

const MOCK_WORK: WorkItem[] = [
  { 
    id: 101, 
    title: "Event Catering Setup", 
    description: "Setup tables and chairs for the gala dinner.", 
    place: "Grand Hotel Ballroom", 
    date: new Date().toISOString().split('T')[0], 
    timeSlot: 'Morning', 
    startTime: "08:00", 
    endTime: "12:00", 
    createdBy: 1,
    teamLeaderId: 2 
  },
  { 
    id: 102, 
    title: "Security Detail", 
    description: "Perimeter check and guest list management.", 
    place: "City Convention Center", 
    date: new Date().toISOString().split('T')[0], 
    timeSlot: 'Night', 
    startTime: "18:00", 
    endTime: "23:00", 
    createdBy: 1,
    teamLeaderId: 4
  }
];

// Helper to generate initial statuses for mock data
const generateInitialStatuses = (works: WorkItem[], users: User[]): WorkerStatus[] => {
  const statuses: WorkerStatus[] = [];
  let idCounter = 1;
  works.forEach(work => {
    // Only assign mock workers to specific tasks to simulate "separated teams"
    const assignedUsers = work.id === 101 ? [2, 3] : (work.id === 102 ? [4] : []);
    
    assignedUsers.forEach(userId => {
        statuses.push({
            id: idCounter++,
            workId: work.id,
            userId: userId,
            interest: null,
            attendance: null,
            attendanceTime: undefined
        });
    });
  });
  return statuses;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or fall back to MOCK data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('as_service_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    const saved = localStorage.getItem('as_service_workItems');
    return saved ? JSON.parse(saved) : MOCK_WORK;
  });

  const [workerStatuses, setWorkerStatuses] = useState<WorkerStatus[]>(() => {
    const saved = localStorage.getItem('as_service_statuses');
    if (saved) return JSON.parse(saved);
    return generateInitialStatuses(
        localStorage.getItem('as_service_workItems') ? JSON.parse(localStorage.getItem('as_service_workItems')!) : MOCK_WORK,
        localStorage.getItem('as_service_users') ? JSON.parse(localStorage.getItem('as_service_users')!) : MOCK_USERS
    );
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('as_service_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [joinCode, setJoinCode] = useState<string>(() => {
    return localStorage.getItem('as_service_joinCode') || 'WORK2024';
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('as_service_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('as_service_workItems', JSON.stringify(workItems));
  }, [workItems]);

  useEffect(() => {
    localStorage.setItem('as_service_statuses', JSON.stringify(workerStatuses));
  }, [workerStatuses]);

  useEffect(() => {
    localStorage.setItem('as_service_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('as_service_joinCode', joinCode);
  }, [joinCode]);


  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Date.now() };
    setUsers(prev => [...prev, newUser]);
  };

  const addWorkItem = (item: Omit<WorkItem, 'id'>, assignedWorkerIds: number[]) => {
    const newWork: WorkItem = { ...item, id: Date.now() };
    setWorkItems(prev => [...prev, newWork]);
    
    // Create statuses ONLY for assigned workers
    const newStatuses: WorkerStatus[] = assignedWorkerIds.map((userId, index) => ({
      id: Date.now() + index,
      workId: newWork.id,
      userId: userId,
      interest: null,
      attendance: null
    }));
    
    setWorkerStatuses(prev => [...prev, ...newStatuses]);
  };

  const updateWorkItem = (updatedItem: WorkItem, assignedWorkerIds: number[]) => {
    setWorkItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    setWorkerStatuses(prev => {
        // Keep statuses for other works
        const otherWorkStatuses = prev.filter(s => s.workId !== updatedItem.id);
        
        // Get existing statuses for this work
        const currentWorkStatuses = prev.filter(s => s.workId === updatedItem.id);

        const updatedStatusesForWork: WorkerStatus[] = assignedWorkerIds.map((userId, idx) => {
            const existing = currentWorkStatuses.find(s => s.userId === userId);
            if (existing) return existing; // Preserve existing data if user was already assigned

            // Create new status if newly assigned
            return {
                id: Date.now() + idx + Math.random(), 
                workId: updatedItem.id,
                userId: userId,
                interest: null,
                attendance: null
            };
        });

        return [...otherWorkStatuses, ...updatedStatusesForWork];
    });
  };

  const updateWorkerStatus = (workId: number, userId: number, type: 'interest' | 'attendance', value: boolean, time?: string) => {
    setWorkerStatuses(prev => prev.map(status => {
      if (status.workId === workId && status.userId === userId) {
        return { 
          ...status, 
          [type]: value,
          attendanceTime: type === 'attendance' && value === true 
            ? (time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) 
            : (type === 'attendance' && value === false ? undefined : status.attendanceTime)
        };
      }
      return status;
    }));
  };

  const sendMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...msg,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const getWorkStatusForUser = (workId: number, userId: number) => {
    return workerStatuses.find(s => s.workId === workId && s.userId === userId);
  };

  const regenerateJoinCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setJoinCode(result);
  };

  return (
    <DataContext.Provider value={{ users, workItems, workerStatuses, messages, joinCode, addUser, addWorkItem, updateWorkItem, updateWorkerStatus, sendMessage, getWorkStatusForUser, regenerateJoinCode }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};