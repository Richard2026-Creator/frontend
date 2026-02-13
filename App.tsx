
import React, { useState, useEffect, useCallback } from 'react';
import { View, LibraryImage, StudioSettings, SessionResult } from './types';
import { getImages, getSettings, getSessions, saveSession } from './services/storage';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { SettingsView } from './views/Settings';
import { Discovery } from './views/Discovery';
import { Summary } from './views/Summary';
import { AnalyticsView } from './views/Analytics';

const App: React.FC = () => {
  const [currentView, setView] = useState<View>('HOME');
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(getSettings());
  const [lastSession, setLastSession] = useState<SessionResult | null>(null);
  const [clientName, setClientName] = useState<string>('');

  const refreshLibrary = useCallback(async () => {
    const images = await getImages();
    setLibrary(images);
  }, []);

  const refreshSettings = useCallback(() => {
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    refreshLibrary();
    refreshSettings();
  }, [refreshLibrary, refreshSettings]);

  // Initial redirect to settings if empty
  useEffect(() => {
    if (library.length === 0 && currentView === 'HOME') {
        const isFirstLaunch = localStorage.getItem('aa_first_launch') === null;
        if (isFirstLaunch) {
            setView('SETTINGS');
            localStorage.setItem('aa_first_launch', 'false');
        }
    }
  }, [library, currentView]);

  const handleSessionComplete = (result: SessionResult) => {
    saveSession(result);
    setLastSession(result);
    setView('SUMMARY');
  };

  const renderView = () => {
    switch (currentView) {
      case 'HOME':
        return <Home 
                 library={library} 
                 minRequired={settings.minRequiredImages} 
                 setView={setView}
                 clientName={clientName}
                 setClientName={setClientName}
               />;
      case 'SETTINGS':
        return <SettingsView 
                 settings={settings} 
                 library={library} 
                 onLibraryChange={refreshLibrary} 
                 onSettingsChange={refreshSettings}
                 setView={setView}
               />;
      case 'DISCOVERY':
        return <Discovery 
                 library={library} 
                 settings={settings}
                 clientName={clientName}
                 onComplete={handleSessionComplete} 
                 onCancel={() => setView('HOME')}
               />;
      case 'SUMMARY':
        return lastSession ? (
          <Summary 
            session={lastSession} 
            library={library} 
            studioLogo={settings.logo} 
            setView={setView} 
          />
        ) : (
          <Home 
            library={library} 
            minRequired={settings.minRequiredImages} 
            setView={setView} 
            clientName={clientName} 
            setClientName={setClientName} 
          />
        );
      case 'ANALYTICS':
        return <AnalyticsView sessions={getSessions()} library={library} categories={settings.categories} settings={settings} />;
      default:
        return <Home 
                 library={library} 
                 minRequired={settings.minRequiredImages} 
                 setView={setView} 
                 clientName={clientName} 
                 setClientName={setClientName} 
               />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView} logo={settings.logo}>
      {renderView()}
    </Layout>
  );
};

export default App;
