import * as React from 'react';
import { Box, Grid, Paper, Typography, IconButton, Stack } from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Card = ({ bg, title, value, icon }) => (
  <Paper sx={{
    p: 2.5, borderRadius: 3, color: '#fff', background: bg,
    position: 'relative', overflow: 'hidden', minHeight: 120
  }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ opacity: .9 }}>{icon}</Box>
      <IconButton size="small" sx={{ color: '#fff8' }}><MoreHoriz/></IconButton>
    </Stack>
    <Typography variant="h4" fontWeight={800} mt={1}>{value}</Typography>
    <Typography variant="body2" sx={{ opacity:.9 }}>{title}</Typography>
  </Paper>
);

const chartData = [...Array(12)].map((_, i) => ({ name: `T${i+1}`, val: Math.round(Math.random()*400)+50 }));

export default function Dashboard() {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5} lg={4}>
          <Card bg="linear-gradient(135deg,#6a11cb 0%,#3910a1 100%)" title="Total Earning" value="$500.00" icon={<SettingsRounded/>}/>
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <Card bg="linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)" title="Total Order" value="$108" icon={<SettingsRounded/>}/>
        </Grid>
        <Grid item xs={12} md={3} lg={4}>
          <Card bg="linear-gradient(135deg,#1d4ed8 0%,#0b3ea8 100%)" title="Total Income" value="$203k" icon={<SettingsRounded/>}/>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 2, p: 2.5, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={800}>Total Growth</Typography>
        </Stack>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="val" strokeWidth={3}/>
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
