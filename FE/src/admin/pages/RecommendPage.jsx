import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Stack, Card, CardContent, 
  Grid, Chip, Divider, List, ListItem, ListItemText,
  Tabs, Tab, Paper, CircularProgress, TextField 
} from '@mui/material';
import { 
  ModelTraining, History, Feedback, Psychology, 
  Assessment, PlayCircleFilled, ShowChart 
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import aiApi from '../../api/aiApi';

export default function RecommendPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  
  const [enrollmentId, setEnrollmentId] = useState('');
  // State quản lý snapshot_id dùng cho cả Train và Predict
  const [snapshotId, setSnapshotId] = useState('');

  const fetchOverview = async () => {
    try {
      const runRes = await aiApi.TrainingRuns.list({ limit: 1 });
      const runs = runRes.results || runRes;
      if (runs.length > 0) {
        setLatestRun(runs[0]);
        // Tự động gợi ý Snapshot ID gần nhất vào ô nhập liệu
        if (!snapshotId) setSnapshotId(runs[0].dataset_snapshot || '');
      }
    } catch (err) { console.error("Lỗi fetch overview:", err); }
  };

  const fetchListData = async (index) => {
    setLoading(true);
    try {
      let res;
      switch (index) {
        case 0: res = await aiApi.Recommendations.list({ limit: 10, ordering: '-created_at' }); break;
        case 1: res = await aiApi.TrainingRuns.list({ limit: 10 }); break;
        case 2: res = await aiApi.AIModels.list({ limit: 10 }); break;
        case 3: res = await aiApi.Feedbacks.list({ limit: 10 }); break;
        default: break;
      }
      setData(res?.results || res || []);
    } catch (err) { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOverview();
    fetchListData(tabIndex);
  }, [tabIndex]);

  // STEP 1: TRAIN MODEL - Sửa lỗi: "snapshot_id required"
  const handleTrain = async () => {
    // Nếu người dùng không nhập, tự tạo một ID mới theo timestamp
    const targetSnap = snapshotId || `manual_snap_${Math.floor(Date.now() / 1000)}`;
    
    toast((t) => (
      <span>
        Xác nhận Huấn luyện với Snapshot: <b>{targetSnap}</b>?
        <Stack direction="row" spacing={1} mt={1}>
          <Button variant="contained" size="small" onClick={async () => {
            toast.dismiss(t.id);
            setLoading(true);
            const trainToast = toast.loading("Đang khởi tạo quy trình...");
            try {
              // GỬI PAYLOAD CÓ snapshot_id
              await aiApi.train({ 
                snapshot_id: targetSnap,
                params: { max_depth: 5, learning_rate: 0.1 } 
              });
              toast.success("Đã gửi lệnh Train thành công!", { id: trainToast });
              setTabIndex(1);
            } catch (err) { 
              toast.error("Lỗi: " + (err.response?.data?.detail || err.message), { id: trainToast }); 
            }
            finally { setLoading(false); }
          }}>Xác nhận</Button>
          <Button size="small" onClick={() => toast.dismiss(t.id)}>Hủy</Button>
        </Stack>
      </span>
    ), { duration: 5000 });
  };

  // STEP 2: BATCH PREDICT - Sửa lỗi: "Provide snapshot_id or features_uri"
  const handlePredict = async () => {
    if (!snapshotId) return toast.error("Vui lòng nhập Snapshot ID (VD: snap_1767296700)");
    
    const predictToast = toast.loading(`Đang dự đoán dựa trên snapshot ${snapshotId}...`);
    try {
      // GỬI PAYLOAD CÓ snapshot_id để BE tự tìm features.parquet trong folder tương ứng
      const res = await aiApi.post('/predict', { 
        snapshot_id: snapshotId 
      });
      toast.success(`Dự đoán thành công ${res.data?.predictions?.length || 0} bản ghi.`, { id: predictToast });
    } catch (err) { 
      toast.error("Lỗi: " + (err.response?.data?.detail || err.message), { id: predictToast }); 
    }
  };

  // STEP 3: GENERATE RECS
  const handleGenerateRecs = async () => {
    if (!enrollmentId) return toast.error("Vui lòng nhập Enrollment ID");
    const genToast = toast.loading(`Đang tạo gợi ý cho ID #${enrollmentId}...`);
    try {
      await aiApi.Recommendations.generate({ enrollment_id: parseInt(enrollmentId), language: "en" });
      toast.success("Đã tạo gợi ý thành công!", { id: genToast });
      if (tabIndex === 0) fetchListData(0); else setTabIndex(0);
    } catch (err) { toast.error("Lỗi: " + err.message, { id: genToast }); }
  };

  return (
    <Box p={4}>
      <Grid container spacing={2} alignItems="center" mb={4}>
        <Grid item xs={12} lg={4}>
          <Typography variant="h4" fontWeight={800}>AI Intelligence Hub</Typography>
          <Typography color="textSecondary">Quy trình: Train ({snapshotId || '...'}) → Predict → Generate</Typography>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <TextField size="small" label="Enrollment ID" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} sx={{ width: 140, bgcolor: '#fff' }} />
            <Button variant="outlined" color="success" startIcon={<PlayCircleFilled />} onClick={handleGenerateRecs}>Generate</Button>
            
            <TextField size="small" label="Snapshot ID" value={snapshotId} onChange={(e) => setSnapshotId(e.target.value)} sx={{ width: 180, bgcolor: '#fff' }} placeholder="snap_1767296700" />
            <Button variant="outlined" color="warning" startIcon={<ShowChart />} onClick={handlePredict}>Predict</Button>

            <Button variant="contained" startIcon={<ModelTraining />} onClick={handleTrain} disabled={loading}>Train Model</Button>
          </Stack>
        </Grid>
      </Grid>

      {/* DASHBOARD CARDS */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}>
            <CardContent>
              <Typography variant="caption" fontWeight={700} color="primary">LATEST PERFORMANCE (AUC)</Typography>
              <Stack direction="row" justifyContent="space-between" mt={1}>
                <Typography variant="h4" fontWeight={800}>
                  {latestRun?.metrics?.val_auc ? (latestRun.metrics.val_auc * 100).toFixed(2) + '%' : 'N/A'}
                </Typography>
                <Chip label={latestRun?.status || 'Offline'} color="success" size="small" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}>
            <CardContent>
              <Typography variant="caption" fontWeight={700} color="secondary">CURRENT ARTIFACT</Typography>
              <Typography variant="h6" fontWeight={700} mt={1} noWrap>
                {latestRun?.metrics?.artifact_uri?.split('/').pop() || 'No model version'}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer' }} onClick={() => setSnapshotId(latestRun?.dataset_snapshot)}>
                Snapshot: <b>{latestRun?.dataset_snapshot || '--'}</b> (Click to use)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS VIEW */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="fullWidth">
          <Tab icon={<Psychology />} label="Recommendations" iconPosition="start" />
          <Tab icon={<History />} label="Training History" iconPosition="start" />
          <Tab icon={<Assessment />} label="AI Models" iconPosition="start" />
          <Tab icon={<Feedback />} label="Feedbacks" iconPosition="start" />
        </Tabs>

        <Box sx={{ minHeight: 400, position: 'relative' }}>
          {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>}
          {!loading && (
            <List>
              {data.map((item) => (
                <ListItem key={item.id} divider sx={{ px: 3, py: 2 }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          {tabIndex === 0 && `User ID: ${item.user_id}`}
                          {tabIndex === 1 && `Run #${item.id} - ${item.status}`}
                          {tabIndex === 2 && `${item.name} v${item.version}`}
                          {tabIndex === 3 && `Feedback ID: ${item.id}`}
                        </Typography>
                        {tabIndex === 0 && <Chip label={item.rec_type} size="small" variant="outlined" />}
                        {tabIndex === 1 && item.dataset_snapshot && (
                          <Chip 
                            label="Use Snapshot" 
                            size="small" 
                            onClick={() => { setSnapshotId(item.dataset_snapshot); toast.success("Đã chọn snapshot: " + item.dataset_snapshot); }} 
                            sx={{ ml: 2, cursor: 'pointer' }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box mt={0.5}>
                        {tabIndex === 0 && `Score: ${item.priority_score?.toFixed(4)} | Reason: ${item.reasons?.[0] || 'N/A'}`}
                        {tabIndex === 1 && `AUC: ${item.metrics?.val_auc || 'N/A'} | Snapshot: ${item.dataset_snapshot}`}
                        {tabIndex === 3 && `Outcome: ${item.outcome} | Rec ID: ${item.recommendation}`}
                      </Box>
                    }
                  />
                  <Box textAlign="right">
                    <Typography variant="caption" color="textSecondary">
                      {new Date(item.created_at || item.started_at || item.trained_at).toLocaleString()}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  );
}