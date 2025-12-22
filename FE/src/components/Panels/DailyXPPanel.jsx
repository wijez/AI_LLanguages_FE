import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";

export default function DailyXPPanel() {
  const [dailyXP, setDailyXP] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyXP = async () => {
      try {
        const res = await axios.get("/daily-xp/today/");
        setDailyXP(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyXP();
  }, []);

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Today's XP</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : dailyXP ? (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Star className="text-yellow-500" size={20} />
          <span>{dailyXP.points} XP earned today</span>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No XP earned today</p>
      )}
    </div>
  );
}
