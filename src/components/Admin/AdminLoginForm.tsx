@@ -1,6 +1,7 @@
 import React, { useState } from 'react';
 import { useAuth } from '../../context/AuthContext';
 import { Shield, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
+import { supabase } from '../../lib/supabase';
 
 export const AdminLoginForm: React.FC = () => {
   const { login, signup, resetPassword, state } = useAuth();
@@ -19,10 +20,14 @@ export const AdminLoginForm: React.FC = () => {
 
     try {
       if (isLogin) {
-        await login({ email: formData.email, password: formData.password });
+        const result = await login({ email: formData.email, password: formData.password });
+        // Login success is handled by the auth context
       } else {
         await signup(formData);
         setSuccess('Account created successfully! Please login.');
         setIsLogin(true);
         setFormData({ username: '', email: '', password: '', confirmPassword: '' });
       }
     } catch (error: any) {
       setError(error.message || 'An error occurred');