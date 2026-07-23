/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useCouple } from "../../context/CoupleContext";
import GreetingNotification from "./GreetingNotification";
import ForecastNotification, { ForecastItem, HourlyItem } from "./ForecastNotification";

function mapWwoToWmo(wwoCode: string): number {
  const n = parseInt(wwoCode);
  if (n === 113) return 0;
  if (n <= 119) return 2;
  if (n <= 143) return 45;
  if (n <= 176) return 80;
  if (n <= 260) return 61;
  if (n <= 350) return 71;
  return 95;
}

export default function WeatherNotificationController() {
  const { currentUser, userA, userB } = useCouple();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherData, setWeatherData] = useState<{
    city: string;
    temp: number;
    code: number;
    daily: ForecastItem[];
    hourly: HourlyItem[];
  } | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"greeting" | "forecast">("greeting");
  const [isMobile, setIsMobile] = useState(false);
  const hasShownInitialRef = useRef(false);

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const fallbackCity = activeProfile.weatherCity || "Seoul";

  // Check screen width for mobile optimization
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 640);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 1. Get GPS navigator.geolocation
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("[GPS error for notification]", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // 2. Fetch from wttr.in and update every 15 minutes
  useEffect(() => {
    const query = coords ? `${coords.lat},${coords.lon}` : fallbackCity;
    const ac = new AbortController();

    const fetchForecast = async () => {
      try {
        const url = `https://wttr.in/${encodeURIComponent(query)}?format=j1`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) return;

        const json = await res.json();
        const current = json.current_condition?.[0];
        if (!current) return;

        const areaName = json.nearest_area?.[0]?.areaName?.[0]?.value || fallbackCity;

        // Map daily forecast
        const rawWeather = json.weather || [];
        const daily: ForecastItem[] = rawWeather.map((w: any) => ({
          date: w.date,
          tempMax: parseFloat(w.maxtempC || "0"),
          tempMin: parseFloat(w.mintempC || "0"),
          weatherCode: mapWwoToWmo(w.hourly?.[4]?.weatherCode || "113"), // midday code as general representation
        }));

        // Map hourly forecast for the current day
        const rawHourly = rawWeather[0]?.hourly || [];
        const hourly: HourlyItem[] = rawHourly.map((h: any) => ({
          time: h.time,
          temp: parseFloat(h.tempC || "0"),
          weatherCode: mapWwoToWmo(h.weatherCode || "113"),
        }));

        setWeatherData({
          city: areaName,
          temp: parseInt(current.temp_C || "0"),
          code: mapWwoToWmo(current.weatherCode || "113"),
          daily,
          hourly,
        });
        // Only show notification on first successful fetch (page refresh / login)
        // Subsequent 15-min polling updates weather silently
        if (!hasShownInitialRef.current) {
          hasShownInitialRef.current = true;
          setShowGreeting(true);
          setShowForecast(true);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        console.error("[wttr.in error for notification]", err);
      }
    };

    fetchForecast();

    // 15-minute polling interval
    const interval = setInterval(fetchForecast, 15 * 60 * 1000);

    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, [coords, fallbackCity]);

  if (!weatherData) return null;

  const handleCloseAll = () => {
    setShowGreeting(false);
    setShowForecast(false);
  };

  // On Mobile: render a single unified/tabbed notification card at top of viewport
  if (isMobile) {
    const isGreetingVisible = (showGreeting || showForecast) && activeMobileTab === "greeting";
    const isForecastVisible = (showGreeting || showForecast) && activeMobileTab === "forecast";

    return (
      <>
        {isGreetingVisible && (
          <GreetingNotification 
            weatherCode={weatherData.code} 
            city={weatherData.city} 
            temp={weatherData.temp} 
            isVisible={true}
            onClose={handleCloseAll}
            hasForecast={showForecast}
            onSwitchToForecast={() => setActiveMobileTab("forecast")}
          />
        )}
        {isForecastVisible && (
          <ForecastNotification 
            dailyForecast={weatherData.daily} 
            hourlyForecast={weatherData.hourly} 
            isVisible={true} 
            onClose={handleCloseAll}
            hasGreeting={showGreeting}
            onSwitchToGreeting={() => setActiveMobileTab("greeting")}
          />
        )}
      </>
    );
  }

  // On Desktop: render both independently at bottom-left and bottom-right
  return (
    <>
      <GreetingNotification 
        weatherCode={weatherData.code} 
        city={weatherData.city} 
        temp={weatherData.temp} 
        isVisible={showGreeting}
        onClose={() => setShowGreeting(false)}
      />
      <ForecastNotification 
        dailyForecast={weatherData.daily} 
        hourlyForecast={weatherData.hourly} 
        isVisible={showForecast} 
        onClose={() => setShowForecast(false)}
      />
    </>
  );
}
