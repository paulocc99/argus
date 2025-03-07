import { useState, useEffect } from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Autocomplete,
    TextField
} from '@mui/material';

import ProfilerChart from 'components/ProfilerChart';
import ComponentLoader from 'components/ComponentLoader';
import NoData from 'components/NoData';

import { functionList, profillerTsList } from 'common/List';
import { postFieldProfiler, postLookupRule } from 'api';
import { setError } from 'utils';

function RuleProfilerDialog(props) {
    const { open, close, title, ruleType, fields, ds, filters, conditions, query } = props;

    const [pFunction, setPFunction] = useState('count');
    const [field, setField] = useState({ field: 'ALL', value: 'ALL' });
    const [timeframe, setTimeframe] = useState('week');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fieldProfilling = async () => {
        setLoading(true);
        try {
            const postData = {
                field: field.field,
                func: pFunction,
                ts: timeframe,
                datasources: ds,
                filters: filters
            };
            const response = await postFieldProfiler(postData);
            setData(response.data);
        } catch (error) {
            setError(error, 'Error on profilling');
        } finally {
            setLoading(false);
        }
    };

    const reverseLookup = async () => {
        setLoading(true);
        try {
            const postData = {
                query: query,
                datasources: ds,
                timeframe: 'always'
            };
            const response = await postLookupRule(postData);
            console.log(response.data);
            setData(response.data);
        } catch (error) {
            setError(error, 'Error on reverse lookup');
        } finally {
            setLoading(false);
        }
    };

    const profile = () => {
        if (!open) return;
        if (ruleType == 'threshold' && pFunction && field && timeframe) {
            fieldProfilling();
        } else if (ruleType == 'eql') {
            reverseLookup();
        }
    };

    useEffect(() => {
        if (open && data && data.length > 0) return;
        profile();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        profile();
    }, [pFunction, field, timeframe]);

    const minHeight = '450px';

    return (
        <Dialog open={open} onClose={close}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ minWidth: '750px', minHeight: minHeight }}>
                {ruleType == 'threshold' && (
                    <Grid container direction="row" justifyContent="left" alignItems="left" sx={{ mt: 1 }}>
                        <Grid item xs={2} sx={{ mr: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel id="profile-fn-label" sx={{ overflow: 'visible' }}>
                                    Function
                                </InputLabel>
                                <Select
                                    id="profile-fn"
                                    labelId="profile-fn-label"
                                    size="small"
                                    value={pFunction}
                                    label="Function"
                                    onChange={(e) => setPFunction(e.target.value)}
                                >
                                    {functionList.map((func) => (
                                        <MenuItem key={func} value={func}>
                                            {func}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <Autocomplete
                                disablePortal
                                id="profiler-field"
                                size="small"
                                options={
                                    ['count', 'unique'].indexOf(pFunction) === -1
                                        ? [...fields].filter((f) => ['long', 'double'].indexOf(f.type) != -1)
                                        : [...fields]
                                }
                                getOptionLabel={(option) => option.field}
                                value={field}
                                onChange={(e, value) => setField(value)}
                                renderInput={(params) => <TextField {...params} label="Field" placeholder="field" />}
                            />
                        </Grid>
                        <Grid item xs={2} sx={{ ml: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel id="tf-label" sx={{ overflow: 'visible' }}>
                                    Timeframe
                                </InputLabel>
                                <Select
                                    id="profiler-tf"
                                    labelId="tf-label"
                                    size="small"
                                    value={timeframe}
                                    onChange={(e) => setTimeframe(e.target.value)}
                                >
                                    {profillerTsList.map((ds) => (
                                        <MenuItem key={ds} value={ds}>
                                            {ds}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}
                <ComponentLoader height={minHeight} loading={loading}>
                    {data && data.length > 0 ? (
                        <ProfilerChart slot={timeframe} data={data} ranges={conditions} />
                    ) : (
                        <NoData height={minHeight} message="No data found for the selected timeframe." />
                    )}
                </ComponentLoader>
            </DialogContent>
        </Dialog>
    );
}

export default RuleProfilerDialog;
