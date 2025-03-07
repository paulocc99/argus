import { useState, useEffect } from 'react';

import { Stack, Dialog, DialogContent, DialogActions, TextField, Button, Grid, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { HTypography } from 'common/Typography';
import { setSuccess, setError } from 'utils';
import { getBaselineAnalyticsForImport, postBaselineAnalyticImport } from 'api';
import NoData from 'components/NoData';
import AnalyticsImportTable from './AnalyticsImportTable';

function AnalyticImportDialog(props) {
    const { open, close, refresh } = props;

    const [analyticsList, setAnalytics] = useState([]);
    const [analyticsSize, setAnalyticsSize] = useState(0);
    const [analyticsPage, setAnalyticsPage] = useState(1);
    const [analyticsPages, setAnalyticsPages] = useState(1);

    const [searchFilter, setSearchFilter] = useState('');

    // API
    const fetchAnalyticsForImport = async () => {
        try {
            const params = {
                page: analyticsPage,
                search: searchFilter
            };
            const response = await getBaselineAnalyticsForImport(params);
            const { analytics, size, pages } = response.data;
            setAnalytics(analytics);
            setAnalyticsSize(size);
            setAnalyticsPages(pages);
        } catch (error) {
            setError(error, "Couln't retrieve native analytics.");
        }
    };

    const importAllAnalytics = async () => {
        try {
            await postBaselineAnalyticImport(['ALL']);
            setSuccess('Import completed');
            refresh();
            close();
        } catch (error) {
            setError(error, "Couldn't import analytics");
        }
    };

    // Hooks
    useEffect(() => {
        if (!open) return;
        fetchAnalyticsForImport();
    }, [open, analyticsPage]);

    return (
        <Dialog open={open} onClose={close} maxWidth="xl">
            <DialogContent sx={{ minWidth: '700px', minHeight: '400px' }}>
                <Grid container alignItems="center">
                    <Grid item xs={6}>
                        <HTypography variant="h6">Search</HTypography>
                        <Stack direction="row">
                            <TextField
                                value={searchFilter}
                                onChange={(event) => {
                                    setSearchFilter(event.target.value);
                                }}
                                fullWidth
                                id="fullWidth"
                                size="small"
                            />
                            <Button
                                variant="outlined"
                                disabled={!analyticsList?.length}
                                startIcon={<SearchIcon />}
                                onClick={fetchAnalyticsForImport}
                                sx={{ ml: 2 }}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
                {analyticsList.length > 0 ? (
                    <AnalyticsImportTable
                        analytics={analyticsList}
                        page={analyticsPage}
                        pagesNumber={analyticsPages}
                        pChange={(e, value) => setAnalyticsPage(value)}
                        callImport={importAllAnalytics}
                    />
                ) : (
                    <NoData message="No native analytics available for import." height="300px" />
                )}
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button disabled={!analyticsSize > 0} variant="contained" onClick={importAllAnalytics}>
                    Import All ({analyticsSize})
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AnalyticImportDialog;
