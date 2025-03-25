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
    Checkbox,
    Divider
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

import { capitalizeWord } from 'utils';
import { HTypography } from 'common/Typography';

export default function DatasourceDialog(props) {
    const { datasource, open, close, save, del, action, update } = props;

    // Handlers
    const handleUpdate = (e) => {
        update(e.target.name, e.target.value);
    };

    const handleDelete = () => {
        del(datasource.name);
    };

    const updateIndice = (e, index) => {
        const { indices } = { ...datasource };
        indices[index] = e.target.value;
        update('indices', indices);
    };

    const removeIndice = (index) => {
        update(
            'indices',
            datasource.indices.filter((e, i, arr) => i !== index)
        );
    };

    const addIndice = () => {
        update('indices', datasource.indices.concat(''));
    };

    const isBaseline = datasource?.name.toLowerCase() == 'baseline';

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
                                id="ds-name"
                                name="name"
                                value={datasource.name}
                                label="Name"
                                size="small"
                                disabled={action == 'edit' || isBaseline}
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
                                disabled={isBaseline}
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
                        {datasource?.indices?.map((indice, index) => (
                            <Grid container key={`indice-${index}`} sx={{ mt: 1 }}>
                                <Grid item xs={10}>
                                    <FormControl fullWidth>
                                        <TextField
                                            id="indice"
                                            error={indice.length == 0}
                                            value={indice}
                                            label="Indice"
                                            size="small"
                                            placeholder="filebeat-*"
                                            onChange={(e) => updateIndice(e, index)}
                                        />
                                    </FormControl>
                                </Grid>
                                {!isBaseline && (
                                    <Grid item xs={2} sx={{ pl: 3 }}>
                                        <IconButton onClick={() => removeIndice(index)}>
                                            <RemoveCircleIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                )}
                            </Grid>
                        ))}
                        {!isBaseline && (
                            <IconButton aria-label="add" color="success" onClick={addIndice}>
                                <AddCircleIcon />
                            </IconButton>
                        )}
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                    <Stack>
                        <HTypography variant="h5">Options</HTypography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    disabled={isBaseline}
                                    name="lock"
                                    checked={datasource.lock}
                                    onChange={(e) => update('lock', e.target.checked)}
                                />
                            }
                            label="Lock Indices"
                        />
                    </Stack>
                </Grid>
            </DialogContent>
            {!isBaseline && (
                <>
                    <Divider />
                    <DialogActions style={{ justifyContent: 'space-between' }}>
                        {action == 'edit' ? (
                            <Button color="error" onClick={handleDelete}>
                                Delete
                            </Button>
                        ) : (
                            <br />
                        )}
                        <Button variant="contained" onClick={save}>
                            Save
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
