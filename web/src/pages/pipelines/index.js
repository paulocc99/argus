import { useState, useEffect } from 'react';

import { Fab, TextField, Grid, Typography, Dialog, DialogContent, DialogActions, Button, FormControl } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

import { deleteIngestPipeline, getIngestPipelines, postIngestPipelines, uploadIngestPipeline } from 'api';
import { setSuccess, setError, capitalizeWord } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import MainCard from 'components/cards/MainCard';
import IngestPipelineTable from './IngestPipelineTable';
import { codeEditorStyle, fabStyle } from 'themes/other';

const pipelinePlaceHolder = {
    id: '',
    description: '',
    processors: [],
    on_failure: []
};

const defaultErrorPipeline = [
    {
        set: {
            field: 'error.message',
            value: '{{ _ingest.on_failure_message }}'
        }
    }
];

const IngestPipelines = () => {
    const [pipelineList, setPipelines] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(pipelinePlaceHolder);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [dOpen, setDOpen] = useState(false);

    const [action, setAction] = useState('edit');
    const [processorsData, setProcessorsData] = useState('');
    const [failedProcessorsData, setFailedProcessorsData] = useState('');

    // Handlers
    const handleViewPipeline = (pipeline) => {
        setSelectedPipeline(pipeline);
        setProcessorsData(JSON.stringify(pipeline.processors, null, 4));
        setFailedProcessorsData(JSON.stringify(pipeline.on_failure, null, 4));
        setAction('edit');
        setDOpen(true);
    };

    const handleDOpen = (action) => {
        setSelectedPipeline(pipelinePlaceHolder);
        setProcessorsData([]);
        setFailedProcessorsData(JSON.stringify(defaultErrorPipeline, null, 4));
        setAction(action);
        setDOpen(true);
    };

    const handleClose = () => {
        setDOpen(false);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const updateSelectedAlert = (alert) => {
        setSelectedPipeline(alert);
    };

    const updateCurrentPipeline = (attr, value) => {
        const sel = { ...selectedPipeline };
        sel[attr] = value;
        setSelectedPipeline(sel);
    };

    const updatePipeline = () => {
        const currentPipeline = { ...selectedPipeline };
        currentPipeline.processors = JSON.parse(processorsData);
        currentPipeline.on_failure = JSON.parse(failedProcessorsData);
        updateIngestPipeline(currentPipeline);
    };

    // API
    const fetchIngestPipelines = async () => {
        try {
            const response = await getIngestPipelines(page);
            setPipelines(response.data.pipelines.reverse());
            setPages(response.data.pages);
        } catch (error) {
            setError(error, "Couldn't retrieve ingest pipelines");
        }
    };

    const updateIngestPipeline = async (newPipeline) => {
        try {
            await postIngestPipelines(newPipeline);
            setSuccess(`Pipeline ${action == 'edit' ? 'updated' : 'created'}`);
            setDOpen(false);
            fetchIngestPipelines();
        } catch (error) {
            setError(error, 'Error on pipeline update');
        }
    };

    const sendIngestPipeline = async (e) => {
        try {
            const formData = new FormData();
            formData.append('pipeline', e.target.files[0]);
            const response = await uploadIngestPipeline(formData);

            const pipeline = response.data;
            updateCurrentPipeline('description', pipeline.description);
            setProcessorsData(JSON.stringify(pipeline.processors, null, 4));
            setFailedProcessorsData(JSON.stringify(pipeline.on_failure, null, 4));
            setSuccess('Pipeline uploaded');
        } catch (error) {
            setError(error, 'Error on pipeline upload');
        }
    };

    const removeIngestPipeline = async (id) => {
        try {
            await deleteIngestPipeline(id);
            fetchIngestPipelines();
            setSuccess('Pipeline deleted');
        } catch (error) {
            setError(error, 'Error on pipeline deletion');
        }
    };

    // Hooks
    useEffect(() => {
        fetchIngestPipelines();
    }, [, page]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={10} uhd={8}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">Ingest Pipelines</Typography>
                        </Grid>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <IngestPipelineTable
                            pipelines={pipelineList}
                            select={updateSelectedAlert}
                            page={page}
                            pagesNumber={pages}
                            hChange={handlePageChange}
                            updateState={updateIngestPipeline}
                            show={handleViewPipeline}
                            del={removeIngestPipeline}
                        />
                    </MainCard>
                </Grid>
            </Grid>

            <Dialog open={dOpen} onClose={handleClose}>
                <DialogContent sx={{ minWidth: '750px' }}>
                    <Grid item xs={12}>
                        <Typography variant="h5">{capitalizeWord(action)} Pipeline</Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <TextField
                                defaultValue=""
                                value={selectedPipeline?.id}
                                disabled={action == 'edit'}
                                label="Name"
                                size="small"
                                onChange={(e) => updateCurrentPipeline('id', e.target.value)}
                            />
                        </FormControl>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <TextField
                                defaultValue=""
                                value={selectedPipeline?.description}
                                label="Description"
                                size="small"
                                onChange={(e) => updateCurrentPipeline('description', e.target.value)}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Processors
                        </Typography>
                        <div></div>
                        <Editor
                            value={processorsData}
                            onValueChange={(data) => setProcessorsData(data)}
                            highlight={(code) => highlight(code, languages.js)}
                            padding={10}
                            style={codeEditorStyle}
                        />
                        <Typography variant="h5" sx={{ fontSize: '1rem', mt: 2 }}>
                            On Failure
                        </Typography>
                        <Editor
                            value={failedProcessorsData}
                            onValueChange={(data) => setFailedProcessorsData(data)}
                            highlight={(code) => highlight(code, languages.js)}
                            padding={10}
                            style={codeEditorStyle}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    {action == 'new' && (
                        <Button component="label" startIcon={<UploadIcon />}>
                            Upload
                            <input hidden type="file" onChange={sendIngestPipeline} />
                        </Button>
                    )}
                    <Button onClick={updatePipeline}>Save</Button>
                </DialogActions>
            </Dialog>
            <Fab onClick={() => handleDOpen('new')} color="primary" sx={fabStyle}>
                <AddIcon />
            </Fab>
        </ComponentSkeleton>
    );
};

export default IngestPipelines;
