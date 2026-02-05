import { createContext, useContext, useState, useEffect } from 'react';

const VehicleFilterContext = createContext(null);

export const VehicleFilterProvider = ({ children }) => {
  // null = "All Vehicles", vehicle object = specific vehicle selected
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedVehicle');
    if (saved) {
      try {
        setSelectedVehicle(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('selectedVehicle');
      }
    }
  }, []);

  // Save to localStorage when changed
  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle) {
      localStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
    } else {
      localStorage.removeItem('selectedVehicle');
    }
  };

  const clearFilter = () => {
    setSelectedVehicle(null);
    localStorage.removeItem('selectedVehicle');
  };

  return (
    <VehicleFilterContext.Provider value={{ 
      selectedVehicle, 
      selectVehicle, 
      clearFilter,
      isFiltered: selectedVehicle !== null 
    }}>
      {children}
    </VehicleFilterContext.Provider>
  );
};

export const useVehicleFilter = () => {
  const context = useContext(VehicleFilterContext);
  if (!context) {
    throw new Error('useVehicleFilter must be used within VehicleFilterProvider');
  }
  return context;
};
