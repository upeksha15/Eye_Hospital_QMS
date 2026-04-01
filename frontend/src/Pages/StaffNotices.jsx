import React, { useState, useEffect } from 'react';
// Route protection is handled by App routes; no local navigation guard needed here
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Notices = () => {
  // Auth check handled by route; no local `user` usage required
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notices, setNotices] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium'
  });
  const [editingNotice, setEditingNotice] = useState(null);
  const [errors, setErrors] = useState({ title: '', message: '' });

  const normalizeNotice = (notice) => ({
    id: notice._id || notice.id,
    title: notice.title,
    message: notice.message,
    priority: notice.priority || 'medium',
    type: notice.type || 'info',
    date: notice.date || notice.createdAt
  });

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/notices`);
        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        setNotices(data.map(normalizeNotice));
      } catch (error) {
        console.error('Error fetching notices from API:', error);
      }
    };

    fetchNotices();
  }, []);


  const validateForm = () => {
    const newErrors = { title: '', message: '' };
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Notice title is required';
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
      isValid = false;
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
      isValid = false;
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      isValid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
      isValid = false;
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingNotice) {
        // Update existing notice via API
        const response = await axios.put(`${API_BASE_URL}/notices/${editingNotice.id}`, {
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          type: editingNotice.type || 'info',
          isActive: true
        });

        const updatedNotice = normalizeNotice(response.data?.data || {});
        setNotices(notices.map(notice => 
          notice.id === editingNotice.id ? updatedNotice : notice
        ));
        setEditingNotice(null);
      } else {
        // Add new notice via API
        const response = await axios.post(`${API_BASE_URL}/notices`, {
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          type: 'info',
          createdBy: 'Medical Staff'
        });

        const createdNotice = normalizeNotice(response.data?.data || {});
        setNotices([createdNotice, ...notices]);
      }
    } catch (error) {
      console.error('Error saving notice:', error);
      return;
    }

    setIsModalOpen(false);
    setErrors({ title: '', message: '' });
    setFormData({
      title: '',
      message: '',
      priority: 'medium'
    });
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      priority: notice.priority
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/notices/${noticeId}`);
      setNotices(notices.filter(notice => notice.id !== noticeId));
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
    setErrors({ title: '', message: '' });
    setFormData({
      title: '',
      message: '',
      priority: 'medium'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 grid grid-rows-[82px_1fr] h-screen relative">
      {/* Background gradient (removed Ophthalmology.jpg image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark -z-20" />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-900/50" />

      <Navbar />
      
      <div className="relative z-10 h-full flex overflow-hidden">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div>
                  <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">Notices</h1>
                  <p className="text-white/90 font-semibold drop-shadow">Manage general announcements and updates</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 border-2 border-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Notice
                </button>
              </div>

              {/* Notices List */}
              <div className="space-y-4">
                {notices.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-bold">No notices available</p>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Click "Add Notice" to create one</p>
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-indigo-200/30 hover:border-indigo-200 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${getPriorityColor(notice.priority)}`}>
                          {getTypeIcon(notice.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-slate-800">{notice.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(notice.priority)}`}>
                                {notice.priority.toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEdit(notice)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit notice"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(notice.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete notice"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-600 mb-3 leading-relaxed">{notice.message}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Added on {new Date(notice.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>
        </main>
          </div>

      {/* Add/Edit Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-300/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{editingNotice ? 'Edit Notice' : 'Add General Notice'}</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Notice Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notice Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) {
                      setErrors({ ...errors, title: '' });
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 ${
                    errors.title 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder="Enter notice title"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) {
                      setErrors({ ...errors, message: '' });
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 min-h-[100px] resize-y ${
                    errors.message 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder="Enter notice message or details"
                />
                <div className="mt-1 flex justify-between items-center">
                  {errors.message ? (
                    <p className="text-xs text-red-600">{errors.message}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Minimum 10 characters, maximum 1000 characters</p>
                  )}
                  <p className={`text-xs ${formData.message.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formData.message.length}/1000
                  </p>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'high' })}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      formData.priority === 'high'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'medium' })}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      formData.priority === 'medium'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'low' })}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      formData.priority === 'low'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Low
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-indigo-500/20 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  {editingNotice ? 'Update Notice' : 'Add Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
