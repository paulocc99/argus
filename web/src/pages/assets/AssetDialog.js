import { useState, useEffect } from 'react';

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
    FormControlLabel,
    TextField,
    Checkbox,
    Button,
    Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

import { getAssetAlerts, getAssetEvents } from 'api';
import { setError, capitalizeWord } from 'utils';
import { codeEditorStyle } from 'themes/other';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { HTypography } from 'common/Typography';
import EventTable from 'components/EventTable';
import AssetAlertTable from './AssetAlertTable';

export default function AssetDialog(props) {
    const { asset, update, open, handleClose, updateSelAsset } = props;

    const [dialogMaxWidth, setDialogMaxWidth] = useState('sm');
    const [tab, setTab] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [alertsPage, setAlertsPage] = useState(1);
    const [alertsPages, setAlertsPages] = useState(1);

    const [events, setEvents] = useState([]);
    const [eventsPage, setEventsPage] = useState(1);
    const [eventsPages, setEventsPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selEvent, setSelEvent] = useState();

    // Handlers
    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    // API
    const fetchAlerts = async () => {
        try {
            const response = await getAssetAlerts(asset.uuid, alertsPage);
            setAlerts(response.data.alerts.reverse());
            setAlertsPages(response.data.pages);
        } catch (error) {
            setError("Couldn't retrieve asset alerts.", error.message);
        }
    };

    const fetchEvents = async () => {
        try {
            const params = {
                page: eventsPage,
                q: searchQuery
            };
            const response = await getAssetEvents(asset.uuid, params);

            setEvents(response.data.events);
            setEventsPages(response.data.pages);
        } catch (error) {
            setError("Couldn't retrieve asset events", error.message);
        }
    };

    // Hooks
    useEffect(() => {
        if (!open) setEventsPage(1);
        if (!asset?.uuid) return;
        fetchAlerts();
        fetchEvents();
    }, [open]);

    useEffect(() => {
        if (!asset?.uuid) return;
        fetchEvents();
    }, [eventsPage]);

    useEffect(() => {
        if (tab == 2) {
            setDialogMaxWidth('lg');
        } else {
            setDialogMaxWidth('sm');
        }
    }, [tab]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth={dialogMaxWidth}>
            <DialogContent sx={{ minWidth: '700px', minHeight: '300px' }}>
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={handleTabChange}>
                        <Tab label="Asset" {...a11yProps(0)} />
                        <Tab label="Alerts" {...a11yProps(1)} />
                        <Tab label="Events" {...a11yProps(2)} />
                    </Tabs>
                </Box>
                <TabPanel value={tab} index={0}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Name</HTypography>
                                <TextField
                                    id="asset-name"
                                    size="small"
                                    value={asset?.name}
                                    onChange={() => updateSelAsset('name', event.target.value)}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Vendor</HTypography>
                                <TextField
                                    id="asset-vendor"
                                    size="small"
                                    value={asset?.vendor}
                                    onChange={() => updateSelAsset('vendor', event.target.value)}
                                />
                            </FormControl>
                        </Grid>
                        {asset?.os && (
                            <>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <HTypography variant="h6">OS Type</HTypography>
                                        <TextField id="asset-vendor" size="small" disabled value={capitalizeWord(asset?.os?.type)} />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <HTypography variant="h6">OS Version</HTypography>
                                        <TextField id="asset-vendor" size="small" disabled value={asset?.os?.name} />
                                    </FormControl>
                                </Grid>
                            </>
                        )}
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                        <FormControl fullWidth>
                            <HTypography variant="h6">Description</HTypography>
                            <TextField
                                id="asset-description"
                                size="small"
                                multiline
                                value={asset?.description}
                                onChange={() => updateSelAsset('description', event.target.value)}
                            />
                        </FormControl>
                    </Grid>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">IP Address</HTypography>
                                <TextField multiline id="outlined-disabled" size="small" disabled value={asset?.ip.join('\n')} />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">MAC Address</HTypography>
                                <TextField multiline id="outlined-disabled" size="small" disabled value={asset?.mac.join('\n')} />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                        <HTypography variant="h5">Options</HTypography>
                        <Stack>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={asset?.hidden} onChange={() => updateSelAsset('hidden', event.target.checked)} />
                                }
                                label="Hide from main view"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox checked={asset?.network} onChange={() => updateSelAsset('network', event.target.checked)} />
                                }
                                label="Network monitoring"
                            />
                        </Stack>
                    </Grid>
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <AssetAlertTable alerts={alerts} page={alertsPage} pageNumber={alertsPages} pChange={(page) => setAlertsPage(page)} />
                </TabPanel>
                <TabPanel value={tab} index={2}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <div>
                            <HTypography>Search</HTypography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
                                <TextField
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                    }}
                                    fullWidth
                                    id="fullWidth"
                                    size="small"
                                />
                                <Button variant="outlined" startIcon={<SearchIcon />} onClick={fetchEvents} sx={{ ml: 2 }}>
                                    Search
                                </Button>
                            </Box>
                            <EventTable
                                events={events}
                                page={eventsPage}
                                pagesNumber={eventsPages}
                                pChange={(event, value) => setEventsPage(value)}
                                showEvent={(event) => setSelEvent(event)}
                            />
                        </div>
                        {selEvent && (
                            <Editor
                                value={JSON.stringify(selEvent, null, 4)}
                                highlight={(code) => highlight(code, languages.js)}
                                padding={10}
                                style={{ ...codeEditorStyle, maxHeight: '660px' }}
                            />
                        )}
                    </Stack>
                </TabPanel>
            </DialogContent>
            <DialogActions>{tab == 0 && <Button onClick={update}>Save</Button>}</DialogActions>
        </Dialog>
    );
}
