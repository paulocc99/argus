import { useEffect, useState } from 'react';

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
    Grid,
    Select,
    OutlinedInput,
    MenuItem,
    Chip,
    Autocomplete
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

import { getDatasources, getFields, postProfileAnalytic } from 'api';
import { setError } from 'utils';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { HTypography } from 'common/Typography';
import { timeframeList } from 'common/List';
import DynamicTable from 'components/DynamicTable';
import BasicPopover from 'components/BasicPopover';
import ComponentLoader from 'components/ComponentLoader';
import NoData from 'components/NoData';
import { Filter } from '../rules/common';
import AssetActiveTable from './AssetActiveTable';
import { getAssets } from 'api';
import { capitalizeWord } from 'utils';

const analyticType = ['general', 'asset'];

const profilerProp = {
    base: [],
    latest: [],
    deviations: []
};

export default function AnalyticDialog(props) {
    const { analytic, save, remove, open, handleClose, setAnalytic, action } = props;

    const [profilerData, setProfilerData] = useState(profilerProp);
    const [profilerLoading, setProfilerLoading] = useState(false);
    const [profilerGroupBy, setProfilerGroupBy] = useState([]);
    const [dataSources, setDataSources] = useState([]);
    const [assets, setAssets] = useState([]);
    const [fields, setFields] = useState([]);
    const [tab, setTab] = useState(0);
    const [tabProfiler, setTabProfiler] = useState(0);
    const [enableAll, setEnableAll] = useState(true);

    const handleUpdate = (e) => {
        setAnalytic(e.target.name, e.target.value);
    };

    const handleTabChange = (e, newValue) => {
        setTab(newValue);
    };

    const handleTabProfilerChange = (e, newValue) => {
        setTabProfiler(newValue);
    };

    const handleDatasourceChange = (datasources) => {
        setAnalytic('datasources', datasources);
        fetchFields(datasources);
    };

    const getAnalyticFields = () => {
        if (analytic.category == 'asset') return [...['Asset'], ...analytic.fields];
        return analytic.fields;
    };

    function groupBy(list, index) {
        const map = new Map();
        list.forEach((item) => {
            const key = item[index];
            let coll = map.get(key);
            if (!coll) {
                map.set(key, [item[index + 1]]);
            } else {
                coll.push(item[index + 1]);
            }
        });
        return map;
    }

    function unwindMap(list) {
        const result = [];
        list.forEach((value, key) => {
            result.push([key, value]);
        });
        return result;
    }

    const processDataByGroupings = (data) => {
        const fields = getAnalyticFields();
        let tIndex = fields.indexOf(profilerGroupBy[0]);
        if (tIndex === -1) return data;

        const dataMap = groupBy(data, tIndex);
        return unwindMap(dataMap);
    };

    const addNewFilter = (type) => {
        const mFilters = { ...analytic }.filters;
        if (type == 0) {
            mFilters.push({ type: 'simple', value: '', field: '', operator: '' });
        } else {
            mFilters.push({ type: 'script', value: '' });
        }
        setAnalytic('filters', mFilters);
    };

    const updateFilterField = (attribute, value, index) => {
        const mFilters = { ...analytic }.filters;
        mFilters[index][attribute] = value;
        setAnalytic('filters', mFilters);
        //getFieldSuggestions(mFilters[index]['field']);
    };

    const removeFilter = (index) => {
        const mFilters = { ...analytic }.filters;
        mFilters.splice(index, 1);
        setAnalytic('filters', mFilters);
    };

    const updateAllAssets = () => {
        let activeList = [];
        if (!enableAll) activeList = assets.map((asset) => asset.uuid);
        setAnalytic('asset_control', activeList);
    };

    const updateActiveAsset = (uuid, state) => {
        const activeList = { ...analytic }.asset_control;
        if (state) {
            if (activeList.indexOf(uuid) === -1) activeList.push(uuid);
        } else {
            let index = activeList.indexOf(uuid);
            if (index > -1) activeList.splice(index, 1);
        }
        setAnalytic('asset_control', activeList);
    };

    // API
    const profileAnalytic = async () => {
        if (!analytic?.code) return;
        try {
            setProfilerLoading(true);
            setTab(analytic.category == 'asset' ? 2 : 1);
            setTabProfiler(0);
            const response = await postProfileAnalytic(analytic);
            setProfilerData(response.data);
        } catch (error) {
            setError('Error on profilling.', error.message);
        } finally {
            setProfilerLoading(false);
        }
    };

    const fetchFields = async (datasources) => {
        if (!datasources) return;
        let allDataSourceFields = [];

        for (let ds of datasources) {
            try {
                const response = await getFields(ds);
                allDataSourceFields = [...allDataSourceFields, ...response.data];
            } catch (error) {
                setError("Coudln't retrieve datasource fields.", error.message);
            }
        }
        allDataSourceFields = allDataSourceFields.filter((f, index) => allDataSourceFields.findIndex((i) => i.field == f.field) == index);
        allDataSourceFields.unshift({ field: 'ALL', type: 'keyword' });
        setFields(allDataSourceFields);
    };

    const fetchAssets = async () => {
        try {
            const response = await getAssets({ nameOnly: true });
            setAssets(response.data);
        } catch (error) {
            setError('', error.message);
        }
    };

    // Hooks
    useEffect(() => {
        if (!open) {
            setProfilerData(profilerProp);
            setTab(0);
        }

        if (!analytic) return;
        getDatasources()
            .then((response) => setDataSources(response.data.map((d) => d.name)))
            .catch((error) => console.log(error.message));
        fetchFields(analytic.datasources);

        if (analytic.category == 'asset') fetchAssets();
    }, [open]);

    // useEffect(() => {
    //     if (!profilerData.base.length > 0 && !profilerData.latest.length > 0) return;
    //     setTab(analytic.category == 'asset' ? 2 : 1);
    //     setTabProfiler(0);
    // }, [profilerData]);

    useEffect(() => {
        if (!analytic) return;
        updateAllAssets();
    }, [enableAll]);

    if (analytic == undefined) return <></>;

    const isAssetType = analytic.category == 'asset';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm">
            <DialogContent sx={{ minWidth: '700px' }}>
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={handleTabChange}>
                        <Tab label="Analytic" {...a11yProps(0)} />
                        {isAssetType && <Tab label="Asset Control" {...a11yProps(1)} />}
                        <Tab label="Profiler" {...a11yProps(isAssetType ? 2 : 1)} />
                    </Tabs>
                </Box>
                <TabPanel value={tab} index={0}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Name</HTypography>
                                <TextField id="analytic-name" name="name" size="small" value={analytic.name} onChange={handleUpdate} />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Code</HTypography>
                                <TextField
                                    id="analytic-code"
                                    name="code"
                                    size="small"
                                    value={analytic.code}
                                    disabled={action == 'edit'}
                                    onChange={handleUpdate}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                        <FormControl fullWidth>
                            <HTypography variant="h6">Description</HTypography>
                            <TextField
                                id="analytic-description"
                                name="description"
                                size="small"
                                multiline
                                value={analytic.description}
                                onChange={handleUpdate}
                            />
                        </FormControl>
                    </Grid>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Datasources</HTypography>
                                <Select
                                    id="analytic-datasource"
                                    name="datasources"
                                    multiple
                                    size="small"
                                    value={analytic.datasources}
                                    onChange={(e) => handleDatasourceChange(e.target.value)}
                                    input={<OutlinedInput id="select-multiple-chip" label="Datasource" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip size="small" key={value} label={value} />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {dataSources.map((ds) => (
                                        <MenuItem key={ds} value={ds}>
                                            {ds}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Type</HTypography>
                                <Select
                                    id="analytic-category"
                                    name="category"
                                    size="small"
                                    value={analytic.category}
                                    onChange={handleUpdate}
                                >
                                    {analyticType.map((ds) => (
                                        <MenuItem key={ds} value={ds}>
                                            {capitalizeWord(ds)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl fullWidth>
                                <HTypography variant="h6">Timeframe</HTypography>
                                <Select
                                    id="analytic-timeframe"
                                    name="timeframe"
                                    size="small"
                                    value={analytic.timeframe}
                                    onChange={handleUpdate}
                                >
                                    {timeframeList.map((ds) => (
                                        <MenuItem key={ds} value={ds}>
                                            {ds}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, mb: 1 }}>
                        <FormControl fullWidth>
                            <HTypography variant="h6">Fields</HTypography>
                            <Autocomplete
                                multiple
                                id="analytic-fields"
                                size="small"
                                options={[...fields].splice(1).map((o) => o.field)}
                                getOptionLabel={(option) => option}
                                defaultValue={[]}
                                value={analytic.fields}
                                onChange={(e, value) => setAnalytic('fields', value)}
                                renderInput={(params) => <TextField {...params} label="" placeholder="Fields" />}
                            />
                        </FormControl>
                    </Grid>
                    <Grid container sx={{ mt: 2, mb: 1 }}>
                        <FormControl fullWidth>
                            <Typography variant="h6">Filters</Typography>
                            {analytic.filters.map((f, index) => (
                                <Filter
                                    key={`filter-${index}`}
                                    filter={f}
                                    index={index}
                                    // size={filters.length}
                                    fields={fields}
                                    handleUpdate={updateFilterField}
                                    handleRemove={removeFilter}
                                />
                            ))}
                            <Grid container sx={{ mt: 1 }} direction="row" justifyContent="center" alignItems="center">
                                <BasicPopover func={addNewFilter} />
                            </Grid>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Stack>
                            <HTypography variant="h5">Options</HTypography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={analytic.issue_alert}
                                        onChange={(e) => setAnalytic('issue_alert', e.target.checked)}
                                    />
                                }
                                label="Issue an alert on deviation detection"
                            />
                        </Stack>
                    </Grid>
                </TabPanel>
                {isAssetType && (
                    <TabPanel value={tab} index={1}>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <AssetActiveTable assets={assets} active={analytic.asset_control} update={updateActiveAsset} />
                        </Grid>
                    </TabPanel>
                )}
                <TabPanel value={tab} index={isAssetType ? 2 : 1}>
                    <ComponentLoader loading={profilerLoading}>
                        {profilerData.base?.length > 0 || (profilerData.latest?.length > 0 && analytic) ? (
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                {/*                            <FormControl fullWidth>
                                <HTypography variant="h6">Group By</HTypography>
                                <Autocomplete
                                    multiple
                                    id="profiler-groupby"
                                    size="small"
                                    options={getAnalyticFields(analytic)}
                                    getOptionLabel={(option) => option}
                                    defaultValue={[]}
                                    value={profilerGroupBy}
                                    onChange={(e, value) => setProfilerGroupBy(value)}
                                    renderInput={(params) => <TextField {...params} label="" placeholder="Asset" />}
                                />
                            </FormControl>*/}
                                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                                    <Tabs value={tabProfiler} onChange={handleTabProfilerChange}>
                                        <Tab label={`Baseline (${profilerData?.base?.length})`} {...a11yProps(0)} />
                                        <Tab label={`Latest (${profilerData?.latest?.length})`} {...a11yProps(1)} />
                                        <Tab label={`Deviations (${profilerData?.deviations?.length})`} {...a11yProps(2)} />
                                    </Tabs>
                                </Box>
                                <TabPanel value={tabProfiler} index={0}>
                                    <FormControl fullWidth>
                                        <DynamicTable
                                            data={processDataByGroupings(profilerData.base)}
                                            cells={getAnalyticFields(analytic)}
                                        />
                                    </FormControl>
                                </TabPanel>
                                <TabPanel value={tabProfiler} index={1}>
                                    {profilerData?.latest?.length > 0 ? (
                                        <FormControl fullWidth>
                                            <DynamicTable data={profilerData.latest} cells={getAnalyticFields(analytic)} />
                                        </FormControl>
                                    ) : (
                                        <NoData />
                                    )}
                                </TabPanel>
                                <TabPanel value={tabProfiler} index={2}>
                                    {profilerData?.latest?.length > 0 ? (
                                        <FormControl fullWidth>
                                            <DynamicTable data={profilerData.deviations} cells={getAnalyticFields(analytic)} />
                                        </FormControl>
                                    ) : (
                                        <NoData />
                                    )}
                                </TabPanel>
                            </Grid>
                        ) : (
                            <Grid display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2, height: '500px' }}>
                                <SearchOffIcon style={{ color: 'gray' }} />
                                <Typography style={{ color: 'gray' }} variant="body1">
                                    No profiler information
                                </Typography>
                            </Grid>
                        )}
                    </ComponentLoader>
                </TabPanel>
            </DialogContent>
            <DialogActions style={{ justifyContent: 'space-between' }}>
                {action !== 'new' && <Button onClick={remove}>Delete</Button>}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {isAssetType && tab === 1 && (
                        <Button onClick={() => setEnableAll(!enableAll)}>{`${enableAll ? 'Enable' : 'False'} All`}</Button>
                    )}
                    <Button onClick={profileAnalytic} disabled={profilerLoading}>
                        Preview
                    </Button>
                    <Button onClick={save}>Save</Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
