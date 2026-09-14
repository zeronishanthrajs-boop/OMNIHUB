import React, { useState, useEffect } from 'react';
import {
  PlayerSettings,
  AIDifficultyTier,
  Color
} from '@cinematic-chess/shared-types';
import { GameManager } from './core-bridge/gameManager';
import { StockfishService } from './ai/stockfishService';
import { MainMenu } from './screens/MainMenu';
import { DifficultySelect } from './screens/DifficultySelect';
import { GameScreen } from './screens/GameScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { SettingsModal } from './screens/SettingsModal';
import { HowToPlayModal } from './screens/HowToPlayModal';

const SETTINGS_STORAGE_KEY = 'cinematic_chess_settings_v1';

const DEFAULT_SETTINGS: PlayerSettings = {
  animationLevel: 'Normal',
  soundEnabled: true,
  soundVolume: 0.7,
  boardOrientation: 'white',
  theme: 'default'
};

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'difficulty' | 'game' | 'puzzles'>('menu');
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // GameManager instance
  const [manager] = useState<GameManager>(() => {
    const ai = new StockfishService();
    return new GameManager(
      {
        mode: 'pv-ai',
        aiTier: 'Medium',
        playerColor: 'w',
        animationLevel: settings.animationLevel
      },
      ai
    );
  });

  // Persist settings
  const handleUpdateSettings = (updates: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleStartPvAI = (tier: AIDifficultyTier, playerColor: Color) => {
    manager.updateConfig({
      mode: 'pv-ai',
      aiTier: tier,
      playerColor,
      animationLevel: settings.animationLevel
    });
    manager.startNewGame();
    setCurrentScreen('game');
  };

  const handleStartPvP = () => {
    manager.updateConfig({
      mode: 'pv-p',
      animationLevel: settings.animationLevel
    });
    manager.startNewGame();
    setCurrentScreen('game');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Active Screen */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'menu' && (
          <MainMenu
            onStartPvAI={() => setCurrentScreen('difficulty')}
            onStartPvP={handleStartPvP}
            onStartPuzzles={() => setCurrentScreen('puzzles')}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
          />
        )}

        {currentScreen === 'difficulty' && (
          <DifficultySelect
            onStartMatch={handleStartPvAI}
            onBack={() => setCurrentScreen('menu')}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            manager={manager}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onMainMenu={() => setCurrentScreen('menu')}
          />
        )}

        {currentScreen === 'puzzles' && (
          <PuzzleScreen
            settings={settings}
            onMainMenu={() => setCurrentScreen('menu')}
          />
        )}
      </main>

      {/* Global Modals from Menu */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
};

export default App;
