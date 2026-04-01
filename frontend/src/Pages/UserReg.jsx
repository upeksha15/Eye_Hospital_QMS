import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Phone, CreditCard, Calendar, MapPin, Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import eyeRegistrationImg from "../assets/eye-registration.png";
import { Link, useNavigate } from "react-router-dom";

// Move InputField component outside to prevent recreation on each render
const InputField = ({ icon: Icon, placeholder, name, type = "text", showToggle = false, label, value, onChange, errors, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword }) => (
  <div className="mb-4 relative z-10">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
    <div className={`flex items-center border rounded-lg px-3 py-2.5 bg-white ${errors[name] ? 'border-red-500' : 'border-gray-200'} transition-all relative`}>
      <Icon size={18} className="text-gray-400 mr-3 flex-shrink-0" />
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
        className="w-full outline-none text-gray-700 text-sm bg-transparent flex-1"
        onChange={onChange}
        autoComplete="off"
      />
      {showToggle && type === 'password' && (
  <button 
    type="button" 
    onClick={() => setShowPassword(!showPassword)} 
    className="flex-shrink-0 p-0 m-0 bg-transparent border-none outline-none focus:outline-none cursor-pointer"
    style={{ background: 'none', boxShadow: 'none' }}
  >
    {showPassword ? <Eye size={18} className="text-black" /> : <EyeOff size={18} className="text-black" />}
  </button>
)}
     {showToggle && type === 'confirmPassword' && (
  <button 
    type="button" 
    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
    className="flex-shrink-0 p-0 m-0 bg-transparent border-none outline-none focus:outline-none cursor-pointer"
    style={{ background: 'none', boxShadow: 'none' }}
  >
    {showConfirmPassword ? <Eye size={18} className="text-black" /> : <EyeOff size={18} className="text-black" />}
  </button>
)}
    </div>
    {errors[name] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[name]}</p>}
  </div>
);

// Move SelectField component outside to prevent recreation on each render
const SelectField = ({ name, label, options, value, onChange, errors }) => (
  <div className="mb-4 relative z-10">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
    <div className={`border rounded-lg px-3 py-2.5 bg-white ${errors[name] ? 'border-red-500' : 'border-gray-200'} transition-all`}>
      <select
        name={name}
        value={value}
        className="w-full outline-none text-gray-700 text-sm bg-transparent"
        onChange={onChange}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
    {errors[name] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[name]}</p>}
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.fullName.trim()) tempErrors.fullName = "Full name is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Email is invalid";
    if (formData.phoneNumber.length < 10) tempErrors.phoneNumber = "Enter a valid phone number";
    if (!formData.nicNumber) tempErrors.nicNumber = "NIC is required";
    if (!formData.dob) tempErrors.dob = "Date of birth is required";
    if (!formData.address.trim()) tempErrors.address = "Address is required";
    if (!formData.gender) tempErrors.gender = "Gender is required";
    if (formData.password.length < 6) tempErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match";
    if (!agreedToTerms) tempErrors.terms = "You must agree to the terms and conditions";
    
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
      const response = await axios.post('http://localhost:5000/api/users/register', {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        nicNumber: formData.nicNumber,
        dob: formData.dob,
        address: formData.address,
        gender: formData.gender,
        medicalHistory: formData.medicalHistory,
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
        // Server responded with error
        const serverErrors = error.response.data.errors || [];
        const errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          'Registration failed';
        
        // Handle validation errors from server
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
          // Map backend duplicate messages to field-level messages when possible.
          if (/email/i.test(errorMessage)) {
            setErrors((prev) => ({ ...prev, email: errorMessage }));
          } else if (/nic/i.test(errorMessage)) {
            setErrors((prev) => ({ ...prev, nicNumber: errorMessage }));
          }
          alert(errorMessage);
        }
      } else if (error.request) {
        // Request was made but no response received
        alert('Unable to connect to server. Please check if the backend is running.');
      } else {
        // Something else happened
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-50 to-slate-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#4a7c73] to-[#61a396] text-white py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">System Registration</h1>
            <p className="text-base text-blue-100 max-w-2xl">
              Create your account to access our advanced queue management system. Enjoy seamless appointment scheduling and priority eye care services.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white py-6 px-4 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Why Register With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '📅', title: 'Easy Scheduling', desc: 'Book appointments with ease' },
                { icon: '⏱️', title: 'No Waiting', desc: 'Smart queue management system' },
                { icon: '🔒', title: 'Secure Data', desc: 'Your information is protected' }
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{benefit.title}</h3>
                    <p className="text-xs text-gray-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Registration Section */}
        <div className="py-6 px-4 flex-1 min-h-0 flex flex-col">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex-1 flex min-h-0">
            <div className="flex flex-col lg:flex-row w-full min-h-0">
              
              
              {/* Left Side: Form */}
