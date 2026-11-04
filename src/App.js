import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import IntakeQueuePage from './pages/IntakeQueuePage';
import RegisterPatientPage from './pages/RegisterPatientPage';
import PanelPage from './pages/PanelPage';
import ReferralsPage from './pages/ReferralsPage';
import ContentPage from './pages/ContentPage';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<IntakeQueuePage />} />
            <Route path="/intake-queue" element={<IntakeQueuePage />} />
            <Route path="/register-patient" element={<RegisterPatientPage />} />
            <Route path="/patients" element={<RegisterPatientPage />} />
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/content" element={<ContentPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
