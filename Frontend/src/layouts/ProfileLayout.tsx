import React from 'react';
import { Outlet } from 'react-router-dom';
import './profileLayout.css';

const ProfileLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="personal-layout-container">
        <div className="personal-layout-header">
            <h1 className="personal-layout-title">Thông tin cá nhân </h1>
        </div>
        <div className="personal-layout-content">
            <div className="personal-layout-main">
                {children ? children : <Outlet />}
            </div>
        </div>
    </div>
);
};

export default ProfileLayout; 