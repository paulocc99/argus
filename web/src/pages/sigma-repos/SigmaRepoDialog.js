import { useEffect, useState } from 'react';
import {
    InputLabel,
    Divider,
    Grid,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    FormControl,
    TextField,
    Select,
    OutlinedInput,
    MenuItem,
    Box,
    Chip
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import { getDatasources } from 'api';
import { capitalizeWord } from 'utils';

export default function SigmaRepoDialog(props) {
    const { open, close, action, repository, save, update, del } = props;

    const updateMappings = (mappings) => {
        const event = new Event('mappings');
        Object.defineProperty(event, 'target', { writable: false, name: 'mappings', value: mappings });
        update(event);
    };

    const setMapping = (e, index) => {
        const { mappings } = repository;
        mappings[index][e.target.name] = e.target.value;
        updateMappings(mappings);
    };

    const addDatasource = () => {
        const { mappings } = repository;
        mappings.push({ datasources: [], path: '' });
        updateMappings(mappings);
    };

    // TODO - Add mapping row deletion button on dialog

    const [dataSources, setDataSources] = useState([]);

    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            const data = response.data.map((e) => ({ value: e.name, label: e.name }));
            setDataSources(data);
        } catch (error) {}
    };

    useEffect(() => {
        fetchDataSources();
    }, []);

    return (
        <Dialog open={open} onClose={close} maxWidth="sm">
            <DialogContent sx={{ minWidth: '600px', minHeight: '300px' }}>
                <Grid item xs={12}>
                    <Typography variant="h5">{capitalizeWord(action)} Repository</Typography>
                </Grid>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField id="repo-name" name="name" value={repository?.name} label="Name" size="small" onChange={update} />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                id="repo-path"
                                name="repository"
                                value={repository?.repository}
                                label="Repository"
                                size="small"
                                onChange={update}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Data Sources
                    </Typography>
                    <Grid container spacing={1} direction="row" justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                        {repository?.mappings?.map((m, index) => (
                            <>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="mapping-name-label" sx={{ overflow: 'visible' }}>
                                            Datasources
                                        </InputLabel>
                                        <Select
                                            id="datasource"
                                            labelId="mapping-name-label"
                                            name="datasources"
                                            size="small"
                                            placeholder="Datasources"
                                            multiple
                                            value={m.datasources}
                                            onChange={(e) => setMapping(e, index)}
                                            input={<OutlinedInput id="select-multiple" label="Datasource" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip size="small" key={value} label={value} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {dataSources.map((ds) => (
                                                <MenuItem key={ds.value} value={ds.value}>
                                                    {ds.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <TextField
                                            id="mapping-path"
                                            name="path"
                                            value={m.path}
                                            label="Path"
                                            size="small"
                                            onChange={(e) => setMapping(e, index)}
                                        />
                                    </FormControl>
                                </Grid>
                            </>
                        ))}
                        <IconButton color="success" sx={{ mt: 1 }} onClick={addDatasource}>
                            <AddCircleIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions style={{ justifyContent: 'space-between' }}>
                {action == 'edit' ? (
                    <Button color="error" onClick={del}>
                        Delete
                    </Button>
                ) : (
                    <br />
                )}
                <Button variant="contained" onClick={save}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
