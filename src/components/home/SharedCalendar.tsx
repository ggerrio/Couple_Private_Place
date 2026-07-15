/**
 * SharedCalendar.tsx — A shared couple's calendar
 * Both partners can add events, view each other's events, and see a monthly grid.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Heart } from "lucide-react";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { Skeleton } from "../extras/Skeleton";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdBy: "user_a" | "user_b";
  createdAt: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function SharedCalendar() {
  const { currentUser, userA, userB } = useCouple();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(today.toISOString().split("T")[0]);
  const [newDescription, setNewDescription] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  // Sync events from Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { query: q, collection, orderBy: ob, onSnapshot } = await import("firebase/firestore");
      const queryRef = q(collection(db, "calendar_events"), ob("date", "asc"));
      unsub = onSnapshot(queryRef, (snap) => {
        setEvents(snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "",
          date: d.data().date || "",
          description: d.data().description || "",
          createdBy: d.data().createdBy || "user_a",
          createdAt: d.data().createdAt || "",
        })));
        setLoading(false);
      }, (err) => {
        console.error("[calendar events listener]", err);
        toast.error("Failed to sync calendar events.");
        setLoading(false);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const addEvent = useCallback(async () => {
    if (!newTitle.trim() || !newDate) return;
    try {
      const db = await getDb();
      const { collection, addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "calendar_events"), {
        title: newTitle.trim(),
        date: newDate,
        description: newDescription.trim(),
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
      });
      setNewTitle("");
      setNewDescription("");
      setShowAddForm(false);
    } catch (e) {
      console.error("[addEvent]", e);
      toast.error("Failed to add event");
    }
  }, [newTitle, newDate, newDescription, currentUser]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "calendar_events", id));
    } catch (e) {
      console.error("[deleteEvent]", e);
    }
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const monthDays = getMonthDays(currentYear, currentMonth);
  const selectedDate = selectedDay ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;
  const dayEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];
  const partnerName = currentUser === "user_a" ? userB.name.split(" ")[0] : userA.name.split(" ")[0];

  if (loading) {
    return (
      <div id="shared-calendar" role="status" aria-label="Loading calendar">
        <div className="bg-[var(--fabric-cream)]/40 border border-[var(--wood-oak)]/15 rounded-3xl p-5 md:p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Skeleton width={24} height={24} rounded="8px" />
              <Skeleton height={20} width={140} rounded="6px" />
            </div>
            <Skeleton width={100} height={32} rounded="12px" />
          </div>

          {/* Month navigator skeleton */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={28} height={28} rounded="8px" />
            <Skeleton height={18} width={160} rounded="6px" />
            <Skeleton width={28} height={28} rounded="8px" />
          </div>

          {/* Day headers skeleton */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} height={16} width="100%" rounded="4px" />
            ))}
          </div>

          {/* Calendar grid skeleton — approx 5 rows of 7 cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={40} rounded="12px" />
            ))}
          </div>

          {/* Selected day events skeleton */}
          <div className="mt-4 space-y-2">
            <Skeleton height={16} width={180} rounded="6px" />
            <div className="flex items-start gap-2.5 bg-white/50 border border-[var(--border-color)] rounded-xl p-3">
              <Skeleton width={28} height={28} rounded="50%" />
              <div className="flex-1 space-y-1.5">
                <Skeleton height={14} width="60%" rounded="6px" />
                <Skeleton height={10} width="40%" rounded="4px" />
                <Skeleton height={8} width="30%" rounded="4px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="shared-calendar">
      <div className="bg-[var(--fabric-cream)]/40 border border-[var(--wood-oak)]/15 rounded-3xl p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-base font-bold text-[var(--text-main)] font-serif">Shared Calendar</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddForm ? "Cancel" : "Add Event"}
          </button>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-white/50 border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full text-xs px-3 py-2 bg-white/70 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 bg-white/70 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]"
                  />
                  <button
                    onClick={addEvent}
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 bg-white/70 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <span className="text-sm font-bold text-[var(--text-main)] font-serif">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEventsList = events.filter((e) => e.date === dateStr);
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : isToday
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                    : "hover:bg-black/5 text-[var(--text-main)]"
                }`}
              >
                <span>{day}</span>
                {dayEventsList.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEventsList.slice(0, 3).map((_, i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Events */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 space-y-2"
            >
              <h4 className="text-xs font-bold text-[var(--text-main)]">
                Events for {MONTHS[currentMonth]} {selectedDay}, {currentYear}
              </h4>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No events on this day.</p>
              ) : (
                dayEvents.map((ev) => {
                  const isMine = ev.createdBy === currentUser;
                  return (
                    <div key={ev.id} className="flex items-start gap-2.5 bg-white/50 border border-[var(--border-color)] rounded-xl p-3">
                      <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                        <Heart className={`w-3.5 h-3.5 ${isMine ? "text-[var(--primary)]" : "text-pink-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--text-main)]">{ev.title}</p>
                        {ev.description && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{ev.description}</p>
                        )}
                        <p className="text-[8px] text-[var(--text-muted)] font-mono mt-0.5">
                          Added by {isMine ? "you" : partnerName}
                        </p>
                      </div>
                      {isMine && (
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
