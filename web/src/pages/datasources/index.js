import { useState, useEffect } from 'react';

import { Fab, Grid, Stack, Typography, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

import { getDatasources, deleteDatasource, postDatasource, updateDatasource, postDatasourceScan } from 'api';
import { setError, setSuccess } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import MainCard from 'components/cards/MainCard';
import { fabStyle } from 'themes/other';
import DatasourceTable from './DatasourceTable';
import DatasourceDialog from './DatasourceDialog';

const datasourcePlaceholder = {
    name: '',
    indices: []
};

const Datasources = () => {
    const [dataSources, setDataSources] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [selDatasource, setSelDatasource] = useState(datasourcePlaceholder);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [dOpen, setDOpen] = useState(false);
    const [action, setAction] = useState('edit');

    // Handlers
    const handleClose = () => {
        setDOpen(false);
    };

    const handlePageChange = (e, value) => {
        setPage(value);
    };

    const handleViewDS = (ds) => {
        setSelDatasource(ds);
        setAction('edit');
        setDOpen(true);
    };

    const handleNewDS = () => {
        setSelDatasource(datasourcePlaceholder);
        setAction('new');
        setDOpen(true);
    };

    const handleDelDS = (name) => {
        removeDatasource(name);
        handleClose();
    };

    const handleUpdateDS = (attr, value) => {
        setSelDatasource({ ...selDatasource, [attr]: value });
    };

    const handleDialogSave = async () => {
        if (action == 'edit') {
            await modifyDatasource();
        } else if (action == 'new') {
            await createDatasource();
        }
    };

    // API
    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            setDataSources(response.data);
        } catch (error) {
            setError(error);
        }
    };

    const createDatasource = async () => {
        try {
            await postDatasource(selDatasource);
            setSuccess('Datasource created');
            fetchDataSources();
            handleClose();
        } catch (error) {
            setError(error);
        }
    };

    const modifyDatasource = async () => {
        try {
            await updateDatasource(selDatasource.name, selDatasource);
            setSuccess('Datasource updated');
            fetchDataSources();
            handleClose();
        } catch (error) {
            setError(error);
        }
    };

    const removeDatasource = async (name) => {
        try {
            await deleteDatasource(name);
            setSuccess('Datasource deleted');
            fetchDataSources();
        } catch (error) {
            setError(error);
        }
    };

    const scanDatasources = async () => {
        try {
            setProcessing(true);
            const { data } = await postDatasourceScan();
            setSuccess(data.message);
            fetchDataSources();
        } catch (error) {
            setError(error);
        }
        setProcessing(false);
    };

    // Hooks
    useEffect(() => {
        fetchDataSources();
    }, [, page]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">Datasources</Typography>
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            {processing && <CircularProgress size={24} />}
                            <Button size="small" variant="contained" startIcon={<ManageSearchIcon />} onClick={scanDatasources}>
                                Datasource Scan
                            </Button>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <DatasourceTable
                            datasources={dataSources}
                            page={page}
                            pagesNumber={pages}
                            pChange={handlePageChange}
                            show={handleViewDS}
                            del={handleDelDS}
                        />
                    </MainCard>
                </Grid>
            </Grid>
            <DatasourceDialog
                datasource={selDatasource}
                open={dOpen}
                close={handleClose}
                action={action}
                update={handleUpdateDS}
                save={handleDialogSave}
                del={handleDelDS}
            />
            <Fab onClick={handleNewDS} color="primary" sx={fabStyle}>
                <AddIcon />
            </Fab>
        </ComponentSkeleton>
    );
};

export default Datasources;
