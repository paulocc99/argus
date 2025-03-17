import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Grid,
    Stack,
    Typography,
    MenuItem,
    Tabs,
    Tab,
    Box,
    FormControlLabel,
    Checkbox,
    Select,
    OutlinedInput,
    Chip,
    FormControl,
    InputAdornment,
    Fab,
    List,
    Link
} from '@mui/material';

import { styled } from '@mui/material/styles';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as DefaultDatePicker } from '@mui/x-date-pickers/DatePicker';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import LeakAddIcon from '@mui/icons-material/LeakAdd';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

import moment from 'moment';
import ForceGraph2D from 'react-force-graph-2d';

import ComponentSkeleton from 'common/ComponentSkeleton';
import { intervalsList } from 'common/List';
import { TabPanel, a11yProps } from 'common/TabPanel';
import AlertSummary from 'components/AlertSummary';
import MainCard from 'components/cards/MainCard';
import NoData from 'components/NoData';
import FabPopover from 'components/FabPopover';
import { setError, setSuccess } from 'utils';
import { fabStyle, listSummaryStyle } from 'themes/other';

import {
    getAlerts,
    getBaselineSettings,
    getBaselineAnalytics,
    updateBaselineAnalytic,
    updateBaselineAnalyticStatus,
    postBaselineSettings,
    postBaselineAnalytic,
    deleteBaselineAnalytics
} from 'api';
import ProtocolsTable from './ProtocolsTable';
import AnalyticsTable from './AnalyicsTable';
import AnalyticDialog from './AnalyticDialog';
import AlertDialog from '../alerts/AlertDialog';
import AnalyticImportDialog from './import/AnalyticImportDialog';

const analyticPlaceholder = {
    name: '',
    code: '',
    description: '',
    category: '',
    timeframe: '',
    datasources: [],
    fields: [],
    filters: []
};

const DatePicker = styled(DefaultDatePicker)(({ theme }) => ({
    '& .MuiFormLabel-root': {
        background: 'none !important'
    }
}));

