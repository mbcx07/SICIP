import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './screens/LoginScreen';
import MisTramitesScreen from './screens/MisTramitesScreen';
import DashboardScreen from './screens/DashboardScreen';
import NuevoTramiteScreen from './screens/NuevoTramiteScreen';
import TramitesScreen from './screens/TramitesScreen';
import TramiteDetalleScreen from './screens/TramiteDetalleScreen';
import AdminScreen from './screens/AdminScreen';
import BandejaScreen from './screens/BandejaScreen';
import RecepcionesScreen from './screens/RecepcionesScreen';
import ReportesScreen from './screens/ReportesScreen';
import PlantillaScreen from './screens/PlantillaScreen';
import AltaTrabajadorScreen from './screens/AltaTrabajadorScreen';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardScreen />} />
          <Route path="mis-tramites" element={<MisTramitesScreen />} />
            <Route path="nuevo-tramite" element={<NuevoTramiteScreen />} />
            <Route path="tramites" element={<TramitesScreen />} />
            <Route path="tramites/:id" element={<TramiteDetalleScreen />} />
            <Route path="bandeja" element={<BandejaScreen />} />
            <Route path="recepciones" element={<RecepcionesScreen />} />
            <Route path="reportes" element={<ReportesScreen />} />
            <Route path="plantilla" element={<PlantillaScreen />} />
            <Route path="alta-trabajador" element={<AltaTrabajadorScreen />} />
            <Route path="admin/*" element={<AdminScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
