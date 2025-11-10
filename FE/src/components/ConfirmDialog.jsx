import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

/**
 * Component Dialog xác nhận chung, có thể tái sử dụng
 * @param {object} props
 * @param {boolean} props.open - State để mở/đóng dialog
 * @param {function} props.onClose - Hàm gọi khi đóng (nhấn Hủy, nhấn ra ngoài, Esc)
 * @param {function} props.onConfirm - Hàm gọi khi nhấn "Xác nhận"
 * @param {string} props.title - Tiêu đề của dialog
 * @param {string|React.ReactNode} props.message - Nội dung, mô tả của dialog
 * @param {string} [props.confirmText="Xác nhận"] - Chữ trên nút xác nhận
 * @param {string} [props.cancelText="Hủy bỏ"] - Chữ trên nút hủy
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
}) {
  const handleConfirm = () => {
    onConfirm()
    onClose() // Tự động đóng dialog sau khi xác nhận
  }

  return (
    <Dialog
      open={open}
      onClose={onClose} // Cho phép đóng khi nhấn Esc hoặc click ra ngoài
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}