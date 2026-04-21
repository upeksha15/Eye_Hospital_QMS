import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Phone, CreditCard, Calendar, MapPin, Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import eyeRegistrationImg from "../assets/eye-registration.png";
import { Link, useNavigate } from "react-router-dom";

// Move InputField component outside to prevent recreation on each render
const InputField = ({ icon: Icon, placeholder, name, type = "text", showToggle = false, label, value, onChange, errors, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, onBlur, maxDate }) => (
  <div className="mb-4 relative z-10">
    {label && <label className="mb-2 block text-sm text-cyan-50/90">{label}</label>}
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
      <input
        type={
          type === 'password' 
            ? (showPassword ? 'text' : 'password')
            : type === 'confirmPassword'
            ? (showConfirmPassword ? 'text' : 'password')
            : type
        }
        name={name}
        value={value}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border bg-slate-900/20 pl-10 ${showToggle ? 'pr-10' : 'pr-3'} text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none transition-colors ${
          errors[name] ? 'border-red-400/80' : 'border-cyan-100/25'
        }`}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete="off"
        max={type === 'date' ? maxDate : undefined}
      />
      {showToggle && type === 'password' && (
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/70 hover:text-cyan-50"
          aria-label="Toggle password visibility"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
      {showToggle && type === 'confirmPassword' && (
        <button 
          type="button" 
          onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/70 hover:text-cyan-50"
          aria-label="Toggle password visibility"
        >
          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
    {errors[name] && <p className="mt-1 text-xs text-red-300 ml-1">{errors[name]}</p>}
  </div>
);

// Move SelectField component outside to prevent recreation on each render
const SelectField = ({ name, label, options, value, onChange, errors }) => (
  <div className="mb-4 relative z-10">
    {label && <label className="mb-2 block text-sm text-cyan-50/90">{label}</label>}
    <div className="relative">
      <select
        name={name}
        value={value}
        className={`h-11 w-full rounded-lg border bg-slate-900/20 px-3 text-sm focus:border-cyan-300/50 focus:outline-none appearance-none transition-colors ${
          errors[name] ? 'border-red-400/80' : 'border-cyan-100/25'
        } ${!value ? 'text-cyan-100/40' : 'text-white'}`}
        onChange={onChange}
      >
        <option value="" className="bg-[#07214c] text-cyan-100/40">Select {label.replace(' *', '')}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#07214c] text-white">{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-100/70">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
    {errors[name] && <p className="mt-1 text-xs text-red-300 ml-1">{errors[name]}</p>}
  </div>
);

const EyeCareRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nicNumber: '',
    dob: '',
    address: '',
    gender: '',
    medicalHistory: '',
    emergencyContact: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============ VALIDATION FUNCTIONS ============

  // Full Name Validation
  const validateFullName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Full name is required";
    }
    if (trimmed.length < 2) {
      return "Full name must be at least 2 characters";
    }
    if (trimmed.length > 100) {
      return "Full name must not exceed 100 characters";
    }
    if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
      return "Full name can only contain letters, spaces, hyphens, and apostrophes";
    }
    if (value !== value.trim()) {
      return "Full name cannot have leading or trailing spaces";
    }
    return "";
  };

  // Email Validation
  const validateEmail = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Email is required";
    }
    if (trimmed.length > 254) {
      return "Email must not exceed 254 characters";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Email must be in the format: user@domain.com";
    }
    return "";
  };

  // Phone Number Validation
  const validatePhoneNumber = (value) => {
    if (!value) {
      return "Phone number is required";
    }
    if (!/^0[0-9]{9}$/.test(value)) {
      return "Phone number must be exactly 10 digits starting with 0";
    }
    return "";
  };

  // Emergency Contact Validation (Optional but if provided, must be valid)
  const validateEmergencyContact = (value) => {
    if (!value) {
      return ""; // Optional field
    }
    if (!/^0[0-9]{9}$/.test(value)) {
      return "Emergency contact must be exactly 10 digits starting with 0";
    }
    return "";
  };

  // NIC Number Validation
  const validateNICNumber = (value) => {
    if (!value) {
      return "NIC number is required";
    }

    const trimmed = value.trim();

    // Check for spaces or special characters
    if (/[\s\-()]/g.test(value)) {
      return "No special characters allowed";
    }

    // Old format: 9 digits + V
    const oldFormatRegex = /^[0-9]{9}[Vv]$/;
    // New format: 12 digits
    const newFormatRegex = /^[0-9]{12}$/;

    if (oldFormatRegex.test(trimmed)) {
      return ""; // Valid old format
    } else if (newFormatRegex.test(trimmed)) {
      return ""; // Valid new format
    } else if (/^[0-9]{9}[XxA-Ua-u]/.test(trimmed)) {
      return "Only 'V' is allowed after the 9 digits";
    } else {
      return "NIC must be 9 digits + V (old) or 12 digits (new)";
    }
  };

  // Helper: Check if email ends with a valid TLD
  const hasValidTLD = (email) => {
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'jp', 'cn', 'in', 'br', 'mx', 'info', 'biz', 'io', 'ai', 'dev', 'app', 'lk'];
    const parts = email.toLowerCase().split('.');
    if (parts.length >= 2) {
      const tld = parts[parts.length - 1];
      return validTLDs.includes(tld) && tld.length >= 2;
    }
    return false;
  };

  // Helper: Convert day-of-year to month and day
  const dayOfYearToDate = (dayOfYear, year) => {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let day = dayOfYear;
    let month = 0;

    while (month < 12 && day > daysInMonths[month]) {
      day -= daysInMonths[month];
      month++;
    }

    return { month: month + 1, day };
  };

  // Helper: Extract birth date from NIC
  const extractBirthDateFromNIC = (nic) => {
    const trimmed = nic.trim().toUpperCase();

    if (/^[0-9]{9}V$/.test(trimmed)) {
      // Old format: 9 digits + V
      const yearLastTwoDigits = parseInt(trimmed.substring(0, 2));
      const dayOfYear = parseInt(trimmed.substring(2, 5));
      const genderCode = dayOfYear;

      // Determine gender and actual day of year
      let actualDayOfYear = genderCode;
      if (genderCode > 500) {
        actualDayOfYear = genderCode - 500;
      }

      // Determine century (assume 1900 or 2000)
      const year = yearLastTwoDigits > 30 ? 1900 + yearLastTwoDigits : 2000 + yearLastTwoDigits;

      if (actualDayOfYear < 1 || actualDayOfYear > 366) {
        return null;
      }

      const dateInfo = dayOfYearToDate(actualDayOfYear, year);
      return {
        year,
        month: dateInfo.month,
        day: dateInfo.day
      };
    } else if (/^[0-9]{12}$/.test(trimmed)) {
      // New format: 12 digits
      const year = parseInt(trimmed.substring(0, 4));
      const dayOfYear = parseInt(trimmed.substring(4, 7));

      // Determine gender and actual day of year
      let actualDayOfYear = dayOfYear;
      if (dayOfYear > 500) {
        actualDayOfYear = dayOfYear - 500;
      }

      if (actualDayOfYear < 1 || actualDayOfYear > 366) {
        return null;
      }

      const dateInfo = dayOfYearToDate(actualDayOfYear, year);
      return {
        year,
        month: dateInfo.month,
        day: dateInfo.day
      };
    }

    return null;
  };

  // Date of Birth Validation
  const validateDateOfBirth = (value) => {
    if (!value) {
      return "Date of birth is required";
    }

    // Parse the date input (can be from date picker or manual entry)
    let selectedDate;

    if (typeof value === 'string') {
      // Date picker returns YYYY-MM-DD format
      if (value.includes('-')) {
        const parts = value.split('-');
        selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        return "Please enter a valid date";
      }
    } else {
      selectedDate = new Date(value);
    }

    if (isNaN(selectedDate.getTime())) {
      return "Please enter a valid date";
    }

    // Check if date is in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      return "Date of birth cannot be in the future";
    }

    // Check if not more than 120 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (selectedDate < minDate) {
      return "Please enter a valid date of birth";
    }

    return "";
  };

  // Cross-validation: NIC and Date of Birth (Relaxed - allows 1-day tolerance)
  const validateNICAndDOBMatch = (nic, dob) => {
    if (!nic || !dob) {
      return { isValid: true, nicError: "", dobError: "" };
    }

    const nicError = validateNICNumber(nic);
    const dobError = validateDateOfBirth(dob);

    if (nicError || dobError) {
      return { isValid: true, nicError, dobError };
    }

    // Extract birth date from NIC
    const nicBirthDate = extractBirthDateFromNIC(nic);
    if (!nicBirthDate) {
      return {
        isValid: false,
        nicError: "Cannot extract valid date from NIC",
        dobError: "NIC does not match the Date of Birth"
      };
    }

    // Parse the DOB input
    let dobDate;
    if (typeof dob === 'string' && dob.includes('-')) {
      const parts = dob.split('-');
      dobDate = {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2])
      };
    } else {
      return { isValid: true, nicError: "", dobError: "" };
    }

    // Compare dates - allow 1-day tolerance for day-of-year rounding differences
    const yearMatch = nicBirthDate.year === dobDate.year;
    const monthMatch = nicBirthDate.month === dobDate.month;
    const dayDiff = Math.abs(nicBirthDate.day - dobDate.day);

    if (yearMatch && monthMatch && dayDiff <= 1) {
      return { isValid: true, nicError: "", dobError: "" };
    } else {
      return {
        isValid: false,
        nicError: "NIC does not match the Date of Birth",
        dobError: "Date of birth does not match the NIC number"
      };
    }
  };

  // ============ EVENT HANDLERS ============

  const handleChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;

    // ===== INPUT FILTERING (Block Invalid Characters) =====

    // Full Name: Only letters, spaces, hyphens, apostrophes
    if (name === "fullName") {
      filteredValue = value.replace(/[^a-zA-Z\s\-']/g, '');
    }

    // Phone Number: Only digits
    if (name === "phoneNumber") {
      filteredValue = value.replace(/[^0-9]/g, '');
      // Ensure max 10 digits
      if (filteredValue.length > 10) {
        filteredValue = filteredValue.slice(0, 10);
      }
    }

    // NIC Number: Only digits and V (case insensitive)
    if (name === "nicNumber") {
      // Remove any invalid characters
      filteredValue = value.replace(/[^0-9Vv]/g, '');
      // Limit to 12 characters max (for the 12-digit new format)
      if (filteredValue.length > 12) {
        filteredValue = filteredValue.slice(0, 12);
      }
    }

    // Emergency Contact: Only digits (same as phone)
    if (name === "emergencyContact") {
      filteredValue = value.replace(/[^0-9]/g, '');
      // Ensure max 10 digits
      if (filteredValue.length > 10) {
        filteredValue = filteredValue.slice(0, 10);
      }
    }

    // Email: Prevent typing after complete TLD (3+ characters only)
    if (name === "email") {
      if (formData.email && value.length > formData.email.length) {
        const parts = formData.email.toLowerCase().split('.');
        if (parts.length >= 2) {
          const tld = parts[parts.length - 1];
          // Only block if TLD is 3+ characters (com, org, edu, etc.)
          if (tld.length >= 3 && hasValidTLD(formData.email)) {
            return;
          }
        }
      }
      filteredValue = value;
    }

    setFormData(prevData => ({
      ...prevData,
      [name]: filteredValue
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = "";

    switch (name) {
      case "fullName":
        error = validateFullName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phoneNumber":
        error = validatePhoneNumber(value);
        break;
      case "nicNumber":
        error = validateNICNumber(value);
        break;
      case "dob":
        error = validateDateOfBirth(value);
        break;
      case "emergencyContact":
        error = validateEmergencyContact(value);
        break;
      default:
        break;
    }

    // Update errors
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Cross-validation for NIC and DOB
    if ((name === "nicNumber" || name === "dob") && formData.nicNumber && formData.dob) {
      const nicToCross = name === "nicNumber" ? value : formData.nicNumber;
      const dobToCross = name === "dob" ? value : formData.dob;

      const crossValidationResult = validateNICAndDOBMatch(nicToCross, dobToCross);

      if (!crossValidationResult.isValid) {
        setErrors(prev => ({
          ...prev,
          nicNumber: crossValidationResult.nicError,
          dob: crossValidationResult.dobError
        }));
      } else {
        // Clear cross-validation errors if they match
        setErrors(prev => {
          const newErrors = { ...prev };
          // Only delete if they were cross-validation errors
          if (newErrors.nicNumber === "NIC does not match the Date of Birth") {
            delete newErrors.nicNumber;
          }
          if (newErrors.dob === "Date of birth does not match the NIC number") {
            delete newErrors.dob;
          }
          return newErrors;
        });
      }
    }
  };

  const validate = () => {
    let tempErrors = {};

    // Validate all fields
    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) tempErrors.fullName = fullNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) tempErrors.email = emailError;

    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) tempErrors.phoneNumber = phoneError;

    const nicError = validateNICNumber(formData.nicNumber);
    if (nicError) tempErrors.nicNumber = nicError;

    const dobError = validateDateOfBirth(formData.dob);
    if (dobError) tempErrors.dob = dobError;

    // Cross-validation for NIC and DOB
    const crossValidation = validateNICAndDOBMatch(formData.nicNumber, formData.dob);
    if (!crossValidation.isValid) {
      if (crossValidation.nicError) tempErrors.nicNumber = crossValidation.nicError;
      if (crossValidation.dobError) tempErrors.dob = crossValidation.dobError;
    }

    // Validate address
    if (!formData.address.trim()) {
      tempErrors.address = "Address is required";
    }

    // Validate gender
    if (!formData.gender) {
      tempErrors.gender = "Gender is required";
    }

    // Validate emergency contact if provided
    const emergencyError = validateEmergencyContact(formData.emergencyContact);
    if (emergencyError) tempErrors.emergencyContact = emergencyError;

    // Validate password
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    // Validate terms
    if (!agreedToTerms) {
      tempErrors.terms = "You must agree to the terms and conditions";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Normalize NIC: uppercase V
      const normalizedNIC = formData.nicNumber.trim().toUpperCase();

      const response = await axios.post('http://localhost:5000/api/users/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber,
        nicNumber: normalizedNIC,
        dob: formData.dob,
        address: formData.address.trim(),
        gender: formData.gender,
        medicalHistory: formData.medicalHistory.trim(),
        emergencyContact: formData.emergencyContact,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data.success) {
        const newUser = response.data.user;
        if (newUser?._id) {
          localStorage.setItem('userId', newUser._id);
        }

        alert("Account Created Successfully! Please login with your credentials.");

        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          nicNumber: '',
          dob: '',
          address: '',
          gender: '',
          medicalHistory: '',
          emergencyContact: '',
          password: '',
          confirmPassword: ''
        });
        setAgreedToTerms(false);
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response) {
        const serverErrors = error.response.data.errors || [];
        const errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          'Registration failed';

        if (serverErrors.length > 0) {
          const newErrors = {};
          serverErrors.forEach((err) => {
            const field = err.path || err.param || err.field;
            if (field) {
              newErrors[field] = err.msg || err.message;
            }
          });
          setErrors(newErrors);
        } else {
          if (/email/i.test(errorMessage)) {
            setErrors((prev) => ({ ...prev, email: errorMessage }));
          } else if (/nic/i.test(errorMessage)) {
            setErrors((prev) => ({ ...prev, nicNumber: errorMessage }));
          }
          alert(errorMessage);
        }
      } else if (error.request) {
        alert('Unable to connect to server. Please check if the backend is running.');
      } else {
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#041a3f] text-white">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Fixed Container with Scrollable Form */}
        <div className="relative flex h-screen flex-col px-4 py-6 sm:px-8">
          {/* Background patterns */}
          <div className="fixed inset-0 login-blue-grid w-full lg:w-1/2 pointer-events-none" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,170,255,0.2),transparent_45%),radial-gradient(circle_at_80%_65%,rgba(20,90,180,0.35),transparent_50%)] w-full lg:w-1/2 pointer-events-none" />

          <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="mb-4 text-center flex-shrink-0">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_20px_rgba(46,174,255,0.45)]"
                aria-label="Go to home page"
              >
                <Eye className="h-7 w-7 text-cyan-200" />
              </button>
              <p className="text-2xl font-medium tracking-wide text-cyan-50">Create Your Account</p>
              <p className="mt-1 text-sm text-cyan-100/70 max-w-sm mx-auto">
                Join us for seamless appointment scheduling and priority eye care services.
              </p>
            </div>

            {/* The Form Card Container */}
            <div className="rounded-2xl border border-cyan-100/20 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl flex-1 flex flex-col min-h-0 overflow-hidden mb-4">
              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                <form onSubmit={handleSubmit}>
                  {/* Section 1: Personal Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-cyan-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-cyan-200/20 pb-2">
                      <CheckCircle size={16} className="text-cyan-400" />
                      Personal Information
                    </h3>
                    <InputField 
                      icon={User} 
                      name="fullName" 
                      placeholder="Enter your full name" 
                      label="Full Name *" 
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errors={errors}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField 
                        icon={Mail} 
                        name="email" 
                        placeholder="your@email.com" 
                        label="Email Address *" 
                        type="text" 
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                      />
                      <InputField 
                        icon={Phone} 
                        name="phoneNumber" 
                        placeholder="07X XXX XXXX" 
                        label="Phone Number *" 
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <InputField 
                        icon={CreditCard} 
                        name="nicNumber" 
                        placeholder="XXXXXXXXXV" 
                        label="NIC Number *" 
                        value={formData.nicNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                      />
                      <InputField 
                        icon={Calendar} 
                        name="dob" 
                        placeholder="YYYY-MM-DD" 
                        label="Date of Birth *" 
                        type="date" 
                        value={formData.dob}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                        maxDate={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <SelectField 
                      name="gender" 
                      label="Gender *" 
                      options={['Male', 'Female', 'Other']} 
                      value={formData.gender}
                      onChange={handleChange}
                      errors={errors}
                    />
                  </div>

                  {/* Section 2: Address Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-cyan-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-cyan-200/20 pb-2">
                      <CheckCircle size={16} className="text-cyan-400" />
                      Address Information
                    </h3>
                    <InputField 
                      icon={MapPin} 
                      name="address" 
                      placeholder="123 Main Street, City" 
                      label="Full Address *" 
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errors={errors}
                    />
                  </div>

                  {/* Section 3: Medical Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-cyan-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-cyan-200/20 pb-2">
                      <CheckCircle size={16} className="text-cyan-400" />
                      Medical Information
                    </h3>
                    <div className="mb-4 relative z-10">
                      <label className="mb-2 block text-sm text-cyan-50/90">Medical History (Optional)</label>
                      <textarea
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        placeholder="Any existing conditions or allergies..."
                        className={`w-full rounded-lg border bg-slate-900/20 px-3 py-2.5 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none transition-colors resize-none ${
                          errors.medicalHistory ? 'border-red-400/80' : 'border-cyan-100/25'
                        }`}
                        rows="3"
                        onChange={handleChange}
                      ></textarea>
                    </div>
                    <InputField 
                      icon={Phone} 
                      name="emergencyContact" 
                      placeholder="Emergency contact number" 
                      label="Emergency Contact (Optional)" 
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errors={errors}
                    />
                  </div>

                  {/* Section 4: Security */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-cyan-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-cyan-200/20 pb-2">
                      <CheckCircle size={16} className="text-cyan-400" />
                      Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField 
                        icon={Lock} 
                        name="password" 
                        placeholder="Enter strong password" 
                        label="Password *" 
                        type="password" 
                        showToggle={true} 
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                      />
                      <InputField 
                        icon={Lock} 
                        name="confirmPassword" 
                        placeholder="Re-enter your password" 
                        label="Confirm Password *" 
                        type="confirmPassword" 
                        showToggle={true} 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errors={errors}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-6 p-3 rounded-lg border border-cyan-100/20 bg-slate-900/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="
                          mt-1 w-5 h-5 border border-cyan-100/40 bg-slate-900/40 rounded-sm 
                          appearance-none relative cursor-pointer
                          checked:after:content-['✔'] 
                          checked:after:absolute checked:after:top-0 checked:after:left-0 
                          checked:after:w-full checked:after:h-full
                          checked:after:flex checked:after:items-center checked:after:justify-center
                          checked:after:text-cyan-300 checked:after:text-sm
                        "
                      />
                      <span className="text-xs text-cyan-100/80 leading-relaxed">
                        I agree to the <span className="font-semibold text-cyan-300">Terms and Conditions</span> and <span className="font-semibold text-cyan-300">Privacy Policy</span> of Eye Hospital Queue System
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-300 text-xs mt-2 ml-8">{errors.terms}</p>}
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      {!isSubmitting && <ArrowRight size={16} />}
                    </span>
                  </button>
                </form>

                <p className="text-center text-xs text-cyan-100/80 mt-5">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-cyan-100 underline decoration-cyan-200/70 hover:text-white">
                    Login Here
                  </Link>
                </p>
              </div> {/* Close scrollable area */}
            </div> {/* Close form card container */}
            
            {/* Footer Information */}
            <div className="text-center pt-2 flex-shrink-0 pb-4">
              <p className="text-xs text-cyan-100/60">
                © 2026 Eye Hospital Queue Management System. All rights reserved.<br/>
                <span className="text-cyan-300 cursor-pointer hover:underline">Privacy Policy</span> | <span className="text-cyan-300 cursor-pointer hover:underline">Terms of Service</span>
              </p>
            </div>

          </div>
        </div>
        
        {/* Right Side: Image */}
        <div
          className="hidden h-screen lg:block bg-cover bg-center bg-no-repeat relative border-l border-cyan-100/10"
          style={{ backgroundImage: `url(${eyeRegistrationImg})` }}
        >
          {/* Subtle gradient overlay to make it blend slightly with the dark theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#041a3f]/80 via-transparent to-[#041a3f]/20 pointer-events-none"></div>
        </div>
      </div>

      <style>{`
        .login-blue-grid {
          background-color: #07214c;
          background-image:
            radial-gradient(circle at 12% 22%, rgba(94, 177, 255, 0.26), transparent 40%),
            radial-gradient(circle at 82% 70%, rgba(43, 120, 210, 0.34), transparent 45%),
            repeating-radial-gradient(circle at 65% 45%, rgba(132, 185, 255, 0.08), rgba(132, 185, 255, 0.08) 2px, transparent 2px, transparent 16px);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.4);
        }

        input::placeholder, textarea::placeholder {
          letter-spacing: 0.01em;
        }
        
        /* Make date picker icon white for dark theme */
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.6;
            cursor: pointer;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
            opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default EyeCareRegistration;