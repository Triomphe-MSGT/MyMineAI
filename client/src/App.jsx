import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { ProfileSelectPage } from './pages/ProfileSelectPage.jsx';
import { MeetingPage } from './pages/MeetingPage.jsx';
import { DemoVideoPage } from './pages/DemoVideoPage.jsx';
import { SplashScreen } from './components/shared/SplashScreen.jsx';

export function App() {
  return (
    <>
      <SplashScreen />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select" element={<ProfileSelectPage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/demo-video" element={<DemoVideoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

