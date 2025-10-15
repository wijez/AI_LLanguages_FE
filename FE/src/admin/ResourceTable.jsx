import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { api } from '../api/client';
import {
  Box, Paper, Stack, Button, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Snackbar, Alert
} from '@mui/material';

/**
 * props:
 *  - title: string
 *  - resource: string (vd: '/languages/' -> phải đúng DRF router)
 *  - columns: MUI DataGrid columns
 *  - form: [{name,label,type}] -> build form tự động
 */
export default function ResourceTable({ title, resource, columns, form }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [toast, setToast] = React.useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(resource);
    setRows(data.results || data);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [resource]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      if (editing) {
        await api.put(`${resource}${editing.id}/`, payload);
        setToast('Updated successfully');
      } else {
        await api.post(resource, payload);
        setToast('Created successfully');
      }
      setOpen(false); setEditing(null); load();
    } catch (err) {
      setToast(err?.response?.data ? JSON.stringify(err.response.data) : 'Error');
    }
  };

  const onDelete = async (id) => {
    await api.delete(`${resource}${id}/`);
    setToast('Deleted'); load();
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={1.5}>
        <Box component="h2" m={0} fontSize={20} fontWeight={800}>{title}</Box>
        <Button variant="contained" onClick={() => setOpen(true)}>Add</Button>
      </Stack>

      <div style={{ height: 520, width: '100%' }}>
        <DataGrid
          density="compact"
          rows={rows}
          columns={[
            ...columns,
            {
              field: '__actions', headerName: 'Actions', width: 140,
              renderCell: (p) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => { setEditing(p.row); setOpen(true); }}>Edit</Button>
                  <Button size="small" color="error" onClick={() => onDelete(p.row.id)}>Delete</Button>
                </Stack>
              )
            }
          ]}
          loading={loading}
          getRowId={(r) => r.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </div>

      <Dialog open={open} onClose={() => { setOpen(false); setEditing(null); }} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit' : 'Create'}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            {form.map(f => (
              <TextField
                key={f.name}
                name={f.name}
                label={f.label}
                type={f.type || 'text'}
                defaultValue={editing ? editing[f.name] ?? '' : ''}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')}>
        <Alert severity="info" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Paper>
  );
}
