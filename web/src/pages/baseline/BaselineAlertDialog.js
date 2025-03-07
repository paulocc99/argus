import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
    Box,
    Stack,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    FormControl,
    Grid,
    Link,
    Divider
} from '@mui/material';

import { datetimeToStr, capitalizeWord, setError } from 'utils';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { HTypography } from 'common/Typography';
import DynamicTable from 'DynamicTable/DynamicTable';
import { setSuccess } from 'utils';
import { updateAlertStatus } from 'api';

const getNextState = (state) => {
    return state == 'open' ? 'processing' : state == 'processing' ? 'resolved' : '';
};

export default function BaselineAlertDialog(props) {
    const { alert, open, close, setState } = props;

    const [tab, setTab] = useState(0);

    // API
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

    // Handlers
    const handleTabChange = (e, newValue) => {
        setTab(newValue);
    };

    const getAnalyticFields = (analytic) => {
        if (analytic.category == 'asset') return [...['Asset'], ...analytic.fields];
        return analytic.fields;
    };

    if (!alert) return <></>;

    const hasAnalytic = alert.analytic && alert.analytic.name;
    const canUpdateState = alert.status == 'resolved';
    const getStatusMessage = alert.status == 'open' ? 'Process' : alert.status == 'processing' ? 'Resolve' : 'Resolved';

    return (
        <Dialog open={open} onClose={close} maxWidth="sm">
            <DialogContent sx={{ minWidth: '550px' }}>
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={handleTabChange}>
                        <Tab label="Information" {...a11yProps(0)} />
                        {hasAnalytic && <Tab label={`Deviations (${alert.deviations?.length})`} {...a11yProps(0)} />}
                    </Tabs>
                </Box>
                <TabPanel value={tab} index={0}>
                    <Grid item>
                        <Typography variant="h5">Analytic</Typography>
                    </Grid>
                    <Stack spacing={2} alignItems="right" sx={{ mr: 1 }}>
                        {hasAnalytic ? (
                            <>
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <HTypography variant="h5">Name</HTypography>
                                    <HTypography variant="body1">
                                        <Link component={RouterLink} to={`/analytic/${alert.analytic?.code}`}>
                                            {alert.analytic?.name}
                                        </Link>
                                    </HTypography>
                                </Grid>
                                <Grid sx={{ mt: 2, mb: 1 }}>
                                    <HTypography variant="h5">Description</HTypography>
                                    <HTypography variant="body1">{alert.analytic?.description}</HTypography>
                                </Grid>
                            </>
                        ) : (
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Grid sx={{ mt: 2, mb: 1 }}>
                                    <HTypography variant="h5">Message</HTypography>
                                    <HTypography variant="body1">{alert.custom_msg}</HTypography>
                                </Grid>
                            </Grid>
                        )}
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
                            <HTypography variant="body1">{alert.assets?.length > 0 ? alert?.assets?.join(', ') : 'N/A'}</HTypography>
                        </Grid>
                        <Grid item xs={6}>
                            <HTypography variant="h5">Datasources</HTypography>
                            <HTypography variant="body1">
                                {alert.analytic.datasources ? alert.analytic?.datasources?.join(', ') : 'N/A'}
                            </HTypography>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                        <Grid item xs={6}>
                            <HTypography variant="h5">Timeframe</HTypography>
                            <HTypography variant="body1">{alert.analytic?.timeframe ? alert.analytic?.timeframe : 'N/A'}</HTypography>
                        </Grid>

                        <Grid item xs={6}>
                            <HTypography variant="h5">Created At</HTypography>
                            <HTypography variant="body1">{datetimeToStr(alert.created_at)}</HTypography>
                        </Grid>
                    </Grid>
                    {Object.keys(alert.context).length > 0 && (
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
                    <FormControl fullWidth>
                        <DynamicTable data={alert.deviations} cells={getAnalyticFields(alert.analytic)} />
                    </FormControl>
                </TabPanel>
            </DialogContent>
            <DialogActions>{!canUpdateState && <Button onClick={updateState}>{getStatusMessage}</Button>}</DialogActions>
        </Dialog>
    );
}
