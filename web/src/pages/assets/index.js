import { Grid, Stack, Typography, MenuItem, Button } from '@mui/material';
import { useState, useEffect } from 'react';

import { getAssets, getAssetSettings, getDatasources, updateAsset, updateAssetSettings } from 'api';
import { capitalizeWord, setError, setSuccess, n } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import { noneObject, managedList } from 'common/List';
import { filterTextStyle } from 'themes/other';
import FilterTextField from 'components/FilterTextField';
import MainCard from 'components/cards/MainCard';
import AssetTable from './AssetTable';
import AssetDialog from './AssetDialog';
import SubnetDialog from './SubnetDialog';

const Assets = () => {
    const [dataSources, setDataSources] = useState([noneObject]);
    const [datasourceFilter, setDatasourceFilter] = useState('none');
    const [managedFilter, setManagedFilter] = useState('none');
    const [subnetFilter, setSubnetFilter] = useState('none');

    const [selectedAsset, setSelectedAsset] = useState(undefined);
    const [assetList, setAssetList] = useState([]);
    const [assetCount, setAssetCount] = useState(0);
    const [subnets, setSubnets] = useState([]);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [dOpen, setDOpen] = useState(false);
    const [sOpen, setSOpen] = useState(false);

    // Handlers
    const handleClose = () => {
        setDOpen(false);
        setSelectedAsset(undefined);
    };

    const handlePageChange = (e, value) => {
        setPage(value);
    };

    const updateSelAsset = (attr, value) => {
        const sel = { ...selectedAsset };
        sel[attr] = value;
        setSelectedAsset(sel);
    };

    const addSubnet = () => {
        setSubnets([...subnets, '']);
    };

    const removeSubnet = (index) => {
        const subs = [...subnets];
        subs.splice(index, 1);
        setSubnets(subs);
    };

    const handleSubnetValue = (index, value) => {
        const subs = [...subnets];
        subs[index] = value;
        setSubnets(subs);
    };

    // API
    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            const ds = response.data.filter((e) => e.name !== 'baseline').map((e) => ({ value: e.name, label: capitalizeWord(e.name) }));
            setDataSources([...ds, ...dataSources]);
        } catch (error) {
            setError(error);
        }
    };

    const fetchAssets = async () => {
        try {
            const params = {
                page: page,
                managed: n(managedFilter),
                datasource: n(datasourceFilter),
                subnet: n(subnetFilter)
            };
            const response = await getAssets(params);
            const { assets, size, pages } = response.data;
            setAssetList(assets);
            setAssetCount(size);
            setPages(pages);
        } catch (error) {
            setError(error, "Couldn't retrieve assets information");
        }
    };

    const fetchAssetSettings = async () => {
        try {
            const response = await getAssetSettings();
            setSubnets(response.data.subnets);
        } catch (error) {
            setError(error);
        }
    };

    const postAssetSettings = async () => {
        try {
            await updateAssetSettings(subnets);
            setSuccess('Monitoring subnets updated');
            setSOpen(false);
        } catch (error) {
            setError(error);
        }
    };

    const postAsset = async () => {
        try {
            await updateAsset(selectedAsset);
            setSuccess('Asset information updated');
            setDOpen(false);
            fetchAssets();
        } catch (error) {
            setError(error);
        }
    };

    // Hooks
    useEffect(() => {
        fetchAssets();
    }, [, managedFilter, datasourceFilter, subnetFilter, page]);

    useEffect(() => {
        fetchDataSources();
        fetchAssetSettings();
    }, []);

    useEffect(() => {
        if (selectedAsset) setDOpen(true);
    }, [selectedAsset]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">{`Assets (${assetCount})`}</Typography>
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            <Button size="small" variant="contained" onClick={() => setSOpen(true)}>
                                Edit Subnets ({subnets.length})
                            </Button>
                            <FilterTextField
                                id="asset-managed-filter"
                                size="small"
                                label="Managed"
                                select
                                value={managedFilter}
                                onChange={(e) => setManagedFilter(e.target.value)}
                                sx={filterTextStyle}
                            >
                                {managedList.map((option) => (
                                    <MenuItem key={`managed-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="asset-datasource-filter"
                                size="small"
                                label="Datasource"
                                select
                                value={datasourceFilter}
                                onChange={(e) => setDatasourceFilter(e.target.value)}
                                sx={filterTextStyle}
                            >
                                {dataSources.map((option) => (
                                    <MenuItem key={`ds-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="asset-subnet-filter"
                                size="small"
                                label="Subnet"
                                select
                                value={subnetFilter}
                                onChange={(e) => setSubnetFilter(e.target.value)}
                                sx={filterTextStyle}
                            >
                                {[...subnets, 'none'].map((option) => (
                                    <MenuItem key={`subnet-${option}`} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <AssetTable
                            assets={assetList}
                            updateSelected={setSelectedAsset}
                            page={page}
                            pagesNumber={pages}
                            hChange={handlePageChange}
                            updateState={postAsset}
                        />
                    </MainCard>
                </Grid>
            </Grid>
            <AssetDialog asset={selectedAsset} update={postAsset} updateSelAsset={updateSelAsset} open={dOpen} handleClose={handleClose} />
            <SubnetDialog
                open={sOpen}
                subnets={subnets}
                hSubnetValue={handleSubnetValue}
                add={addSubnet}
                remove={removeSubnet}
                update={postAssetSettings}
                handleClose={() => setSOpen(false)}
            />
        </ComponentSkeleton>
    );
};

export default Assets;
