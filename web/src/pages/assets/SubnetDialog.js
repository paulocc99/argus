import { Typography, Dialog, DialogContent, DialogActions, FormControl, TextField, Button, Grid, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export default function SubnetDialog(props) {
    const { open, handleClose, subnets, hSubnetValue, add, remove, update } = props;

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogContent sx={{ minWidth: '400px', maxWidth: '400px', minHeight: '300px' }}>
                <Grid item xs={12}>
                    <Typography variant="h5">Subnets To Monitor</Typography>
                </Grid>
                <Grid container justifyContent="center" alignItems="center" sx={{ mt: 2 }} spacing={1}>
                    <Grid item xs={12}>
                        {subnets.length > 0 ? (
                            subnets.map((sub, index) => (
                                <Grid container sx={{ mt: 1 }}>
                                    <Grid item xs={10}>
                                        <FormControl fullWidth>
                                            <TextField
                                                defaultValue=""
                                                value={sub}
                                                label="Subnet"
                                                size="small"
                                                placeholder="10.1.1.0/24"
                                                onChange={(event) => hSubnetValue(index, event.target.value)}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <IconButton onClick={() => remove(index)}>
                                            <RemoveCircleIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))
                        ) : (
                            <Typography variant="h6">There are currently no subnets being monitored.</Typography>
                        )}
                    </Grid>
                    <IconButton aria-label="add" color="success" onClick={add} sx={{ mt: 2 }}>
                        <AddCircleIcon />
                    </IconButton>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={update}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}
