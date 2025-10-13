
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Play, Pause, RotateCcw, Sun, Moon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { formatTimeWithAMPM, formatTimer, startThemeBlinking } from "@/lib/utils";

import { useRef } from "react"; // Add this if not already at the top

const alarmSounds = {
  digital: "/sounds/digital.mp3",
  bell: "/sounds/bell.mp3",
  chime: "/sounds/chime.mp3"
};

function App() {
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(true);
  const [time, setTime] = useState(3600);
  const [initialTime, setInitialTime] = useState(3600);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(formatTimeWithAMPM());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [alarmSound, setAlarmSound] = useState("digital");
  const [volume, setVolume] = useState(80);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef(null);

  // Initialize audio context
useEffect(() => {
  const unlockAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(alarmSounds[alarmSound]);
      audio.load();
      audio.volume = volume / 100;
      audioRef.current = audio;
    }

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }

    document.removeEventListener("click", unlockAudio);
  };

  document.addEventListener("click", unlockAudio, { once: true });

  return () => {
    document.removeEventListener("click", unlockAudio);
  };
}, [alarmSound, volume, audioContext]);


  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTimeWithAMPM());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            playAlarm();
            startThemeBlinking(setIsDarkMode, () => setIsBlinking(false));
            setIsBlinking(true);
            return initialTime;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, initialTime]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    setIsDarkMode(savedDarkMode === null ? true : savedDarkMode === "true");
  }, []);

  // Save dark mode preference
  useEffect(() => {
    if (!isBlinking) {
      localStorage.setItem("darkMode", isDarkMode);
    }
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode, isBlinking]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Screen wake lock
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error(`Wake Lock error: ${err.message}`);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(`Error with fullscreen: ${err.message}`);
      toast({
        title: "Fullscreen Error",
        description: "Unable to enter fullscreen mode. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };

  const toggleTheme = () => {
    if (!isBlinking) {
      setIsDarkMode(!isDarkMode);
    }
  };

  const toggleTimer = () => {
    setIsTimerFullscreen(!isTimerFullscreen);
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTime(initialTime);
    setIsRunning(false);
  };

  const addTenMinutes = () => {
    const newTime = time + 600;
    setTime(newTime);
    setInitialTime(newTime);
  };

  const playAlarm = async () => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    try {
      if (!alarmSounds[alarmSound]) {
        throw new Error("Selected alarm sound not found");
      }

      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      await audio.play();

      
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        new Notification("Timer Complete!", {
          body: "Your countdown has finished.",
          icon: "/favicon.ico"
        });
      }
      

    } catch (error) {
      console.error("Error playing alarm:", error);
      toast({
        title: "Sound playback failed",
        description: "Please check your sound permissions and settings.",
        variant: "destructive",
      });
    }

    toast({
      title: "Timer Complete!",
      description: "Your countdown has finished.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="menu-button">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sheet-content">
          <div className="space-y-6">
            <div className="settings-section">
              <h3 className="settings-title">Timer Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => { setTime(3600); setInitialTime(3600); }}>1 Hour</Button>
                <Button onClick={() => { setTime(1800); setInitialTime(1800); }}>30 Min</Button>
                <Button onClick={() => { setTime(900); setInitialTime(900); }}>15 Min</Button>
                <Button onClick={() => { setTime(300); setInitialTime(300); }}>5 Min</Button>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-title">Custom Timer</h3>
              <Input
                type="number"
                placeholder="Enter minutes"
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  const seconds = minutes * 60;
                  setTime(seconds);
                  setInitialTime(seconds);
                }}
              />
            </div>

            <div className="settings-section">
              <h3 className="settings-title">Sound Settings</h3>
              <div className="space-y-4">
                <div className="settings-row">
                  <span className="settings-label">Alarm Sound</span>
                  <Select value={alarmSound} onValueChange={setAlarmSound}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="settings-row">
                  <span className="settings-label">Volume</span>
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => setVolume(value)}
                    max={100}
                    step={1}
                    className="w-32"
                  />
                </div>

                <div className="settings-row">
                  <span className="settings-label">Vibration</span>
                  <Switch
                    checked={vibrationEnabled}
                    onCheckedChange={setVibrationEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="theme-toggle"
      >
        {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="fullscreen-button"
      >
        {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
      </Button>

      <div className="content-container">
        <motion.div
          className="timer-circle cursor-pointer"
          onClick={toggleTimer}
          layout
        >
          {!isTimerFullscreen && (
            <div className="flex flex-col items-center">
              <div className="small-time">{formatTimer(time)}</div>
            </div>
          )}
          {isTimerFullscreen && (
            <div className="flex flex-col items-center">
              <div className="small-time">{currentTime.split(' ')[0]}</div>
              <div className="small-period">{currentTime.split(' ')[1]}</div>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isTimerFullscreen ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="timer-fullscreen"
            >
              <div className="flex flex-col items-center">
                <div className="time-display">{formatTimer(time)}</div>
                <div className="controls">
                  <Button size="lg" onClick={toggleRunning}>
                    {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  <Button size="lg" onClick={resetTimer}>
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                  <Button size="lg" onClick={addTenMinutes}>
                    +10
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="clock"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="timer-fullscreen"
              onClick={toggleTimer}
            >
              <div className="time-display">{currentTime}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
