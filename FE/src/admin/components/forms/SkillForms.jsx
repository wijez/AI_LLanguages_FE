import * as React from 'react';
import { 
  DialogTitle, DialogContent, DialogActions, 
  TextField, Divider, Stack, Chip, IconButton, Button 
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';

// --- 1. QUIZ FORM ---
export function QuizForm({ question: initialData, onSave, onCancel }) {
  const [text, setText] = React.useState(initialData.question_text || '');
  const [choices, setChoices] = React.useState(initialData.choices || []);

  const handleSave = () => {
    onSave({ ...initialData, question_text: text, choices });
  };

  const setCorrect = (id) => {
    setChoices(choices.map((c) => ({ ...c, is_correct: c.id === id })));
  };

  const addChoice = () => {
    setChoices([...choices, { id: `new_${Date.now()}`, text: '', is_correct: choices.length === 0 }]);
  };

  const updateChoiceText = (id, newText) => {
    setChoices(choices.map(c => c.id === id ? { ...c, text: newText } : c));
  };

  const deleteChoice = (id) => {
    setChoices(choices.filter(c => c.id !== id));
  };

  return (
    <>
      <DialogTitle>{String(initialData.id).startsWith('new_') ? 'Thêm câu hỏi Quiz' : 'Sửa câu hỏi Quiz'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
        <TextField label="Nội dung câu hỏi" value={text} onChange={(e) => setText(e.target.value)} multiline rows={3} autoFocus />
        <Divider>Lựa chọn (Choices)</Divider>
        {choices.map((choice, index) => (
          <Stack key={choice.id} direction="row" spacing={1} alignItems="center">
            <TextField label={`Lựa chọn ${index + 1}`} value={choice.text} onChange={(e) => updateChoiceText(choice.id, e.target.value)} fullWidth />
            <Chip 
                label={choice.is_correct ? 'Đáp án đúng' : 'Đặt làm đáp án'} 
                color={choice.is_correct ? 'success' : 'default'} 
                onClick={() => setCorrect(choice.id)} 
            />
            <IconButton color="error" onClick={() => deleteChoice(choice.id)}><Delete /></IconButton>
          </Stack>
        ))}
        <Button size="small" startIcon={<Add />} onClick={addChoice}>Thêm lựa chọn</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">Lưu câu hỏi</Button>
      </DialogActions>
    </>
  );
}

// --- 2. FILLGAP FORM ---
export function FillgapForm({ gap: initialData, onSave, onCancel }) {
  const [text, setText] = React.useState(initialData.text || '');
  const [answer, setAnswer] = React.useState(initialData.answer || '');

  return (
    <>
      <DialogTitle>{String(initialData.id).startsWith('new_') ? 'Thêm Fillgap' : 'Sửa Fillgap'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <TextField 
            label="Câu (dùng {gap} để đánh dấu)" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            helperText="Ví dụ: Hello, my name {gap} John." 
            autoFocus 
        />
        <TextField label="Đáp án" value={answer} onChange={(e) => setAnswer(e.target.value)} helperText="Ví dụ: is" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={() => onSave({ ...initialData, text, answer })} variant="contained">Lưu</Button>
      </DialogActions>
    </>
  );
}

// --- 3. ORDERING FORM ---
export function OrderingForm({ item: initialData, onSave, onCancel }) {
  const [text, setText] = React.useState(initialData.text || '');
  const [order, setOrder] = React.useState(initialData.order_index || 0);

  return (
    <>
      <DialogTitle>Mục sắp xếp</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <TextField label="Nội dung" value={text} onChange={(e) => setText(e.target.value)} fullWidth autoFocus />
        <TextField label="Thứ tự (index)" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={() => onSave({ ...initialData, text, order_index: order })} variant="contained">OK</Button>
      </DialogActions>
    </>
  );
}

// --- 4. MATCHING FORM ---
export function MatchingForm({ pair: initialData = {}, onSave, onCancel }) {
    const [left, setLeft] = React.useState(initialData?.left_text || '');
    const [right, setRight] = React.useState(initialData?.right_text || '');
  
    const handleSave = () => {
      onSave({ 
        ...initialData, 
        left_text: left, 
        right_text: right 
      });
    };
  
    return (
      <>
        <DialogTitle>
          {String(initialData?.id).startsWith('new_') ? 'Thêm cặp ghép nối' : 'Sửa cặp ghép nối'}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField 
            label="Vế trái" 
            value={left} 
            onChange={(e) => setLeft(e.target.value)} 
            autoFocus 
            fullWidth
          />
          <TextField 
            label="Vế phải (đáp án tương ứng)" 
            value={right} 
            onChange={(e) => setRight(e.target.value)} 
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">OK</Button>
        </DialogActions>
      </>
    );
  }

// --- 5. LISTENING FORM ---
export function ListeningForm({ prompt: initialData, onSave, onCancel }) {
  const [audioUrl, setAudioUrl] = React.useState(initialData.audio_url || '');
  const [text, setText] = React.useState(initialData.question_text || '');

  return (
    <>
      <DialogTitle>Dữ liệu âm thanh</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <TextField label="URL file âm thanh (.mp3)" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} autoFocus />
        <TextField label="Câu hỏi / Nội dung hiển thị" value={text} onChange={(e) => setText(e.target.value)} multiline rows={2} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={() => onSave({ ...initialData, audio_url: audioUrl, question_text: text })} variant="contained">Lưu</Button>
      </DialogActions>
    </>
  );
}