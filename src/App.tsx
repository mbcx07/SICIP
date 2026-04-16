import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './screens/LoginScreen';
import PrimerAccesoScreen from './screens/PrimerAccesoScreen';
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
import ImportarPlantillaScreen from './screens/ImportarPlantillaScreen';
import CuadrosScreen from './screens/CuadrosScreen';
import CrearPlazaScreen from './screens/CrearPlazaScreen';
import CuadroDetalleScreen from './screens/CuadroDetalleScreen';
import ExplorarPlazasScreen from './screens/ExplorarPlazasScreen';
import MisPostulacionesScreen from './screens/MisPostulacionesScreen';
import NotificacionesScreen from './screens/NotificacionesScreen';
import AprobacionScreen from './screens/AprobacionScreen';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/primer-acceso" element={<PrimerAccesoScreen />} />
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
            <Route path="importar-plantilla" element={<ImportarPlantillaScreen />} />
            <Route path="admin/*" element={<AdminScreen />} />
            <Route path="cuadros" element={<CuadrosScreen />} />
            <Route path="crear-plaza" element={<CrearPlazaScreen />} />
            <Route path="cuadro/:plazaId" element={<CuadroDetalleScreen />} />
            <Route path="explorar-plazas" element={<ExplorarPlazasScreen />} />
            <Route path="mis-postulaciones" element={<MisPostulacionesScreen />} />
            <Route path="notificaciones" element={<NotificacionesScreen />} />
            <Route path="aprobacion" element={<AprobacionScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
