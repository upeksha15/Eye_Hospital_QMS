import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Eye,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Home,
  History,
  Activity,
  Bell,
  Edit2,
  Trash2,
  Save,
  X,
  Camera,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const location = useLocation();
  const { patient, logout, updatePatient } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState({
    _id: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    nicNumber: '',
    dob: '',
    address: '',
    gender: '',
    medicalHistory: '',
    emergencyContact: '',
    profileImage: ''
  });
  
  const [editedUser, setEditedUser] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Load user data on component mount
  useEffect(() => {
    // Clear old stale userId to force fresh lookup by email
    localStorage.removeItem('oldUserId');
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  // Update current date/time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const initializeUserData = (data) => {
    setUser(data);
    setEditedUser({
      ...data,
      dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
    });
    if (data.profileImage) {
      setImagePreview(data.profileImage);
    }
  };

  const loadUserData = async () => {
    setIsLoadingProfile(true);
    try {
      let loadedUser = null;

      console.log('📋 Starting profile load for patient:', patient?.email, 'Patient ID:', patient?._id);

      // IMPORTANT: patient._id is from Patient model, not User model
      // We must fetch User record by email to get the correct _id
      if (patient?.email) {
        try {
          const encodedEmail = encodeURIComponent(patient.email);
          console.log('🔍 Fetching User record for email:', patient.email);
          const res = await axios.get(`http://localhost:5000/api/users/by-email/${encodedEmail}`);
          if (res.data.success && res.data.user) {
            loadedUser = res.data.user;
            localStorage.setItem('userId', res.data.user._id);
            console.log('✅ Found User record:', {
              name: loadedUser.fullName,
              email: loadedUser.email,
              userID: loadedUser._id
            });
          }
        } catch (err) {
          console.warn('⚠️ Error fetching User by email:', err.response?.data || err.message);
        }
      }

      // Verify the loaded user matches logged-in patient
      if (loadedUser && patient?.email) {
        const emailMatch = loadedUser.email?.toLowerCase() === patient.email?.toLowerCase();
        console.log(`🔐 Email verification: ${emailMatch ? '✅ MATCH' : '❌ MISMATCH'}`, {
          patient_email: patient.email,
          loaded_email: loadedUser.email
        });
      }

      // Fallback: Use patient data from auth context if User record not found
      if (!loadedUser && patient) {
        loadedUser = {
          _id: patient._id || 'temp-id',
          fullName: patient.fullName || '',
          email: patient.email || '',
          phoneNumber: patient.contactNumber || '',
          nicNumber: patient.nic || '',
          dob: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : '',
          address: patient.address || '',
          gender: patient.gender || '',
          medicalHistory: patient.medicalHistory || '',
          emergencyContact: patient.emergencyContact || '',
          profileImage: patient.profileImage || '',
        };
        console.log('⚠️ Using patient fallback (User record not found):', loadedUser.email);
      }

      if (loadedUser) {
        initializeUserData(loadedUser);
        console.log('✅ Profile initialized for:', loadedUser.fullName, '(' + loadedUser.email + ')');
      } else {
        console.error('❌ No user data available');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditedUser(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedUser.fullName || !editedUser.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!editedUser.email || !/\S+@\S+\.\S+/.test(editedUser.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!editedUser.phoneNumber || editedUser.phoneNumber.toString().length < 10) {
      newErrors.phoneNumber = 'Valid phone number is required';
    }
    if (!editedUser.address || !editedUser.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    console.log('🔄 Validating form with data:', editedUser);
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    setIsLoading(true);
    try {
      // Use User._id from loaded profile, not patient._id
      const userId = user._id;
      console.log('📝 UserId:', userId);
      
      if (!userId || userId === 'temp-id') {
        alert('User ID not found. Please refresh and try again.');
        setIsLoading(false);
        return;
      }

      // Always send all fields to ensure complete profile update
      const updateData = {
        fullName: editedUser.fullName || user.fullName || '',
        email: editedUser.email || user.email || '',
        phoneNumber: editedUser.phoneNumber || user.phoneNumber || '',
        address: editedUser.address || user.address || '',
        gender: editedUser.gender || user.gender || '',
        medicalHistory: editedUser.medicalHistory || user.medicalHistory || '',
        emergencyContact: editedUser.emergencyContact || user.emergencyContact || '',
        dob: user.dob || ''
      };

      // Include profileImage if it was changed or exists
      if (editedUser.profileImage) {
        console.log('📸 Image size:', editedUser.profileImage.length, 'bytes');
        updateData.profileImage = editedUser.profileImage;
      }

      console.log('📤 Sending update data with fields:', Object.keys(updateData));
      const response = await axios.put(`http://localhost:5000/api/users/${userId}`, updateData);
      console.log('✅ Update response:', response.data);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        setEditedUser({
          ...updatedUser,
          dob: updatedUser.dob ? new Date(updatedUser.dob).toISOString().split('T')[0] : ''
        });
        setImagePreview(updatedUser.profileImage || null);
        
        // Sync to auth context to update across all pages
        updatePatient({
          fullName: updatedUser.fullName,
          contactNumber: updatedUser.phoneNumber,
          profileImage: updatedUser.profileImage || ''
        });
        
        setIsEditMode(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors.map(e => e.msg).join(', ');
        alert('Validation error: ' + errorMsg);
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({
      ...user,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
    });
    setErrors({});
    setIsEditMode(false);
    setImagePreview(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('This will permanently delete your account. Are you absolutely sure?')) {
      return;
    }

    setIsLoading(true);
    try {
      // Use User._id from loaded profile, not patient._id
      const userId = user._id;
      
      if (!userId || userId === 'temp-id') {
        alert('User ID not found.');
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/users/${userId}`);
      
      if (response.data.success) {
        alert('Account deleted successfully');
        logout();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/';
    }
  };

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'appointments', icon: Calendar, label: 'Get Appointment', path: '/appointments/book' },
    { id: 'history', icon: History, label: 'Past Appointments', path: '/appointments/mine' },
    { id: 'queue', icon: Activity, label: 'Queue Status', path: '/queue' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white bg-white/30 flex items-center justify-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/90">Welcome back,</p>
                <p className="font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-white/70">{currentDateTime.toLocaleString()}</p>
              </div>
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

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#14B8A6] text-white shadow-md'
                      : 'text-white/90 hover:bg-[#0D9488]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
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
          {isLoadingProfile ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2A9DF4] mx-auto mb-4"></div>
                <p className="text-gray-600 font-semibold">Loading your profile...</p>
              </div>
            </div>
          ) : (
          <div className="p-6 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] rounded-xl p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-white" />
                    )}
                  </div>
                  {isEditMode && (
                    <label className="absolute bottom-0 right-0 bg-[#14B8A6] p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#0D9488] transition-all">
                      <Camera size={20} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2 text-white">{user.fullName}</h2>
                  <p className="text-white/90 mb-4">{user.email}</p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-white/80" />
                      <span className="text-sm text-white/90">{user.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-white/80" />
                      <span className="text-sm text-white/90">{user.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="text-[#2563EB]" size={28} />
                  Profile Information
                </h3>
                {!isEditMode && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#0F4C81] to-[#2A9DF4] hover:from-[#0D3D6B] hover:to-[#2388D4] text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-lg transform hover:scale-105"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-lg transform hover:scale-105"
                    >
                      <Trash2 size={18} />
                      Delete Account
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editedUser.fullName}
                          onChange={handleInputChange}
                          className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4] ${
                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      ) : (
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                          <User size={18} className="text-gray-400" />
                          <span className="text-gray-800">{user.fullName}</span>
                        </div>
                      )}
                      {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      {isEditMode ? (
                        <input
                          type="email"
                          name="email"
                          value={editedUser.email}
                          onChange={handleInputChange}
                          className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4] ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      ) : (
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                          <Mail size={18} className="text-gray-400" />
                          <span className="text-gray-800">{user.email}</span>
                        </div>
                      )}
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      {isEditMode ? (
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editedUser.phoneNumber}
                          onChange={handleInputChange}
                          className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4] ${
                            errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      ) : (
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                          <Phone size={18} className="text-gray-400" />
                          <span className="text-gray-800">{user.phoneNumber}</span>
                        </div>
                      )}
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        NIC Number
                      </label>
                      <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                        <CreditCard size={18} className="text-gray-400" />
                        <span className="text-gray-800">{user.nicNumber}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">NIC number cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-gray-800">
                          {user.dob ? formatDate(user.dob) : 'Not set'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Date of birth cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender
                      </label>
                      {isEditMode ? (
                        <select
                          name="gender"
                          value={editedUser.gender}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4]"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                          <User size={18} className="text-gray-400" />
                          <span className="text-gray-800">{user.gender || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Address Information
                  </h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Address *
                    </label>
                    {isEditMode ? (
                      <textarea
                        name="address"
                        value={editedUser.address}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4] resize-none ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="flex items-start gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 min-h-[80px]">
                        <MapPin size={18} className="text-gray-400 mt-1" />
                        <span className="text-gray-800">{user.address}</span>
                      </div>
                    )}
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>

                {/* Medical Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Medical Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Medical History
                      </label>
                      {isEditMode ? (
                        <textarea
                          name="medicalHistory"
                          value={editedUser.medicalHistory || ''}
                          onChange={handleInputChange}
                          rows="4"
                          placeholder="Any existing conditions or allergies..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4] resize-none"
                        />
                      ) : (
                        <div className="flex items-start gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 min-h-[100px]">
                          <FileText size={18} className="text-gray-400 mt-1" />
                          <span className="text-gray-800">
                            {user.medicalHistory || 'No medical history recorded'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      {isEditMode ? (
                        <input
                          type="tel"
                          name="emergencyContact"
                          value={editedUser.emergencyContact || ''}
                          onChange={handleInputChange}
                          placeholder="Emergency contact number"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2A9DF4]"
                        />
                      ) : (
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                          <Phone size={18} className="text-gray-400" />
                          <span className="text-gray-800">
                            {user.emergencyContact || 'Not provided'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditMode && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleUpdate}
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#0F4C81] to-[#2A9DF4] hover:from-[#0D3D6B] hover:to-[#2388D4] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      
    </div>
  );
};

export default UserProfile;

