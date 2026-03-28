import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  User, 
  LogOut, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Bell,
  MapPin,
  Phone,
  Mail,
  FileText,
  Home,
  History,
  Settings,
  TrendingUp,
  Users,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

    

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patient, logout, role } = useAuth();
  
  const [user, setUser] = useState(patient || {
    fullName: 'Loading...',
    email: '',
    contactNumber: '',
    nic: ''
  });
  
  useEffect(() => {
    if (patient) {
      setUser(patient);
    }
  }, [patient]);
  
  const [queueStatus, setQueueStatus] = useState({
    isInQueue: true,
    queueNumber: 15,
    position: 3,
    estimatedWaitTime: 25,
    status: 'active'
  });

  const [appointments, setAppointments] = useState({
    upcoming: [
      {
        id: 1,
        date: '2024-01-15',
        time: '10:00 AM',
        doctor: 'Dr. Sarah Johnson',
        department: 'General Eye Care',
        status: 'approved',
        type: 'Regular Checkup'
      },
      {
        id: 2,
        date: '2024-01-20',
        time: '02:30 PM',
        doctor: 'Dr. Michael Chen',
        department: 'Retina Specialist',
        status: 'pending',
        type: 'Follow-up'
      }
    ],
    past: [
      {
        id: 3,
        date: '2023-12-10',
        time: '11:00 AM',
        doctor: 'Dr. Sarah Johnson',
        department: 'General Eye Care',
        status: 'completed',
        type: 'Regular Checkup'
      }
    ]
  });

  // Simulate real-time queue updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (queueStatus.isInQueue && queueStatus.position > 0) {
        setQueueStatus(prev => ({
          ...prev,
          position: Math.max(0, prev.position - 1),
          estimatedWaitTime: Math.max(0, prev.estimatedWaitTime - 1)
        }));
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [queueStatus.isInQueue, queueStatus.position]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'appointments', icon: Calendar, label: 'Get Appointment', path: '/appointments/book' },
    { id: 'history', icon: History, label: 'Past Appointments', path: '/appointments/mine' },
    { id: 'queue', icon: Activity, label: 'Queue Status', path: '/queue' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0F4C81] to-[#2A9DF4] text-white shadow-xl z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/25 p-2 rounded-lg shadow-md">
              <Eye size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Queue Management System</h2>
             
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-white/90">Welcome back,</p>
              <p className="font-semibold text-white">{user.fullName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/25 hover:bg-white/35 px-4 py-2 rounded-lg transition-all duration-200 shadow-md text-white"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-[#0E7490] to-[#14B8A6] text-white border-r border-gray-200 flex flex-col shadow-sm h-full">
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname === item.path;

              const handleClick = () => {
                if (item.path) navigate(item.path);
              };

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#14B8A6] text-white shadow-md'
                      : 'text-white/90 hover:bg-[#0D9488]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-2 border-t border-white/20 mt-auto">
            <div className="bg-gradient-to-b from-[#0E7490] to-[#14B8A6] rounded-lg p-2 text-white shadow-md">
              <div className="flex items-center gap-1.5 mb-1">
                <Bell size={14} className="text-white" />
                <span className="text-xs font-semibold text-white">Quick Help</span>
              </div>
              <p className="text-xs text-white/90 leading-tight">
                Need assistance? Contact us at +94 11 234 5678
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] rounded-xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-white">Welcome, {user.fullName}!</h2>
                <p className="text-white/90">Manage your appointments and track your queue status in real-time.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1 text-[#6B7280]">Upcoming</p>
                      <p className="text-2xl font-bold text-[#1F2937]">{appointments.upcoming.length}</p>
                    </div>
                    <div className="bg-[#DBEAFE] p-3 rounded-lg">
                      <Calendar size={24} className="text-[#2563EB]" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1 text-[#6B7280]">In Queue</p>
                      <p className="text-2xl font-bold text-[#1F2937]">
                        {queueStatus.isInQueue ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-[#CCFBF1] p-3 rounded-lg">
                      <Activity size={24} className="text-[#0D9488]" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1 text-[#6B7280]">Completed</p>
                      <p className="text-2xl font-bold text-[#1F2937]">{appointments.past.length}</p>
                    </div>
                    <div className="bg-[#DCFCE7] p-3 rounded-lg">
                      <CheckCircle size={24} className="text-[#16A34A]" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1 text-[#6B7280]">Wait Time</p>
                      <p className="text-2xl font-bold text-[#1F2937]">
                        {queueStatus.isInQueue ? `${queueStatus.estimatedWaitTime}m` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-[#FEF3C7] p-3 rounded-lg">
                      <Timer size={24} className="text-[#EA580C]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Queue Status Card */}
              {queueStatus.isInQueue && (
                <div className="bg-[#F0F9FF] rounded-xl shadow-lg border-2 border-[#BAE6FD] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#2A9DF4] p-3 rounded-lg">
                        <Activity className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0F4C81]">Current Queue Status</h3>
                        <p className="text-sm text-[#6B7280]">Real-time updates</p>
                      </div>
                    </div>
                    <div className="bg-[#DCFCE7] px-4 py-2 rounded-full">
                      <span className="font-semibold text-sm text-[#15803D]">Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
                      <p className="text-sm mb-1 text-[#6B7280]">Queue Number</p>
                      <p className="text-3xl font-bold text-[#0F4C81]">#{queueStatus.queueNumber}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
                      <p className="text-sm mb-1 text-[#6B7280]">Position</p>
                      <p className="text-3xl font-bold text-[#0F4C81]">{queueStatus.position}</p>
                      <p className="text-xs mt-1 text-[#6B7280]">people ahead</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
                      <p className="text-sm mb-1 text-[#6B7280]">Est. Wait Time</p>
                      <p className="text-3xl font-bold text-[#0F4C81]">{queueStatus.estimatedWaitTime}</p>
                      <p className="text-xs mt-1 text-[#6B7280]">minutes</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD]">
                    <p className="text-sm flex items-center gap-2 text-[#0F4C81]">
                      <Bell size={16} />
                      You'll be notified when it's your turn. Please stay nearby.
                    </p>
                  </div>
                </div>
              )}

              {/* Upcoming Appointments */}
              <div className="bg-[#F0F9FF] rounded-xl shadow-md border-2 border-[#BAE6FD] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#0F4C81] flex items-center gap-2">
                    <div className="bg-[#2A9DF4] p-2 rounded-lg">
                      <Calendar className="text-white" size={20} />
                    </div>
                    Upcoming Appointments
                  </h3>
                  
                  
                </div>
                {appointments.upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.upcoming.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-[#0F4C81]">{appointment.doctor}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-[#6B7280] mb-1">{appointment.department}</p>
                            <div className="flex items-center gap-4 text-sm text-[#6B7280] mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(appointment.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {appointment.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                {appointment.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6B7280]">
                    <Calendar size={48} className="mx-auto mb-2 text-[#BAE6FD]" />
                    <p>No upcoming appointments</p>
                    <button
                      type="button"
                      onClick={() => navigate('/appointments/book')}
                      className="mt-4 font-semibold text-[#0F4C81] hover:text-[#2A9DF4] transition-colors"
                    >
                      Book an Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>

              </main>
      </div>

      
    </div>
  );
};

export default UserDashboard;