<div className="w-full lg:w-1/2 p-6 md:p-8 overflow-y-auto flex-shrink-0 min-h-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[#61a396] p-2 rounded-full">
                    <User className="text-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#4a7c73]">Create Your Account</h2>
                </div>
                <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                  Fill in all the required information below to create your account and start using our queue management system for seamless eye care services.
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Section 1: Personal Information */}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-[#61a396]" />
                      Personal Information
                    </h3>
                    <InputField 
                      icon={User} 
                      name="fullName" 
                      placeholder="Enter your full name" 
                      label="Full Name *" 
                      value={formData.fullName}
                      onChange={handleChange}
                      errors={errors}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <InputField 
                        icon={Mail} 
                        name="email" 
                        placeholder="your@email.com" 
                        label="Email Address *" 
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                        errors={errors}
                      />
                      <InputField 
                        icon={Phone} 
                        name="phoneNumber" 
                        placeholder="07X XXX XXXX" 
                        label="Phone Number *" 
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        errors={errors}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <InputField 
                        icon={CreditCard} 
                        name="nicNumber" 
                        placeholder="XXXXXXXXXV" 
                        label="NIC Number *" 
                        value={formData.nicNumber}
                        onChange={handleChange}
                        errors={errors}
                      />
                      <InputField 
                        icon={Calendar} 
                        name="dob" 
                        placeholder="DD/MM/YYYY" 
                        label="Date of Birth *" 
                        type="date" 
                        value={formData.dob}
                        onChange={handleChange}
                        errors={errors}
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
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-[#61a396]" />
                      Address Information
                    </h3>
                    <InputField 
                      icon={MapPin} 
                      name="address" 
                      placeholder="123 Main Street, City" 
                      label="Full Address *" 
                      value={formData.address}
                      onChange={handleChange}
                      errors={errors}
                    />
                  </div>

                  {/* Section 3: Medical Information */}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-[#61a396]" />
                      Medical Information
                    </h3>
                    <div className="mb-4 relative z-10">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical History (Optional)</label>
                      <textarea
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        placeholder="Any existing conditions or allergies..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm resize-none bg-white"
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
                      errors={errors}
                    />
                  </div>

                  {/* Section 4: Security */}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-[#61a396]" />
                      Security
                    </h3>
                    <InputField 
                      icon={Lock} 
                      name="password" 
                      placeholder="Enter strong password" 
                      label="Password *" 
                      type="password" 
                      showToggle={true} 
                      value={formData.password}
                      onChange={handleChange}
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
                      errors={errors}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="flex items-start gap-2 cursor-pointer">
                    <input
  type="checkbox"
  checked={agreedToTerms}
  onChange={(e) => setAgreedToTerms(e.target.checked)}
  className="
    mt-1 w-5 h-5 border border-black bg-white rounded-sm 
    appearance-none relative cursor-pointer
    checked:after:content-['✔'] 
    checked:after:absolute checked:after:top-0 checked:after:left-0 
    checked:after:w-full checked:after:h-full
    checked:after:flex checked:after:items-center checked:after:justify-center
    checked:after:text-black checked:after:text-base
  "
/>
<span className="text-xs text-gray-700 mt-1">
    I agree to the <span className="font-bold text-[#61a396]">Terms and Conditions</span> and <span className="font-bold text-[#61a396]">Privacy Policy</span> of Eye Hospital Queue System
  </span>
                    </label>
                    {errors.terms && <p className="text-red-500 text-xs mt-2">{errors.terms}</p>}
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#61a396] hover:bg-[#528c81]'} text-white font-semibold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mb-4`}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-3">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#61a396] font-bold hover:underline">
                    Login Here
                  </Link>
                </p>
              </div>
              
             
{/* Right Side: Image */}
<div className="hidden lg:flex w-1/2 h-full relative bg-gradient-to-b from-blue-100 to-blue-50 flex-shrink-0 min-h-0">
<img 
  src={eyeRegistrationImg} 
  alt="Eye Care Professional" 
  className="w-full h-full object-cover"
/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#4a7c73]/20 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="bg-gray-50 py-6 px-4 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-base">📞 Contact Us</h3>
                <p className="text-gray-600 text-xs">Email: info@eyehospital.com</p>
                <p className="text-gray-600 text-xs">Phone: +94 11 234 5678</p>
                <p className="text-gray-600 text-xs">Hours: 9 AM - 6 PM (Mon-Sat)</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-base">🏥 About Us</h3>
                <p className="text-gray-600 text-xs">We are dedicated to providing excellent eye care services with a modern queue management system to reduce waiting times.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-base">🔐 Security</h3>
                <p className="text-gray-600 text-xs">Your personal and medical information is encrypted and securely stored. We comply with all healthcare privacy regulations.</p>
              </div>
            </div>
            <div className="border-t border-gray-300 mt-6 pt-6 text-center">
              <p className="text-gray-600 text-xs">
                © 2026 Eye Hospital Queue Management System. All rights reserved. | <span className="text-[#61a396] cursor-pointer hover:underline">Privacy Policy</span> | <span className="text-[#61a396] cursor-pointer hover:underline">Terms of Service</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EyeCareRegistration;