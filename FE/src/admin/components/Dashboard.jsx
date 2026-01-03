import * as React from "react";
import { Box, Grid, Paper, Typography, IconButton, Stack } from "@mui/material";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import LanguageRounded from "@mui/icons-material/LanguageRounded";
import TopicRounded from "@mui/icons-material/CategoryRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import ExtensionRounded from "@mui/icons-material/ExtensionRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";
import OnlinePredictionRounded from "@mui/icons-material/OnlinePredictionRounded";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { api } from "../../api/api";

// Card dùng chung
const StatCard = ({ bg, title, value, icon, helper }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: 3,
      color: "#fff",
      background: bg,
      position: "relative",
      overflow: "hidden",
      minHeight: 120,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ opacity: 0.9 }}>{icon}</Box>
      <IconButton size="small" sx={{ color: "#fff8" }}>
        <MoreHoriz />
      </IconButton>
    </Stack>
    <Typography variant="h4" fontWeight={800} mt={1}>
      {Number(value || 0).toLocaleString("en-US")}
    </Typography>
    <Typography variant="body2" sx={{ opacity: 0.9 }}>
      {title}
    </Typography>
    {helper && (
      <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
        {helper}
      </Typography>
    )}
  </Paper>
);

// Ngưỡng tính "online": 5 phút gần nhất
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function countFromResponse(res) {
  if (!res) return 0;
  if (typeof res.count === "number") return res.count;
  if (Array.isArray(res?.results)) return res.results.length;
  if (Array.isArray(res)) return res.length;
  return 0;
}

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    users: 0,
    onlineUsers: 0,
    languages: 0,
    topics: 0,
    lessons: 0,
    skills: 0,
    roleplays: 0,
    words: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setErr("");

      try {
        // Users: lấy nhiều hơn 1 để tính online
        const usersPromise = api.Users.list(
          { page_size: 200, ordering: "-last_active" },
          { ttl: 10_000 }
        );

        // Các resource khác: chỉ cần count
        const [
          usersRes,
          languagesRes,
          topicsRes,
          lessonsRes,
          skillsRes,
          roleplaysRes,
          wordsRes,
        ] = await Promise.all([
          usersPromise,
          api.Languages.list({ page_size: 1 }, { ttl: 10_000 }),
          api.Topics.list({ page_size: 1 }, { ttl: 10_000 }),
          api.Lessons.list({ page_size: 1 }, { ttl: 10_000 }),
          api.Skills.list({ page_size: 1 }, { ttl: 10_000 }),
          api.RoleplayScenarios.list({ page_size: 1 }, { ttl: 10_000 }),
          api.Words.list({ page_size: 1 }, { ttl: 10_000 }),
        ]);

        // Tổng users
        const totalUsers = countFromResponse(usersRes);

        // Tính onlineUsers từ trường last_active trong results
        let onlineUsers = 0;
        if (Array.isArray(usersRes?.results)) {
          const now = Date.now();
          onlineUsers = usersRes.results.filter((u) => {
            if (!u.last_active) return false;
            const t = new Date(u.last_active).getTime();
            if (!Number.isFinite(t)) return false;
            return now - t <= ONLINE_WINDOW_MS;
          }).length;
        }

        if (!cancelled) {
          setStats({
            users: totalUsers,
            onlineUsers,
            languages: countFromResponse(languagesRes),
            topics: countFromResponse(topicsRes),
            lessons: countFromResponse(lessonsRes),
            skills: countFromResponse(skillsRes),
            roleplays: countFromResponse(roleplaysRes),
            words: countFromResponse(wordsRes),
          });
        }
      } catch (e) {
        console.error("Failed to load dashboard stats:", e);
        if (!cancelled) {
          setErr(e?.message || "Failed to load dashboard stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // Dữ liệu cho chart: dùng các thống kê hiện có
  const chartData = React.useMemo(
    () => [
      { name: "Users", val: stats.users },
      // { name: "Online", val: stats.onlineUsers },
      { name: "Languages", val: stats.languages },
      { name: "Topics", val: stats.topics },
      { name: "Lessons", val: stats.lessons },
      { name: "Skills", val: stats.skills },
      { name: "Roleplays", val: stats.roleplays },
      { name: "Wordbank", val: stats.words },
    ],
    [stats]
  );

  return (
    <Box>
      {/* Hàng card thống kê */}
      <Grid container spacing={2}>
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#6a11cb 0%,#3910a1 100%)"
            title="Total Users"
            value={stats.users}
            icon={<PeopleAltRounded />}
            helper={loading ? "Loading..." : "Tổng số tài khoản"}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#22c55e 0%,#15803d 100%)"
            title="Users Online"
            value={stats.onlineUsers}
            icon={<OnlinePredictionRounded />}
            helper="Hoạt động trong 5 phút gần nhất"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)"
            title="Languages"
            value={stats.languages}
            icon={<LanguageRounded />}
            helper="Số ngôn ngữ được hỗ trợ"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#f97316 0%,#c2410c 100%)"
            title="Topics"
            value={stats.topics}
            icon={<TopicRounded />}
            helper="Chủ đề học tập"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#1d4ed8 0%,#0b3ea8 100%)"
            title="Lessons"
            value={stats.lessons}
            icon={<MenuBookRounded />}
            helper="Bài học trong hệ thống"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#a855f7 0%,#7e22ce 100%)"
            title="Skills"
            value={stats.skills}
            icon={<ExtensionRounded />}
            helper="Kỹ năng luyện tập"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#ec4899 0%,#be185d 100%)"
            title="Roleplay Scenarios"
            value={stats.roleplays}
            icon={<ChatRounded />}
            helper="Kịch bản hội thoại"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <StatCard
            bg="linear-gradient(135deg,#16a34a 0%,#14532d 100%)"
            title="Wordbank"
            value={stats.words}
            icon={<SettingsRounded />}
            helper="Tổng số từ vựng"
          />
        </Grid>
      </Grid>

      {/* Khối biểu đồ */}
      <Paper sx={{ mt: 2, p: 2.5, borderRadius: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography fontWeight={800}>Total Growth</Typography>
          {loading && (
            <Typography variant="caption" color="text.secondary">
              Đang tải thống kê...
            </Typography>
          )}
          {err && (
            <Typography variant="caption" color="error.main">
              {err}
            </Typography>
          )}
        </Stack>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="val" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
