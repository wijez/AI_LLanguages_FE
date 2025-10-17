// src/admin/ResourceTable.jsx
import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { api } from '../api/api';
import {
  Box, Paper, Stack, Button, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Snackbar, Alert, MenuItem, Switch, FormControlLabel,
  IconButton
} from '@mui/material';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

/**
 * props:
 *  - title: string
 *  - resource: string (vd: '/languages/' -> đúng DRF router)
 *  - columns: MUI DataGrid columns
 *  - form: [{name,label,type,required,helperText,options,multiline,rows}] -> build form tự động
 *  - onViewRow?: (row) => void  // hiện nút View nếu truyền
 *  - rowIdKey?: string          // mặc định 'id'
 *  - transformPayload?: (payload, {editing}) => payload  // tiền xử lý trước khi gửi
 */
export default function ResourceTable({
  title,
  resource,
  columns,
  form,
  onViewRow,
  rowIdKey = 'id',
  transformPayload
}) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [toast, setToast] = React.useState({ msg: '', type: 'info' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get(resource, { params: {} }, { ttl: 0 }); // luôn lấy mới
      const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setRows(items);
      setToast({ msg: '', type: 'info' });
    } catch (err) {
      setToast({
        msg: err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Load failed'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, [resource]);

  const coerceValue = (val, fieldDef) => {
    if (val === '' || val == null) return fieldDef?.type === 'number' ? null : '';
    switch (fieldDef?.type) {
      case 'number':   return Number(val);
      case 'boolean':  return val === true || val === 'true' || val === 'on';
      default:         return val;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let payload = {};
    // gom giá trị từ form theo đúng type
    form.forEach(f => {
      if (f.type === 'boolean') {
        payload[f.name] = coerceValue(fd.get(f.name), f);
      } else {
        payload[f.name] = coerceValue(fd.get(f.name), f);
      }
    });

    if (typeof transformPayload === 'function') {
      payload = transformPayload(payload, { editing });
    }

    try {
      if (editing) {
        await api.put(`${resource}${editing[rowIdKey]}/`, payload);
        setToast({ msg: 'Updated successfully', type: 'success' });
      } else {
        await api.post(resource, payload);
        setToast({ msg: 'Created successfully', type: 'success' });
      }
      setOpen(false); setEditing(null); load();
    } catch (err) {
      setToast({
        msg: err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Error'),
        type: 'error'
      });
    }
  };

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this item?');
    if (!ok) return;
    try {
      await api.delete(`${resource}${id}/`);
      setToast({ msg: 'Deleted', type: 'success' });
      load();
    } catch (err) {
      setToast({
        msg: err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Delete failed'),
        type: 'error'
      });
    }
  };

  const renderField = (f) => {
    // boolean -> Switch
    if (f.type === 'boolean') {
      const checked = !!(editing ? editing[f.name] : false);
      return (
        <FormControlLabel
          key={f.name}
          control={<Switch name={f.name} defaultChecked={checked} />}
          label={f.label}
        />
      );
    }

    // select
    if (f.type === 'select') {
      return (
        <TextField
          key={f.name}
          name={f.name}
          label={f.label}
          select
          required={!!f.required}
          helperText={f.helperText}
          defaultValue={
            editing ? (editing[f.name] ?? f.options?.[0]?.value ?? '') : (f.options?.[0]?.value ?? '')
          }
        >
          {f.options?.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    // text/number/multiline
    return (
      <TextField
        key={f.name}
        name={f.name}
        label={f.label}
        type={f.type === 'number' ? 'number' : (f.type || 'text')}
        required={!!f.required}
        helperText={f.helperText}
        defaultValue={editing ? (editing[f.name] ?? '') : ''}
        multiline={!!f.multiline}
        rows={f.rows || (f.multiline ? 3 : undefined)}
      />
    );
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={1.5} alignItems="center">
        <Box component="h2" m={0} fontSize={20} fontWeight={800}>{title}</Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={load} title="Refresh" disabled={loading}>
            <RefreshRounded />
          </IconButton>
          <Button variant="contained" onClick={() => setOpen(true)}>Add</Button>
        </Stack>
      </Stack>

      <div style={{ height: 520, width: '100%' }}>
        <DataGrid
          density="compact"
          rows={rows}
          columns={[
            ...columns,
            {
              field: '__actions',
              headerName: 'Actions',
              width: onViewRow ? 260 : 200,
              sortable: false,
              filterable: false,
              renderCell: (p) => (
                <Stack direction="row" spacing={1}>
                  {onViewRow && (
                    <Button size="small" color="primary" onClick={() => onViewRow(p.row)}>View</Button>
                  )}
                  <Button size="small" onClick={() => { setEditing(p.row); setOpen(true); }}>Edit</Button>
                  <Button size="small" color="error" onClick={() => onDelete(p.row[rowIdKey])}>Delete</Button>
                </Stack>
              )
            }
          ]}
          loading={loading}
          getRowId={(r) => r[rowIdKey]}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </div>

      <Dialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? 'Edit' : 'Create'}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            {form.map(renderField)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={!!toast.msg}
        autoHideDuration={3000}
        onClose={() => setToast({ msg: '', type: 'info' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.type} onClose={() => setToast({ msg: '', type: 'info' })}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
