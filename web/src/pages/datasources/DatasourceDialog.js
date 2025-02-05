import {
    Grid,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    FormControl,
    TextField,
    FormControlLabel,
    Stack,
    Checkbox
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

import { capitalizeWord } from 'utils';
import { HTypography } from 'common/Typography';

export default function DatasourceDialog(props) {
    const { datasource, open, close, save, del, action, updateDs } = props;

    // Handlers
    const handleUpdate = (e) => {
        updateDs(e.target.name, e.target.value);
    };

    const handleDelete = () => {
        del(datasource.name);
    };

    const updateIndice = (index, value) => {
        const ds = { ...datasource };
        ds.indices[index] = value;
        updateDs('indices', ds.indices);
    };

    const removeIndice = (index) => {
        updateDs(
            'indices',
            datasource.indices.filter((e, i, arr) => i !== index)
        );
    };

    const addIndice = () => {
        updateDs('indices', datasource.indices.concat(''));
    };

    return (
        <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
            <DialogContent sx={{ minHeight: '300px' }}>
                <Grid item xs={12}>
                    <Typography variant="h5">{capitalizeWord(action)} Datasource</Typography>
                </Grid>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                disabled={action == 'edit'}
                                id="ds-name"
                                name="name"
                                value={datasource.name}
                                label="Name"
                                size="small"
                                onChange={handleUpdate}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                id="ds-module"
                                name="module"
                                value={datasource?.module}
                                label="Event Module"
                                size="small"
                                onChange={handleUpdate}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Indices
                    </Typography>
                    <Grid container direction="row" justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                        {datasource.indices.map((indice, index, indices) => (
                            <Grid key={indice} container sx={{ mt: 1 }}>
                                <Grid item xs={10}>
                                    <FormControl fullWidth>
                                        <TextField
                                            key={indice}
                                            error={indice.length == 0}
                                            defaultValue=""
                                            value={indice}
                                            label="Indice"
                                            size="small"
                                            placeholder="filebeat-*"
                                            onChange={(e) => updateIndice(index, e.target.value)}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={2} sx={{ pl: 3 }}>
                                    <IconButton onClick={() => removeIndice(index)}>
                                        <RemoveCircleIcon fontSize="small" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <IconButton aria-label="add" color="success" onClick={addIndice}>
                            <AddCircleIcon />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                    <Stack>
                        <HTypography variant="h5">Options</HTypography>
                        <FormControlLabel
                            control={
                                <Checkbox name="lock" checked={datasource.lock} onChange={(e) => updateDs('lock', e.target.checked)} />
                            }
                            label="Lock Indices"
                        />
                    </Stack>
                </Grid>
            </DialogContent>
            <DialogActions>
                {action == 'edit' && <Button onClick={handleDelete}>Delete</Button>}
                <Button onClick={save}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}
