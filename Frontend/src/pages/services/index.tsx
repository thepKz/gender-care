import React from 'react';
import PublicServicesPage from './PublicServicesPage';

// Re-export the new PublicServicesPage component
const ServicesPage: React.FC = () => {
  return <PublicServicesPage />;
};

export default ServicesPage;

export { default as PublicServicesPage } from './PublicServicesPage';
export { default as PublicServicePackagesPage } from './PublicServicePackagesPage';