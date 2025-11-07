import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, FormControlLabel, Switch
} from "@mui/material";

/**
 * props:
 * - open: boolean
 * - title?: string
 * - loading?: boolean
 * - initialValues: Record<string, any>
 * - fields: Array<{
 *     name: string;
 *     label: string;
 *     type: "text"|"textarea"|"number"|"select"|"switch";
 *     options?: Array<string|{label:string,value:any}>;
 *     required?: boolean;
 *     rows?: number;           // textarea
 *     min?: number; max?: number; step?: number; // number
 *     nullIfEmpty?: boolean;   // convert "" -> null khi submit
 *   }>
 * - onClose: () => void
 * - onSubmit: (payload: Record<string, any>) => Promise<void>|void
 */
export default function UniversalEditor({
  open,
  title = "Chỉnh sửa",
  loading = false,
  initialValues,
  fields,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = React.useState(initialValues || {});
  const prevInit = React.useRef(initialValues || {});

  React.useEffect(() => {
    setValues(initialValues || {});
    prevInit.current = initialValues || {};
  }, [initialValues, open]);

  const handleChange = (name, type) => (e) => {
    let v = type === "switch" ? e.target.checked : e.target.value;
    if (type === "number") {
      // cho phép rỗng -> '' (sẽ xử lý khi submit); nếu có số thì convert Number
      v = v === "" ? "" : Number(v);
    }
    setValues((s) => ({ ...s, [name]: v }));
  };

  const toOptions = (opts = []) =>
    opts.map((o) => (typeof o === "string" ? { label: o, value: o } : o));

  const computePatch = () => {
    const patch = {};
    for (const f of fields) {
      const name = f.name;
      const before = prevInit.current?.[name];
      let after = values?.[name];

      // chuẩn hoá string
      if (typeof after === "string") after = after.trim();

      // nullIfEmpty cho text/textarea
      if (f.nullIfEmpty && (after === "" || after === undefined)) after = null;

      // number: '' -> null
      if (f.type === "number" && after === "") after = null;

      // chỉ gửi key thay đổi
      const changed =
        (typeof before === "number" || typeof after === "number")
          ? String(before) !== String(after)
          : JSON.stringify(before) !== JSON.stringify(after);

      if (changed) patch[name] = after;
    }
    return patch;
  };

  const submit = async () => {
    const payload = computePatch();
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {fields.map((f) => {
            const val = values?.[f.name] ?? (f.type === "switch" ? false : "");
            switch (f.type) {
              case "text":
                return (
                  <TextField
                    key={f.name}
                    label={f.label}
                    value={val}
                    onChange={handleChange(f.name, "text")}
                    required={f.required}
                    fullWidth
                  />
                );
              case "textarea":
                return (
                  <TextField
                    key={f.name}
                    label={f.label}
                    value={val}
                    onChange={handleChange(f.name, "textarea")}
                    required={f.required}
                    fullWidth
                    multiline
                    minRows={f.rows || 3}
                  />
                );
              case "number":
                return (
                  <TextField
                    key={f.name}
                    type="number"
                    label={f.label}
                    value={val}
                    onChange={handleChange(f.name, "number")}
                    required={f.required}
                    fullWidth
                    inputProps={{
                      min: f.min, max: f.max, step: f.step ?? 1
                    }}
                  />
                );
              case "select":
                return (
                  <FormControl key={f.name} fullWidth>
                    <InputLabel>{f.label}</InputLabel>
                    <Select
                      label={f.label}
                      value={val}
                      onChange={handleChange(f.name, "select")}
                      required={f.required}
                    >
                      {toOptions(f.options).map((opt) => (
                        <MenuItem key={String(opt.value)} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              case "switch":
                return (
                  <FormControlLabel
                    key={f.name}
                    control={
                      <Switch
                        checked={!!val}
                        onChange={handleChange(f.name, "switch")}
                      />
                    }
                    label={f.label}
                  />
                );
              default:
                return null;
            }
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={submit} disabled={loading} variant="contained">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
