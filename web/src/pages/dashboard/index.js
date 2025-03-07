import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Grid, List, Stack, Typography, Link } from '@mui/material';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LanIcon from '@mui/icons-material/Lan';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

import { getAlerts, getStats } from 'api';
import { setError, eventsNumberPretty } from 'utils';
import MainCard from 'components/cards/MainCard';
import AnalyticCard from 'components/cards/AnalyticCard';
import AlertSummary from 'components/AlertSummary';
import NoData from 'components/NoData';
import ComponentLoader from 'components/ComponentLoader';
import AlertDialog from '../alerts/AlertDialog';
import EventAlertChart from './EventAlertChart';
import { listSummaryStyle } from 'themes/other';

const statsPlaceHolder = {
    counts: {
        events: 0,
        rules: 0,
        alerts: 0,
        hosts: 0
    }
};

export default function DashboardDefault() {
    const navigate = useNavigate();

    const [slot, setSlot] = useState('week');
    const [stats, setStats] = useState(statsPlaceHolder);
    const [loadingStats, setLoadingStats] = useState(false);
    const [selAlert, setSelAlert] = useState(undefined);
    const [openAlerts, setOpenAlerts] = useState([]);
    const [alertDialog, setAlertDialog] = useState(false);

    // Handlers
    const handleDialogClose = () => {
        setAlertDialog(false);
    };

    const handleAlertBtn = (alert) => {
        setSelAlert(alert);
    };

    // API
    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const response = await getStats();
            setStats(response.data);
        } catch (error) {
            setError('Error while retriving statistics.', error.message);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchAlertsSummary = async () => {
        try {
            const params = {
                summary: 'true',
                status: 'open'
            };
            const response = await getAlerts(params);
            setOpenAlerts(response.data);
        } catch (error) {
            setError(error, 'Error on alert retrival.');
        }
    };

    // Hooks
    useEffect(() => {
        if (selAlert) setAlertDialog(true);
    }, [selAlert]);

    useEffect(() => {
        if (!alertDialog) setSelAlert(undefined);
    }, [alertDialog]);

    useEffect(() => {
        fetchStats();
        fetchAlertsSummary();
    }, []);

    return (
        <Grid container rowSpacing={4.5} columnSpacing={2.75}>
            <Grid item xs={12} sx={{ mb: -2.25 }}>
                <Typography variant="h5">Dashboard</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <AnalyticCard
                    loading={loadingStats}
                    title="Total Events"
                    count={eventsNumberPretty(stats.counts.events)}
                    OpIcon={<ReceiptLongIcon />}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <AnalyticCard loading={loadingStats} title="Total Rules" count={stats.counts.rules} OpIcon={<AssignmentIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <AnalyticCard loading={loadingStats} title="Total Alerts" count={stats.counts.alerts} OpIcon={<LocalPoliceIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <AnalyticCard loading={loadingStats} title="Total Hosts" count={stats.counts.hosts} OpIcon={<LanIcon />} />
            </Grid>
            <Grid item md={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />
            <Grid item xs={12} md={7} lg={8}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">Alerts By Events</Typography>
                    </Grid>
                    <Grid item>
                        <Stack direction="row" alignItems="center" spacing={0}>
                            <Button
                                size="small"
                                sx={{ ml: 3 }}
                                onClick={() => setSlot('month')}
                                color={slot === 'month' ? 'primary' : 'secondary'}
                                variant={slot === 'month' ? 'outlined' : 'text'}
                            >
                                Month
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSlot('week')}
                                color={slot === 'week' ? 'primary' : 'secondary'}
                                variant={slot === 'week' ? 'outlined' : 'text'}
                            >
                                Week
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
                <MainCard content={false} sx={{ mt: 1.5 }}>
                    <Box sx={{ pt: 1, pr: 2 }}>
                        <ComponentLoader loading={loadingStats} height="450px">
                            <EventAlertChart slot={slot} data={stats?.ocurrence_by_month} type={'events'} />
                        </ComponentLoader>
                    </Box>
                </MainCard>
            </Grid>
            <Grid item xs={12} md={5} lg={4}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">Latest Alerts</Typography>
                    </Grid>
                    <Grid item />
                </Grid>
                {openAlerts.length > 0 ? (
                    <>
                        <MainCard sx={{ mt: 2, mb: 2 }} content={false}>
                            <List component="nav" sx={listSummaryStyle}>
                                {openAlerts.map((alert) => (
                                    <AlertSummary alert={alert} click={handleAlertBtn} />
                                ))}
                            </List>
                        </MainCard>
                        <Grid display="flex" justifyContent="center" alignItems="center" size="grow">
                            <Link onClick={() => navigate('/alerts')}>View all</Link>
                        </Grid>
                    </>
                ) : (
                    <NoData icon={<NotificationsOffIcon style={{ color: 'gray' }} />} message="No alerts at this time." height="300px" />
                )}
            </Grid>
            <AlertDialog open={alertDialog} close={handleDialogClose} alert={selAlert} />
        </Grid>
    );
}
