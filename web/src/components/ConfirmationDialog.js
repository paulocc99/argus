import { Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import Button from '@mui/material/Button';

function ConfirmationDialog({ open, title, content, btn, color, onClose, onConfirm }) {
    const defaultTitle = 'Confirm';
    const defaultContent = 'Are you sure you want to proceed with this action?';
    const defaultConfirmBtn = 'Confirm';
    const defaultColorBtn = 'primary';

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogContent>{content || defaultContent}</DialogContent>
            <Divider />
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color={color || defaultColorBtn}>
                    {btn || defaultConfirmBtn}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationDialog;
