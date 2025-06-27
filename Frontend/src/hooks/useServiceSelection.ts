import { useState, useEffect } from 'react';
import { getServices } from '../api/endpoints/serviceApi';
import { useApiState } from './useApiState';

interface ServiceItem {
  _id: string;
  serviceName: string;
  description?: string;
}

export const useServiceSelection = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const { loading, execute } = useApiState({
    errorMessage: 'Không thể tải danh sách dịch vụ'
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const result = await execute(
      () => getServices({ limit: 1000 }),
      (response) => {
        const mappedServices: ServiceItem[] = response.data.services.map(service => ({
          _id: service._id,
          serviceName: service.serviceName,
          description: service.description
        }));
        setServices(mappedServices);
      }
    );
  };

  const selectService = (serviceId: string) => {
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service || null);
  };

  const clearSelection = () => {
    setSelectedService(null);
  };

  return {
    services,
    selectedService,
    loading,
    selectService,
    clearSelection,
    reloadServices: loadServices
  };
}; 