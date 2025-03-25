import { useState, useEffect } from 'react';

import {
    Fab,
    TextField,
    Grid,
    Stack,
    Typography,
    MenuItem,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    IconButton,
    Select,
    OutlinedInput,
    Chip,
    Box,
    InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import { getDatasources, getSigmaRepositories, postSigmaRepository, updateSigmaRepository, deleteSigmaRepository } from 'api';
import { setError, setSuccess, capitalizeWord } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import FilterTextField from 'components/FilterTextField';
import { statusList } from 'common/List';
import MainCard from 'components/cards/MainCard';
import { fabStyle } from 'themes/other';
import SigmaRepositoryTable from './SigmaRepositoryTable';
import SigmaRepoDialog from './SigmaRepoDialog';

const repositoryPlaceholder = {
    name: '',
    repository: '',
    mappings: []
};

const SigmaRepositories = () => {
    const [dataSources, setDataSources] = useState([]);
    const [sigmaRepositories, setSigmaRepositories] = useState([]);
    const [selSigmaRepository, setSelSigmaRepository] = useState(repositoryPlaceholder);
    const [statusFilter, setStatusFilter] = useState('none');

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [dOpen, setDOpen] = useState(false);
    const [action, setAction] = useState('edit');

    // Handlers
    const handleClose = () => {
        setDOpen(false);
    };

    const handleViewRepo = (repo) => {
        setSelSigmaRepository(repo);
        setAction('edit');
        setDOpen(true);
    };

    const handleDelRepo = () => {
        removeSigmaRepository(selSigmaRepository.uuid);
        handleClose();
    };

    const handleNewRepo = () => {
        setSelSigmaRepository(repositoryPlaceholder);
        setAction('new');
        setDOpen(true);
    };

    const handleDialogSave = async () => {
        if (action == 'edit') {
            await modifySigmaRepository();
        } else if (action == 'new') {
            await createSigmaRepository();
        }
    };

    const handlePageChange = (e, value) => {
        setPage(value);
    };

    const handleUpdateRepo = (e) => {
        setSelSigmaRepository({ ...selSigmaRepository, [e.target.name]: e.target.value });
    };

    // API
    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            const data = response.data.map((e) => ({ value: e.name, label: capitalizeWord(e.name) }));
            setDataSources(data);
        } catch (error) {
            setError(error);
        }
    };

    const fetchSigmaRepositories = async () => {
        try {
            const response = await getSigmaRepositories(page);
            setSigmaRepositories(response.data);
            //setPages(response.data.pages);
        } catch (error) {
            setError(error);
        }
    };

    const createSigmaRepository = async () => {
        try {
            await postSigmaRepository(selSigmaRepository);
            setSuccess('Sigma repository created');
            fetchSigmaRepositories();
            handleClose();
        } catch (error) {
            setError(error);
        }
    };

    const modifySigmaRepository = async () => {
        try {
            const { count, ...repo } = selSigmaRepository;
            await updateSigmaRepository(selSigmaRepository.uuid, repo);
            setSuccess('Sigma repository updated');
            fetchSigmaRepositories();
            handleClose();
        } catch (error) {
            setError(error);
        }
    };

    const removeSigmaRepository = async (id) => {
        try {
            await deleteSigmaRepository(id);
            setSuccess('Sigma repository deleted');
            fetchSigmaRepositories();
        } catch (error) {
            setError(error, 'Error on repository deletion');
        }
    };

    // Hooks
    useEffect(() => {
        fetchDataSources();
    }, []);
    useEffect(() => {
        fetchSigmaRepositories();
    }, [, page]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={10} uhd={8}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">Sigma Repositories</Typography>
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            <FilterTextField
                                id="sigma-repo-status"
                                size="small"
                                label="Status"
                                select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {statusList.map((option) => (
                                    <MenuItem key={`stat-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <SigmaRepositoryTable
                            repos={sigmaRepositories}
                            page={page}
                            pagesNumber={pages}
                            refresh={() => fetchSigmaRepositories()}
                            pChange={handlePageChange}
                            show={handleViewRepo}
                            del={removeSigmaRepository}
                        />
                    </MainCard>
                </Grid>
            </Grid>
            <SigmaRepoDialog
                open={dOpen}
                repository={selSigmaRepository}
                close={handleClose}
                action={action}
                save={handleDialogSave}
                update={handleUpdateRepo}
                del={handleDelRepo}
            />
            <Fab onClick={handleNewRepo} color="primary" sx={fabStyle}>
                <AddIcon />
            </Fab>
        </ComponentSkeleton>
    );
};

export default SigmaRepositories;