const Baseline = () => {
    const navigate = useNavigate();

    const [selectedAnalytic, setSelectedAnalytic] = useState(undefined);
    const [selectedAlert, setSelectedAlert] = useState(undefined);
    const [action, setAction] = useState('edit');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [aOpen, setAOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);

    const [fromDate, setFromDate] = useState(moment('1970-01-01'));
    const [toDate, setToDate] = useState(moment());

    const [onNewAssetDiscovered, setOnNewAssetDiscovered] = useState(false);
    const [onNewAssetConnections, setOnNewAssetConnections] = useState(false);
    const [onNewAssetProtocols, setOnNewAssetProtocols] = useState(false);
    const [onNewAssetProtocolsPort, setOnNewAssetProtocolsPort] = useState(false);
    const [onHighAssetConnections, setOnHighAssetConnections] = useState(false);
    const [highConnectionsPct, setHighConnectsPct] = useState(10);
    const [highConnectionsIntervals, setHighConnectionsIntervals] = useState([]);
    const [tab, setTab] = useState(0);
    const [changesMade, setChangesMade] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [analyticList, setAnalyticList] = useState([]);
    const [flowsData, setFlowsData] = useState({ nodes: [], links: [] });
    const [assetProtcols, setAssetProtocols] = useState([]);

    const [importDialog, setImportDialog] = useState(false);

    // Handlers
    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    const handleClose = () => {
        setAOpen(false);
    };

    const handleAlert = (alert) => {
        setSelectedAlert(alert);
    };

    const handleSave = async () => {
        if (action == 'new') {
            await createAnalytic();
        } else if (action == 'edit') {
            await updateAnalytic();
        }
    };

    const handleAddRule = (type) => {
        if (type == 0) {
            setAction('new');
            setSelectedAnalytic(analyticPlaceholder);
        } else {
            setImportDialog(true);
        }
    };

    const handleDelete = async () => {
        await removeAnalytic(selectedAnalytic.code);
        handleClose();
    };

    const handleOpenAnalytic = (analytic) => {
        setAction('edit');
        setSelectedAnalytic(analytic);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleAlertStateUpdate = (state) => {
        setSelectedAlert({ ...selectedAlert, status: state });
    };

    const setAnalytic = (attr, value) => {
        const sel = { ...selectedAnalytic };
        sel[attr] = value;
        // if (attr == 'category') sel[attr] = value ? 'asset' : 'general';
        setSelectedAnalytic(sel);
    };

    const generateDataFlows = (data, assets) => {
        const flows = { nodes: [], links: [] };

        data.forEach((f) => {
            for (const ip of f.ips) {
                if (!flows.nodes.find((flow) => flow.id == ip)) {
                    const asset = assets.find((a) => a.ip.includes(ip));
                    const node = {
                        id: ip,
                        name: asset?.name || ip
                        // name: ipAsset ? `${ipAsset.name}\n(${ip})` : ip
                    };
                    // Set warning color on node that is not validated
                    if (asset && asset?.validated == false) node.color = 'orange';
                    flows.nodes.push(node);
                }
            }
            flows.links.push({
                source: f.ips[0],
                target: f.ips[1],
                value: 5
            });
        });

        return flows;
    };

    // API
    const getBaseline = async () => {
        try {
            const response = await getBaselineSettings();
            const { settings, flows, assets } = response.data;
            setFromDate(moment(settings.baseline_time_range.start));
            setToDate(moment(settings.baseline_time_range.end));
            setFlowsData(generateDataFlows(flows, assets));
            setAssetProtocols(assets);
            // Settings bool value
            setOnNewAssetDiscovered(settings.new_asset);
            setOnNewAssetConnections(settings.new_asset_connections);
            setOnNewAssetProtocols(settings.new_asset_protocols);
            setOnNewAssetProtocolsPort(settings.new_asset_protocols_ports);
            setOnHighAssetConnections(settings.high_asset_connections);
            setHighConnectsPct(settings.high_asset_connections_pct);
            setHighConnectionsIntervals(settings.high_asset_connections_intervals);
        } catch (error) {
            setError(error, "Couldn't retrieve baseline settings.");
        }
    };

    const fetchBaselineAlerts = async () => {
        try {
            const params = {
                source: 'baseline',
                summary: 'true',
                status: 'open'
            };
            const response = await getAlerts(params);
            setAlerts(response.data);
        } catch (error) {
            setError(error, "Counln't retrieve baseline alerts.");
        }
    };

    const fetchBaselineAnalytics = async () => {
        try {
            const response = await getBaselineAnalytics();
            const { analytics } = response.data;
            setAnalyticList(analytics);
        } catch (error) {
            setError(error, "Counln't retrieve baseline analytics.");
        }
    };

    const createAnalytic = async () => {
        try {
            await postBaselineAnalytic({ ...selectedAnalytic });
            setSuccess('Analytic created.');
            fetchBaselineAnalytics();
        } catch (error) {
            setError(error, "Coudn't create analytic.");
        }
    };

    const updateAnalytic = async () => {
        try {
            const analytic = { ...selectedAnalytic };
            await updateBaselineAnalytic(analytic.code, analytic);
            setSuccess('Analytic updated.');
            fetchBaselineAnalytics();
            setChangesMade(false);
        } catch (error) {
            setError(error, 'Error on analytic update.');
        }
    };

    const updateAnalyticState = async (id, active) => {
        try {
            await updateBaselineAnalyticStatus(id, active);
            setSuccess('Analytic state updated.');
            fetchBaselineAnalytics();
        } catch (error) {
            setError(error, 'Error on analytic state update.');
        }
    };

    const removeAnalytic = async (id) => {
        try {
            await deleteBaselineAnalytics(id);
            setSuccess('Analytic deleted.');
            fetchBaselineAnalytics();
        } catch (error) {
            setError(error, 'Error on analytic deletion.');
        }
    };

    const updateBaselineSettings = async () => {
        try {
            const data = {
                new_asset: onNewAssetDiscovered,
                new_asset_connections: onNewAssetConnections,
                new_asset_protocols: onNewAssetProtocols,
                new_asset_protocols_ports: onNewAssetProtocolsPort,
                high_asset_connections: onHighAssetConnections,
                high_asset_connections_pct: parseInt(highConnectionsPct),
                high_asset_connections_intervals: highConnectionsIntervals,
                baseline_time_range: { start: fromDate, end: toDate }
            };
            await postBaselineSettings(data);
            setSuccess('Baseline settings updated.');
            setChangesMade(false);
        } catch (error) {
            setError(error, 'Error on baseline settings update.');
        }
    };

    // Hooks
    useEffect(() => {
        getBaseline();
        fetchBaselineAnalytics();
        fetchBaselineAlerts();
    }, [, page]);

    useEffect(() => {
        if (selectedAnalytic) setAOpen(true);
    }, [selectedAnalytic]);

    useEffect(() => {
        if (!aOpen) setSelectedAnalytic(undefined);
    }, [aOpen]);

    useEffect(() => {
        if (selectedAlert) setAlertOpen(true);
    }, [selectedAlert]);

    useEffect(() => {
        if (!alertOpen) setSelectedAlert(undefined);
    }, [alertOpen]);

    // useEffect(() => {
    //     if (onNewAssetProtocols || onNewAssetProtocolsPort) getBaseline();
    // }, [onNewAssetProtocols, onNewAssetProtocolsPort]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={8}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">Baseline</Typography>
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            <Grid item xs={4}></Grid>
                            <Grid item xs={4}>
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                    <DatePicker
                                        label="From"
                                        value={fromDate}
                                        onChange={(date) => {
                                            setFromDate(date);
                                            setChangesMade(true);
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={4}>
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                    <DatePicker
                                        label="To"
                                        value={toDate}
                                        onChange={(date) => {
                                            setToDate(date);
                                            setChangesMade(true);
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <Box sx={{ borderBottom: 0, borderColor: 'divider', m: 1 }}>
                            <Tabs value={tab} onChange={handleTabChange}>
                                <Tab label="Analytics" {...a11yProps(0)} />
                                <Tab label="Data Flows" {...a11yProps(1)} />
                                <Tab label="Assets" {...a11yProps(2)} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tab} index={0}>
                            {analyticList && analyticList.length > 0 && (
                                <AnalyticsTable analytics={analyticList} show={handleOpenAnalytic} updateState={updateAnalyticState} />
                            )}
                        </TabPanel>
                        <TabPanel value={tab} index={1}>
                            <Grid item xs={12} sx={{ ml: 1 }}>
                                <Typography variant="h5" sx={{ fontSize: '0.9rem' }}>
                                    Monitoring Options
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={onNewAssetConnections}
                                            onChange={(e) => {
                                                setOnNewAssetConnections(e.target.checked);
                                                setChangesMade(true);
                                            }}
                                        />
                                    }
                                    label="Monitor for new data flows between assets that previously had no interaction"
                                />
                            </Grid>
                            <Grid item xs={12} sx={{ ml: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={onHighAssetConnections}
                                            onChange={(e) => {
                                                setOnHighAssetConnections(e.target.checked);
                                                setChangesMade(true);
                                            }}
                                        />
                                    }
                                    label="Monitor for unusual data flows between trusted assets"
                                />
                            </Grid>
                            <Grid item xs={12} sx={{ ml: 1, mt: 2 }}>
                                <Typography variant="h5" sx={{ fontSize: '0.9rem' }}>
                                    Baselined Data Flows
                                </Typography>
                                {flowsData.nodes.length > 0 ? (
                                    <ForceGraph2D
                                        graphData={flowsData}
                                        nodeLabel="id"
                                        width="800"
                                        height="600"
                                        minZoom="5"
                                        nodeCanvasObjectMode={() => 'after'}
                                        nodeCanvasObject={(node, ctx, globalScale) => {
                                            const nodeLabel = node.name;
                                            const fontSize = 12 / globalScale;
                                            ctx.font = `${fontSize}px Sans-Serif`;
                                            ctx.textAlign = 'center';
                                            ctx.textBaseline = 'middle';
                                            ctx.fillStyle = 'black';
                                            ctx.fillText(nodeLabel, node.x, node.y + 8);
                                        }}
                                        // nodeColor={getNodeColor}
                                        linkDirectionalParticles="value"
                                        linkDirectionalParticleSpeed={(d) => d.value * 0.001}
                                    />
                                ) : (
                                    <Grid display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2, height: '500px' }}>
                                        <LeakAddIcon style={{ color: 'gray' }} />
                                        <Typography style={{ color: 'gray' }} variant="body1">
                                            No data flows on this timeframe
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>
                        <TabPanel value={tab} index={2}>
                            <Grid item xs={6} sx={{ ml: 1 }}>
                                <Typography variant="h5" sx={{ fontSize: '0.9rem' }}>
                                    Monitoring Options
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={onNewAssetDiscovered}
                                            onChange={(e) => {
                                                setOnNewAssetDiscovered(e.target.checked);
                                                setChangesMade(true);
                                            }}
                                        />
                                    }
                                    label="Monitor for never-seen before assets in the network"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={onNewAssetProtocols}
                                            onChange={(e) => {
                                                setOnNewAssetProtocols(e.target.checked);
                                                setChangesMade(true);
                                            }}
                                        />
                                    }
                                    label="Monitor for protocols never-seen before in a asset"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={onNewAssetProtocolsPort}
                                            onChange={(e) => {
                                                setOnNewAssetProtocolsPort(e.target.checked);
                                                setChangesMade(true);
                                            }}
                                        />
                                    }
                                    label="Monitor for asset protocols using non-standard ports"
                                />
                            </Grid>
                        </TabPanel>
                    </MainCard>
                    <br></br>
                    {tab == 1 && onHighAssetConnections && (
                        <div>
                            <Grid item>
                                <Typography variant="h5">Abnormal Data Flows Settings</Typography>
                            </Grid>
                            <MainCard sx={{ mt: 2 }} content={false}>
                                <Grid container alignItems="center" sx={{ p: 2 }}>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth>
                                            <Stack direction="row">
                                                <Typography variant="h6" sx={{ mt: 1.5, mr: 2 }}>
                                                    Intervals to monitor
                                                </Typography>
                                                <Select
                                                    id="intervals"
                                                    size="small"
                                                    multiple
                                                    value={highConnectionsIntervals}
                                                    onChange={(event) => setHighConnectionsIntervals(event.target.value)}
                                                    input={<OutlinedInput id="intervals-chip" label="Intervals" />}
                                                    renderValue={(selIntervals) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {selIntervals.map((interval) => (
                                                                <Chip
                                                                    size="small"
                                                                    key={interval.value}
                                                                    label={intervalsList.find((e) => e.value == interval).label}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                >
                                                    {intervalsList.map((interval) => (
                                                        <MenuItem value={interval.value}>{interval.label}</MenuItem>
                                                    ))}
                                                </Select>
                                            </Stack>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={8} sx={{ mt: 1, pl: 1 }}>
                                        <Stack direction="row">
                                            <p>Trigger an alert when the average data flow count is HIGHER</p>
                                            <Grid item xs={2} sx={{ ml: 1, mr: 0.5 }}>
                                                <OutlinedInput
                                                    id="high-flows-pct"
                                                    size="small"
                                                    type="number"
                                                    value={highConnectionsPct}
                                                    onChange={(e) => setHighConnectsPct(e.target.value)}
                                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                                    inputProps={{
                                                        'aria-label': 'weight'
                                                    }}
                                                />
                                            </Grid>
                                            <p>than the baseline.</p>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </MainCard>
                        </div>
                    )}
                    {tab == 2 && onNewAssetProtocols && (
                        <div>
                            <Grid item>
                                <Typography variant="h5">Asset Protocols</Typography>
                            </Grid>
                            <MainCard sx={{ mt: 2 }} content={false}>
                                <ProtocolsTable assets={assetProtcols} />
                            </MainCard>
                        </div>
                    )}
                </Grid>
                <Grid item xs={4} sx={{ mt: 7 }}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">Baseline Alerts</Typography>
                        </Grid>
                    </Grid>
                    {alerts && alerts.length > 0 ? (
                        <>
                            <MainCard sx={{ mt: 2, mb: 2 }} content={false}>
                                <List component="nav" sx={listSummaryStyle}>
                                    {alerts.map((alert) => (
                                        <AlertSummary key={alert.uuid} alert={alert} click={handleAlert} />
                                    ))}
                                </List>
                            </MainCard>
                            <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
                                <Link onClick={() => navigate('/alerts?type=baseline')}>View all</Link>
                            </Grid>
                        </>
                    ) : (
                        <NoData
                            icon={<NotificationsOffIcon style={{ color: 'gray' }} />}
                            message="No alerts at this time."
                            height="300px"
                        />
                    )}
                </Grid>
            </Grid>
            <Fab
                onClick={updateBaselineSettings}
                color={changesMade ? 'primary' : 'gray'}
                sx={{ ...fabStyle, right: (theme) => theme.spacing(12) }}
            >
                <SaveIcon />
            </Fab>
            <FabPopover icon={<AddIcon />} func={handleAddRule} />
            <AnalyticDialog
                open={aOpen}
                handleClose={handleClose}
                analytic={selectedAnalytic}
                setAnalytic={setAnalytic}
                save={handleSave}
                remove={handleDelete}
                action={action}
            />
            <AlertDialog open={alertOpen} alert={selectedAlert} close={() => setAlertOpen(false)} />
            <AnalyticImportDialog open={importDialog} refresh={() => fetchBaselineAnalytics()} close={() => setImportDialog(false)} />
        </ComponentSkeleton>
    );
};

export default Baseline;
