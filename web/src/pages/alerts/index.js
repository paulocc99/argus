import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Grid, Stack, Typography, MenuItem } from '@mui/material';

import { getAlerts, getAssets, updateAlertStatus } from 'api';
import { setError, setSuccess, n } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import FilterTextField from 'components/FilterTextField';
import MainCard from 'components/cards/MainCard';
import { riskList, statusList, typeList, sourceList } from 'common/List';
import AlertTable from './AlertTable';
import AlertDialog from './AlertDialog';

const assetPlaceHolder = { name: 'None', uuid: 'none' };

const AlertList = () => {
    const [searchParams] = useSearchParams();

    const [alertList, setAlertList] = useState([]);
    const [alertCount, setAlertCount] = useState(0);
    const [selectedAlert, setSelectedAlert] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState('none');
    const [assetFilter, setAssetFilter] = useState(assetPlaceHolder);
    const [assetList, setAssetList] = useState([assetPlaceHolder]);
    const [riskFilter, setRiskFilter] = useState('none');
    const [typeFilter, setTypeFilter] = useState('none');
    const [sourceFilter, setSourceFilter] = useState('none');

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [alertDialog, setAlertDialog] = useState(false);

    // Handlers
    const handleDialogClose = () => {
        setAlertDialog(false);
    };

    const handleAlertStateChange = (newState) => {
        setSelectedAlert({ ...selectedAlert, status: newState });
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const updateSelectedAlert = (alert) => {
        setSelectedAlert(alert);
    };

    // API
    const fetchAlerts = async () => {
        try {
            const params = {
                page: page,
                source: n(sourceFilter),
                asset: n(assetFilter.uuid),
                status: n(statusFilter),
                risk: n(riskFilter),
                type: n(typeFilter)
            };
            const response = await getAlerts(params);
            const { alerts, size, pages } = response.data;
            setAlertList(alerts);
            setAlertCount(size);
            setPages(pages);
        } catch (error) {
            setError(error, 'Error on alert retrieval');
        }
    };

    const fetchAssets = async () => {
        try {
            const response = await getAssets({ nameOnly: true });
            const validAssets = response.data.filter((asset) => asset.name);
            setAssetList([assetPlaceHolder, ...validAssets]);
        } catch (error) {
            setError(error, 'Error on asset retrieval');
        }
    };

    const modifyAlertStatus = async (uuid, state) => {
        try {
            await updateAlertStatus(uuid, state);
            const updatedAlerts = [...alertList].map((a) => (a.uuid == uuid ? { ...a, status: state } : a));
            setAlertList(updatedAlerts);
            setSuccess('Alert state updated');
        } catch (error) {
            setError(error, "Couldn't update alert status");
        }
    };

    // Hooks
    useEffect(() => {
        fetchAssets();
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [page]);

    useEffect(() => {
        if (selectedAlert) setAlertDialog(true);
    }, [selectedAlert]);

    useEffect(() => {
        if (!alertDialog) setSelectedAlert(undefined);
    }, [alertDialog]);

    useEffect(() => {
        let alertSource = searchParams.get('type');
        if (alertSource) setSourceFilter(searchParams.get('type'));
    }, [searchParams]);

    useEffect(() => {
        if (page === 1) {
            if (!alertList.length) return;
            fetchAlerts();
            return;
        }
        setPage(1);
    }, [sourceFilter, statusFilter, riskFilter, typeFilter, assetFilter]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={8} lg={10}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">{`Alerts (${alertCount})`}</Typography>
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            <FilterTextField
                                id="alert-source-filter"
                                size="small"
                                label="Source"
                                select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                            >
                                {sourceList.map((option) => (
                                    <MenuItem key={`source-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="alert-type-filter"
                                size="small"
                                label="Type"
                                select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                {typeList.map((option) => (
                                    <MenuItem key={`type-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="alert-severity-filter"
                                size="small"
                                label="Severity"
                                select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                            >
                                {riskList.map((option) => (
                                    <MenuItem key={`sev-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="alert-status-filter"
                                size="small"
                                label="Status"
                                select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {statusList.map((option) => (
                                    <MenuItem key={`status-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="alert-asset-filter"
                                size="small"
                                label="Asset"
                                select
                                value={assetFilter}
                                onChange={(e) => setAssetFilter(e.target.value)}
                            >
                                {assetList.map((option) => (
                                    <MenuItem key={`stat-${option.name}`} value={option}>
                                        {option.name}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <AlertTable
                            rules={alertList}
                            updateSelected={updateSelectedAlert}
                            page={page}
                            pagesNumber={pages}
                            hChange={handlePageChange}
                            updateState={modifyAlertStatus}
                        />
                    </MainCard>
                </Grid>
            </Grid>
            <AlertDialog open={alertDialog} close={handleDialogClose} alert={selectedAlert} setState={handleAlertStateChange} />
        </ComponentSkeleton>
    );
};

export default AlertList;
