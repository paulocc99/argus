import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Button from '@mui/material/Button';

function ConfirmationDialog({ open, title, content, btn, onClose, onConfirm }) {
    const defaultTitle = 'Confirm';
    const defaultContent = 'Are you sure you want to proceed with this action?';
    const defaultConfirmBtn = 'Confirm';

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogContent>{content || defaultContent}</DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="primary">
                    {btn || defaultConfirmBtn}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationDialog;
