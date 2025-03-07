import { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
    Box,
    Stack,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    FormControl,
    TextField,
    Select,
    InputLabel,
    Grid,
    Link,
    Divider,
    MenuItem,
    Button,
    Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

import { getAlertEvents, postFieldProfiler, postLookupRule } from 'api';
import { datetimeToStr, capitalizeWord, capitalizeWords, setError, setSuccess } from 'utils';
import { codeEditorStyle } from 'themes/other';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { profillerTsList } from 'common/List';
import { HTypography } from 'common/Typography';
import EventTable from 'components/EventTable';
import ProfilerChart from 'components/ProfilerChart';
import { updateAlertStatus } from 'api';

const getNextState = (state) => {
    return state == 'open' ? 'processing' : state == 'processing' ? 'resolved' : '';
};

function BaselineAlertDialog(props) {
    const { alert } = props;

    return (
        <>
            <Grid item>
                <Typography variant="h5">Baseline Analytic</Typography>
            </Grid>
            <Stack spacing={2} alignItems="right" sx={{ mr: 1, mb: 1 }}>
                <Grid item xs={12} sx={{ mt: 2 }}>
                    <HTypography variant="h5">Name</HTypography>
                    <HTypography variant="body1">
                        <Link component={RouterLink} to={`/baseline?analytic=${alert.analytic?.code}`}>
                            {alert.analytic?.name}
                        </Link>
                    </HTypography>
                </Grid>
                <Grid sx={{ mt: 2, mb: 1 }}>
                    <HTypography variant="h5">Description</HTypography>
                    <HTypography variant="body1">{alert.analytic?.description}</HTypography>
                </Grid>
            </Stack>
            <Divider />
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                    <HTypography variant="h5">Type</HTypography>
                    <HTypography variant="body1">{capitalizeWord(alert.type)}</HTypography>
                </Grid>
                <Grid item xs={6}>
                    <HTypography variant="h5">Status</HTypography>
                    <HTypography variant="body1">{capitalizeWord(alert.status)}</HTypography>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                    <HTypography variant="h5">Assets</HTypography>
                    <HTypography variant="body1">{alert.assets?.length > 0 ? alert.assets?.join(', ') : 'N/A'}</HTypography>
                </Grid>
                <Grid item xs={6}>
                    <HTypography variant="h5">Datasources</HTypography>
                    <HTypography variant="body1">{alert.analytic?.datasources?.join(', ')}</HTypography>
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={6}>
                    <HTypography variant="h5">Created At</HTypography>
                    <HTypography variant="body1">{datetimeToStr(alert.created_at)}</HTypography>
                </Grid>
            </Grid>
            <Divider />
            <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={12}>
                    <Typography variant="h5">Deviation</Typography>
                </Grid>
                {Object.entries(alert.deviation).map(([key, value]) => (
                    <Grid item key={value} xs={6}>
                        <HTypography variant="h5">{key}</HTypography>
                        <HTypography variant="body1">{value}</HTypography>
                    </Grid>
                ))}
            </Grid>
        </>
    );
}

function BaseAlertDialog(props) {
    const { alert, setWidth, clearEvents } = props;

    const [tab, setTab] = useState(0);
    const [dialogMaxWidth, setDialogMaxWidth] = useState('sm');

    const [events, setEvents] = useState([]);
    const [eventPage, setEventPage] = useState(1);
    const [eventPages, setEventPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selEvent, setSelEvent] = useState();

    const [profillerData, setProfillerData] = useState([]);
    const [profilerTimeframe, setProfilerTimeframe] = useState('week');

    // Handlers
    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    // API
    // 2 Types of Conditions
    // Different fields and functions requires different graphs
    const profileOrLookup = async () => {
        try {
            if (alert.rule?.type == 'eql') {
                const postData = {
                    datasources: alert.rule.datasources,
                    query: alert.rule.query
                };
                const response = await postLookupRule(postData);
                setProfillerData(response.data);
            } else if (alert.rule?.type == 'eql') {
                const postData = {
                    field: alert.rule.conditions?.alarm[0]?.field,
                    func: alert.rule.conditions?.alarm[0]?.function,
                    ts: profilerTimeframe,
                    datasources: alert.rule.datasources,
                    filters: alert.rule.filters
                };
                const response = await postFieldProfiler(postData);
                setProfillerData(response.data);
            }
        } catch (error) {
            setError(error, 'Error on profiler.');
        }
    };

    const fetchAlertEvents = async () => {
        try {
            const response = await getAlertEvents(alert.uuid);
            setEvents(response.data);
        } catch (error) {
            setError(error, 'Error on asset retrieval');
        }
    };

    // Hooks
    useEffect(() => {
        if (tab !== 3) return;
        profileOrLookup();
    }, [profilerTimeframe]);

    useEffect(() => {
        if (tab == 1) {
            setWidth('lg');
            fetchAlertEvents();
        } else if (tab == 3) {
            profileOrLookup();
        } else {
            setWidth('sm');
        }
    }, [tab]);

    return (
        <>
            <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={handleTabChange}>
                    <Tab label="Information" {...a11yProps(0)} />
                    <Tab label="Events" {...a11yProps(1)} />
                    <Tab label="Intelligence" {...a11yProps(2)} />
                    <Tab label={alert?.rule?.type == 'eql' ? 'Lookup' : 'Profiler'} {...a11yProps(3)} />
                </Tabs>
            </Box>
            <TabPanel value={tab} index={0}>
                <Grid item>
                    <Typography variant="h5">Rule</Typography>
                </Grid>
                <Stack spacing={2} alignItems="right" sx={{ mr: 1, mb: 1 }}>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <HTypography variant="h5">Name</HTypography>
                        <HTypography variant="body1">
                            <Link component={RouterLink} to={`/rules/${alert?.rule?.uuid}`}>
                                {alert?.rule?.name}
                            </Link>
                        </HTypography>
                    </Grid>
                    <Grid sx={{ mt: 2, mb: 1 }}>
                        <HTypography variant="h5">Description</HTypography>
                        <HTypography variant="body1">{alert?.rule?.description}</HTypography>
                    </Grid>
                </Stack>
                <Divider />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Type</HTypography>
                        <HTypography variant="body1">{capitalizeWord(alert?.type)}</HTypography>
                    </Grid>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Status</HTypography>
                        <HTypography variant="body1">{capitalizeWord(alert?.status)}</HTypography>
                    </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Assets</HTypography>
                        <HTypography variant="body1">{alert.assets?.length > 0 ? alert.assets?.join(', ') : 'N/A'}</HTypography>
                    </Grid>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Datasources</HTypography>
                        <HTypography variant="body1">{alert?.rule?.datasources?.join(', ')}</HTypography>
                    </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Event Logs</HTypography>
                        <HTypography variant="body1">{`${events.length} logs`}</HTypography>
                    </Grid>
                    <Grid item xs={6}>
                        <HTypography variant="h5">Created At</HTypography>
                        <HTypography variant="body1">{datetimeToStr(alert?.created_at)}</HTypography>
                    </Grid>
                </Grid>
                {Object.keys(alert?.context).length > 0 && (
                    <>
                        <Divider />
                        <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="h5">Context</Typography>
                            </Grid>
                            {Object.keys(alert.context).map((c) => (
                                <Grid item xs={6}>
                                    <HTypography variant="h5">{c}</HTypography>
                                    <HTypography variant="body1">{alert.context[c]}</HTypography>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </TabPanel>
            <TabPanel value={tab} index={1}>
                {/* <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
                            Search
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <TextField fullWidth id="fullWidth" size="small" />
                            <Button variant="outlined" startIcon={<SearchIcon />} onClick={eventSearch} sx={{ ml: 2 }}>
                                Search
                            </Button>
                        </Box> */}
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <EventTable
                        events={events}
                        page={eventPage}
                        pageNumber={eventPages}
                        pChange={(page) => setEventPage(page)}
                        showEvent={(event) => setSelEvent(event)}
                    />
                    {selEvent && (
                        <Editor
                            value={JSON.stringify(selEvent, null, 4)}
                            highlight={(code) => highlight(code, languages.js)}
                            padding={10}
                            style={{ ...codeEditorStyle, maxHeight: '600px' }}
                        />
                    )}
                </Stack>
            </TabPanel>
            <TabPanel value={tab} index={2}>
                <Stack spacing={3}>
                    <FormControl fullWidth>
                        <Grid>
                            <Typography variant="h6">ATT&CK Tactics</Typography>
                            {alert.rule?.attack?.tactics?.length > 0 ? (
                                alert.rule?.attack?.tactics.map((value) => (
                                    <Chip key={value.id} label={`${capitalizeWords(value.name.split([' ']))} (${value.id})`} />
                                ))
                            ) : (
                                <Typography variant="body1">None</Typography>
                            )}
                        </Grid>
                        <Grid sx={{ mt: 2 }}>
                            <Typography variant="h6">ATT&CK Techniques</Typography>
                            {alert.rule?.attack?.techniques?.length > 0 ? (
                                alert.rule?.attack?.techniques.map((value) => (
                                    <Chip key={value.id} label={`${capitalizeWords(value.name.split([' ']))} (${value.id})`} />
                                ))
                            ) : (
                                <Typography variant="body1">None</Typography>
                            )}
                        </Grid>
                    </FormControl>
                </Stack>
                <FormControl fullWidth>
                    <Typography sx={{ fontSize: '0.9rem', mb: 1, mt: 1 }} variant="h5">
                        Custom Note
                    </Typography>
                    <TextField id="intelligence-note" multiline minRows={2} maxRows={10} value={alert?.rule?.intelligence?.note} />
                </FormControl>
                <FormControl fullWidth>
                    <Typography sx={{ fontSize: '0.9rem', mb: 1, mt: 1 }} variant="h5">
                        Policy Action
                    </Typography>
                    <TextField id="intelligence-action" multiline minRows={2} maxRows={10} value={alert?.rule?.intelligence?.action} />
                </FormControl>
            </TabPanel>
            <TabPanel value={tab} index={3}>
                <Grid sx={{ ml: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel id="timeframe-label" sx={{ overflow: 'visible' }}>
                            Timeframe
                        </InputLabel>
                        <Select
                            id="timeframe"
                            labelId="timeframe-label"
                            size="small"
                            value={profilerTimeframe}
                            onChange={(event) => setProfilerTimeframe(event.target.value)}
                        >
                            {profillerTsList.map((ds) => (
                                <MenuItem key={ds} value={ds}>
                                    {ds}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <ProfilerChart slot={profilerTimeframe} data={profillerData} ranges={alert?.rule?.conditions} />
            </TabPanel>
        </>
    );
}

export default function AlertDialog(props) {
    const { alert, open, close, setState } = props;

    const [dialogMaxWidth, setDialogMaxWidth] = useState('sm');

    const handleOnClose = () => {
        close();
    };

    const getDialog = useCallback(() => {
        switch (alert?.origin) {
            case 'baseline':
                return <BaselineAlertDialog alert={alert} />;
            case 'system':
                return <BaseAlertDialog alert={alert} setWidth={setDialogMaxWidth} />;
            default:
                return <p>TODO - default</p>;
        }
    }, [alert]);

    const updateState = async () => {
        try {
            const newState = getNextState(alert.status);
            await updateAlertStatus(alert.uuid, newState);
            setState(newState);
            setSuccess('State updated.');
        } catch (error) {
            setError(error, 'Failed to update alert status');
        }
    };

    const canUpdateState = alert?.status !== 'resolved';
    const getStatusMessage = alert?.status == 'open' ? 'Review' : alert?.status == 'processing' ? 'Resolve' : 'Resolved';
    return (
        <Dialog open={open} onClose={handleOnClose} maxWidth={dialogMaxWidth}>
            <DialogContent sx={{ minWidth: '550px' }}>{getDialog()}</DialogContent>
            <Divider />
            {canUpdateState && (
                <DialogActions>
                    <Button variant="contained" onClick={updateState}>
                        {getStatusMessage}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
