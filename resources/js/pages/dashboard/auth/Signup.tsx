import React from 'react'
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import DashboardSignup from '@/components/section/dashboard/auth/DashboardSignup';

export default function Signup() {
  return (
    <Dashboard authPage>
        <DashboardSignup />
    </Dashboard>
  )
}
