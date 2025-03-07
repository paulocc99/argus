import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
    Grid,
    Stack,
    Typography,
    Button,
    Alert,
    AlertTitle,
    OutlinedInput,
    Box,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    Chip,
    TextField,
    Fab
} from '@mui/material';

import UploadIcon from '@mui/icons-material/Upload';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

import ComponentSkeleton from 'common/ComponentSkeleton';
import MainCard from 'components/cards/MainCard';
import ComponentLoader from 'components/ComponentLoader';
import ConfirmationDialog from 'components/ConfirmationDialog';
import NoData from 'components/NoData';
import { fabStyle } from 'themes/other';
import { setError, setSuccess, capitalizeWords } from 'utils';
import {
    getDatasources,
    deleteRule,
    getAlerts,
    getATTACKTactics,
    getFields,
    getFieldSuggestions,
    getRule,
    postPreviewRule,
    postRule,
    postSigmaConvertion,
    updateRule
} from 'api';
import RuleAlertTable from './RuleAlertTable';
import { RuleEQLBuilder, RuleThresholdBuilder, Trigger } from './common';
import RuleATTACKDialog from './RuleAttackDialog';
import RuleProfilerDialog from './RuleProfilerDialog';
import AlertDialog from '../alerts/AlertDialog';

const EQLQuerBuilderOptions = ['Builder', 'Raw'];
const triggerTypes = [
    { value: 'periodic', preview: 'Periodic' },
    { value: 'rule', preview: 'Rule Alert' }
];
const ruleTypes = [
    { value: 'threshold', preview: 'Threshold' },
    { value: 'eql', preview: 'EQL' }
];

const tsList = ['5m', '10m', '30m', '1h', '12h', '1d', '3d', '1w', '1M', 'always'];

const rulePlaceholder = {
    type: '',
    timeframe: '',
    trigger: { type: '', value: '' },
    intelligence: { action: '', note: '' }
};

function Rule() {
    const navigate = useNavigate();
    const params = useParams();

    // Data
    const [dataSources, setDataSources] = useState([]);
    const [profiler, setProfiler] = useState(false);
    const [groupings, setGroupings] = useState([]);
    const [conditions, setConditions] = useState({ alarm: [], alert: [] });
    const [filters, setFilters] = useState([]);
    const [fields, setFields] = useState([]);
    const [suggestions, setSuggestions] = useState({});
    const [deleteDialog, setDeleteDialog] = useState(false);

    // Preview
    const [previewLoading, setPreviewLoading] = useState(false);
    const [queryOutput, setQueryOutput] = useState('');
    const [alertList, setAlerts] = useState([]);
    const [alarmList, setAlarms] = useState([]);

    // EQL
    const [EQLBuilder, setEQLBuilder] = useState('Raw');
    const [ruleEQLQuery, setRuleEQLQuery] = useState('');
    const [selections, setSelections] = useState([]);
    const [alertType, setAlertType] = useState('alert');

    // Alerts
    const [ruleAlerts, setRuleAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState();
    const [alertDialog, setAlertDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // Rule attributes
    const [ruleData, setRuleData] = useState(rulePlaceholder);
    const [ruleDatasource, setRuleDatasource] = useState([]);

    // ATT&CK
    const [attackDialog, setATTACKDialog] = useState(false);
    const [attackTactics, setATTACKTactics] = useState([]);
    const [attackTechniques, setATTACKTechniques] = useState([]);
    const [attackSelected, setATTACKSelected] = useState({ tactics: [], techniques: [] });

    // Handlers
    const handleRuleUpdate = (e) => {
        setRuleData({ ...ruleData, [e.target.name]: e.target.value });
    };

    const handlePageChange = (e, value) => {
        setPage(value);
    };

    const handleAlertSelection = (alert) => {
        setSelectedAlert(alert);
        setAlertDialog(true);
    };

    const updateFilterField = (attribute, value, index) => {
        const mFilters = [...filters];
        mFilters[index][attribute] = value;
        setFilters(mFilters);
        fetchFieldSuggestions(mFilters[index]['field']);
    };

    const updateSelField = (attribute, value, index) => {
        const mSel = [...selections];
        mSel[index][attribute] = value;
        setSelections(mSel);
        fetchFieldSuggestions(mSel[index]['field']);
    };

    const confirmRuleDelete = () => {
        setDeleteDialog(true);
    };

    // Conditions
    const updateConditionField = (attribute, value, index, type) => {
        const currentConditions = { ...conditions };
        currentConditions[type][index][attribute] = value;
        setConditions(currentConditions);
    };

    const addNewCondition = (type) => {
        const currentConditions = { ...conditions };
        currentConditions[type].push({
            function: '',
            field: '',
            operator: '>',
            limit: 0,
            logic: currentConditions[type].length > 0 ? 'AND' : 'AND'
        });
        setConditions(currentConditions);
    };

    const removeCondition = (index, type) => {
        const currentConditions = { ...conditions };
        currentConditions[type].splice(index, 1);
        setConditions(currentConditions);
    };

    // Filter
    const addNewFilter = (type) => {
        const mFilters = [...filters];
        if (type == 0) {
            mFilters.push({ type: 'simple', value: '', field: '', operator: '' });
        } else {
            mFilters.push({ type: 'script', value: '' });
        }
        setFilters(mFilters);
    };

    const addNewSel = () => {
        const mSelections = [...selections];
        mSelections.push({ field: '', operator: '', value: '' });
        setSelections(mSelections);
    };

    const removeFilter = (index) => {
        const mFilters = [...filters];
        mFilters.splice(index, 1);
        setFilters(mFilters);
    };

    const handleGroupings = (e, value) => {
        setGroupings(value);
    };

    // ATTACK
    const isSelected = (type, id) => {
        return attackSelected[type].map((e) => e.id).includes(id);
    };

    const profilerName = ruleData.type == 'eql' ? 'Lookup' : 'Profiler';

    const updateTechniquesList = (tacticId) => {
        const tactic = attackTactics.find((t) => t.id == tacticId);
        if (!tactic) return;

        let availableTechniques = [...attackTechniques];
        tactic.techniques.forEach((t) => {
            if (availableTechniques.filter((ct) => ct.id === t.id).length === 0) {
                availableTechniques.push(t);
            } else {
                availableTechniques = availableTechniques.filter((ct) => ct.id !== t.id);
            }
        });
        setATTACKTechniques(availableTechniques);
    };

    const handleTacticSel = (t) => {
        const { id } = t;
        const current = { ...attackSelected };
        if (current.tactics.map((e) => e.id).includes(id)) {
            let index = current.tactics.map((e) => e.id).indexOf(id);
            current.tactics.splice(index, 1);
        } else {
            current.tactics.push(t);
        }
        setATTACKSelected(current);

        // update techniques list
        updateTechniquesList(id);
    };

    const handleTechniqueSel = (t) => {
        const { id } = t;
        const current = { ...attackSelected };
        if (current.techniques.map((e) => e.id).includes(id)) {
            let index = current.techniques.map((e) => e.id).indexOf(id);
            current.techniques.splice(index, 1);
        } else {
            current.techniques.push(t);
        }
        setATTACKSelected(current);
    };

    // API
    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            const ds = response.data.map((e) => e.name);
            setDataSources([...ds, 'ALL']);
        } catch (error) {
            setError(error, "Couldn't retrieve datasources");
        }
    };

    const previewRule = async () => {
        setPreviewLoading(true);
        if (queryOutput) setQueryOutput('');
        setAlerts([]);
        setAlarms([]);

        try {
            const postData = {
                //groupby: groupings.length > 0 ? groupings.map((g) => g.field) : [],
                datasources: ruleDatasource,
                timeframe: ruleData.timeframe,
                type: ruleData.type.toLowerCase()
            };

            if (ruleData.type == 'eql') {
                postData.alert_type = alertType;
                postData.query = ruleEQLQuery;
            } else if (ruleData.type == 'threshold') {
                postData.group_by = groupings;
                postData.filters = filters;
                postData.conditions = conditions;
            }

            const response = await postPreviewRule(postData);
            const { result, output } = response.data;
            setQueryOutput(JSON.stringify(output, null, 2));
            setAlerts(result.alert ? result.alert : []);
            setAlarms(result.alarm ? result.alarm : []);
        } catch (error) {
            setError(error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleFormSubmit = async () => {
        try {
            let attackData = { ...attackSelected };
            attackData.tactics = attackData.tactics.map((t) => t.id);
            attackData.techniques = attackData.techniques.map((t) => t.id);

            let postData = {
                ...ruleData,
                datasources: ruleDatasource,
                type: ruleData.type.toLowerCase(),
                risk: parseInt(ruleData.risk),
                attack: attackData
            };
            if (ruleData.type == 'eql') {
                postData = {
                    ...postData,
                    alert_type: alertType,
                    query: ruleEQLQuery
                };
            } else if (ruleData.type == 'threshold') {
                postData = {
                    ...postData,
                    group_by: groupings,
                    filters: filters,
                    conditions: conditions
                };
            }

            if (params.id) {
                await updateRule(params.id, postData);
            } else {
                await postRule(postData);
                navigate('/rules');
            }
            setSuccess(`Rule ${params.id ? 'Updated' : 'Created'}`);
        } catch (error) {
            setError(error, `Error on rule ${params.id ? 'update' : 'creation'}`);
        }
    };

    const fetchFields = async () => {
        let allDataSourceFields = [];
        try {
            for (let ds of ruleDatasource) {
                const response = await getFields(ds);
                allDataSourceFields = [...allDataSourceFields, ...response.data];
            }
        } catch (error) {
            setError(error, "Couldn't retrieve datasource fields");
        } finally {
            allDataSourceFields = allDataSourceFields.filter(
                (f, index) => allDataSourceFields.findIndex((i) => i.field == f.field) == index
            );
            allDataSourceFields.unshift({ field: 'ALL', type: 'keyword' });
            setFields(allDataSourceFields);
        }
    };

    const fetchFieldSuggestions = async (field) => {
        const response = await getFieldSuggestions(field);
        let sugg = { ...suggestions };
        sugg[field] = response.data;
        setSuggestions(sugg);
    };

    const getRuleByUUID = async (id) => {
        const response = await getRule(id);
        const ruleData = response.data;
        const { datasources, filters, conditions, attack } = ruleData;

        setRuleData(ruleData);
        setRuleDatasource(datasources);
        setFilters(filters);
        setConditions(conditions);
        setGroupings(ruleData.group_by);

        if (ruleData.type == 'eql') {
            setEQLBuilder('Raw');
            setAlertType(ruleData.alert_type);
            setRuleEQLQuery(ruleData.query);
        }

        if (attack) {
            setATTACKSelected(attack);
        }
    };

    const getAlertsByRule = async (id) => {
        try {
            const response = await getAlerts({ rule: id, page: page });
            const { alerts, pages } = response.data;
            setRuleAlerts(alerts);
            setPages(pages);
        } catch (error) {
            setError(error, "Couldn't retrieve rule alerts");
        }
    };

    const handleRuleFileUpload = async (e) => {
        try {
            const formData = new FormData();
            formData.append('rule', e.target.files[0]);

            const response = await postSigmaConvertion(formData);
            const rule = response.data;
            setRuleEQLQuery(rule.query);
            setRuleDatasource(rule.datasources);
            setEQLBuilder('Raw');
            setSuccess('Sigma rule converted successfully');
        } catch (error) {
            setError(error, 'Unsupported Sigma format');
        }
    };

    const removeRule = async () => {
        try {
            if (!params.id) return;
            await deleteRule(params.id);
            navigate('/rules');
            setSuccess('Rule deleted');
        } catch (error) {
            setError(error, 'Error on rule deletion');
        }
    };

    const fetchATTACKTTPs = async () => {
        try {
            const response = await getATTACKTactics('ics', true);
            const { tactics } = response.data;
            setATTACKTactics(tactics);
        } catch (error) {
            setError(error, "Couldn't retrieve ATT&CK tactics");
        }
    };

    // Hooks
    useEffect(() => {
        if (ruleDatasource.length > 0) {
            fetchFields();
        }
    }, [ruleDatasource]);

    useEffect(() => {
        const { id } = params;
        if (id !== undefined) {
            getRuleByUUID(id);
            getAlertsByRule(id);
        }
        fetchATTACKTTPs();
        fetchDataSources();
    }, []);

    useEffect(() => {
        attackSelected.tactics.forEach((tactic) => {
            updateTechniquesList(tactic.id);
        });
    }, [attackTactics]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <Stack spacing={3}>
                        <MainCard title={params.id ? 'Edit Rule' : 'Add New Rule'}>
                            <Box sx={{ minWidth: 120 }}>
                                <Stack spacing={3}>
                                    <TextField id="rule-name" name="name" label="Name" value={ruleData.name} onChange={handleRuleUpdate} />
                                    <TextField
                                        id="rule-description"
                                        name="description"
                                        label="Description"
                                        multiline
                                        maxRows={4}
                                        value={ruleData.description}
                                        onChange={handleRuleUpdate}
                                    />
                                    <Stack direction="row" spacing={2}>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth>
                                                <InputLabel id="rule-ds-label" sx={{ overflow: 'visible' }}>
                                                    Datasource
                                                </InputLabel>
                                                <Select
                                                    id="rule-datasource"
                                                    labelId="rule-ds-label"
                                                    name="datasource"
                                                    multiple
                                                    size="small"
                                                    value={ruleDatasource}
                                                    onChange={(e) => setRuleDatasource(e.target.value)}
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
                                                <TextField
                                                    id="rule-risk"
                                                    name="risk"
                                                    label="Risk Score"
                                                    size="small"
                                                    value={ruleData.risk}
                                                    onChange={handleRuleUpdate}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <FormControl fullWidth>
                                                <InputLabel id="rule-tf-label">Timeframe</InputLabel>
                                                <Select
                                                    id="rule-tf"
                                                    labelId="rule-tf-label"
                                                    name="timeframe"
                                                    size="small"
                                                    value={ruleData.timeframe}
                                                    onChange={handleRuleUpdate}
                                                >
                                                    {tsList.map((ds) => (
                                                        <MenuItem key={ds} value={ds}>
                                                            {ds}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Stack>
                                    <Typography variant="h6">Trigger</Typography>
                                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                        <Grid item xs={3}>
                                            <FormControl fullWidth>
                                                <InputLabel id="trigger-type-label" sx={{ overflow: 'visible' }}>
                                                    Type
                                                </InputLabel>
                                                <Select
                                                    id="trigger-type"
                                                    labelId="trigger-type-label"
                                                    size="small"
                                                    value={ruleData.trigger?.type}
                                                    onChange={(e) =>
                                                        setRuleData({ ...ruleData, trigger: { type: e.target.value, value: '' } })
                                                    }
                                                >
                                                    {triggerTypes.map((t) => (
                                                        <MenuItem key={t.value} value={t.value}>
                                                            {t.preview}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Trigger trigger={ruleData.trigger} update={(t) => setRuleData({ ...ruleData, trigger: t })} />
                                    </Stack>
                                    <Typography variant="h6">Rule Type</Typography>
                                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                        <Grid item xs={3}>
                                            <FormControl fullWidth>
                                                <InputLabel id="rule-type-label" sx={{ overflow: 'visible' }}>
                                                    Type
                                                </InputLabel>
                                                <Select
                                                    id="rule-type"
                                                    labelId="rule-type-label"
                                                    name="type"
                                                    size="small"
                                                    value={ruleData.type}
                                                    onChange={handleRuleUpdate}
                                                >
                                                    {ruleTypes.map((t) => (
                                                        <MenuItem key={t.value} value={t.value}>
                                                            {t.preview}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {ruleData.type == 'eql' && (
                                            <Grid item xs={2}>
                                                <FormControl fullWidth>
                                                    <InputLabel id="rule-eql-build-label" sx={{ overflow: 'visible' }}>
                                                        EQL Builder
                                                    </InputLabel>
                                                    <Select
                                                        labelId="rule-eql-build-label"
                                                        id="rule-eql-build"
                                                        size="small"
                                                        value={EQLBuilder}
                                                        onChange={(event) => setEQLBuilder(event.target.value)}
                                                    >
                                                        {EQLQuerBuilderOptions.map((r) => (
                                                            <MenuItem key={r} value={r}>
                                                                {r}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        )}
                                    </Stack>
                                    <RuleThresholdBuilder
                                        type={ruleData.type}
                                        fields={fields}
                                        filters={filters}
                                        addFilter={addNewFilter}
                                        updateFilter={updateFilterField}
                                        removeFilter={removeFilter}
                                        groupings={groupings}
                                        updateGroupings={handleGroupings}
                                        conditions={conditions}
                                        addCondition={addNewCondition}
                                        updateCondition={updateConditionField}
                                        removeCondition={removeCondition}
                                    />
                                    <RuleEQLBuilder
                                        type={ruleData.type}
                                        query={ruleEQLQuery}
                                        updateQuery={(e) => setRuleEQLQuery(e.target.value)}
                                        builder={EQLBuilder}
                                    />
                                </Stack>
                                <Grid container justifyContent="space-between" sx={{ mt: 2 }}>
                                    {params.id ? (
                                        <Button color="error" variant="outlined" component="label" onClick={confirmRuleDelete}>
                                            Delete
                                        </Button>
                                    ) : (
                                        <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                            Upload
                                            <input hidden type="file" onChange={handleRuleFileUpload} />
                                        </Button>
                                    )}
                                    <Stack direction="row" spacing={2}>
                                        {/*                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<TroubleshootIcon />}
                                            onClick={() => setProfiler(true)}
                                        >
                                            {profilerName}
                                        </Button>*/}
                                        <Button variant="contained" onClick={previewRule}>
                                            Preview
                                        </Button>
                                        <Button variant="contained" onClick={handleFormSubmit} sx={{ ml: 2, mr: 2 }}>
                                            {params.id ? 'Update' : 'Create'}
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Box>
                        </MainCard>
                    </Stack>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Grid sx={{ mb: 1 }} item>
                        <Typography variant="h5">Intelligence</Typography>
                    </Grid>
                    <MainCard>
                        <Stack spacing={3}>
                            <Typography variant="h6">ATT&CK ICS</Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={attackSelected.tactics.length > 1 ? 6 : 4}>
                                    <FormControl fullWidth>
                                        <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>
                                            Tactics
                                        </Typography>
                                        <Select
                                            id="attack-tactic"
                                            multiple
                                            size="small"
                                            value={attackSelected.tactics}
                                            onChange={(e) => {
                                                setATTACKSelected({ ...attackSelected, tactics: e.target.value });
                                            }}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip size="small" key={value.id} label={capitalizeWords(value.name)} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {attackTactics.map((t) => (
                                                <MenuItem key={t.name} value={t}>
                                                    {capitalizeWords(t.name)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={attackSelected.techniques.length > 2 ? 6 : 4}>
                                    <FormControl fullWidth>
                                        <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>
                                            Techniques
                                        </Typography>
                                        <Select
                                            id="attack-techniques"
                                            multiple
                                            size="small"
                                            value={attackSelected.techniques}
                                            onChange={(e) => {
                                                setATTACKSelected({ ...attackSelected, techniques: e.target.value });
                                            }}
                                            // input={<OutlinedInput id="technique-chip" label="Techniques" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip size="small" key={value.id} label={value.name} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {attackTechniques.map((t) => (
                                                <MenuItem key={t.name} value={t}>
                                                    {capitalizeWords(t.name)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Button onClick={() => setATTACKDialog(true)}>More</Button>
                            </Stack>
                            <TextField
                                id="intelligence-note"
                                label="Custom Note"
                                multiline
                                minRows={2}
                                maxRows={10}
                                // defaultValue={''}
                                value={ruleData.intelligence?.note}
                                onChange={(e) =>
                                    setRuleData({ ...ruleData, intelligence: { ...ruleData.intelligence, note: e.target.value } })
                                }
                            />
                            <TextField
                                id="intelligence-action"
                                label="Policy Action"
                                multiline
                                minRows={2}
                                maxRows={10}
                                value={ruleData.intelligence?.action}
                                onChange={(e) =>
                                    setRuleData({ ...ruleData, intelligence: { ...ruleData.intelligence, action: e.target.value } })
                                }
                            />
                        </Stack>
                    </MainCard>
                    {params.id && (
                        <>
                            <Grid sx={{ mb: 1, mt: 2 }} item>
                                <Typography variant="h5">History</Typography>
                            </Grid>
                            <MainCard content={false}>
                                {ruleAlerts.length > 0 ? (
                                    <RuleAlertTable
                                        alerts={ruleAlerts}
                                        page={page}
                                        pagesNumber={pages}
                                        pChange={handlePageChange}
                                        select={handleAlertSelection}
                                    />
                                ) : (
                                    <NoData height="80px" message="There is no alerts at this time." />
                                )}
                            </MainCard>
                        </>
                    )}
                    <ComponentLoader height="200px" loading={previewLoading}>
                        {queryOutput.length > 0 && (
                            <MainCard sx={{ mt: 2 }} title="Preview">
                                {queryOutput.length > 0 && alertList.length == 0 && alarmList.length == 0 ? (
                                    <Alert severity="error">No alerts/alarms were triggered.</Alert>
                                ) : null}
                                {alertList.map((alert) => (
                                    <Alert severity="success" sx={{ mt: 1 }}>
                                        <AlertTitle>New Alert</AlertTitle>
                                        {alert.groupby ? `[${alert.groupby}] | ` : ''}
                                        {alert.result}
                                    </Alert>
                                ))}
                                {alarmList.map((alarm) => (
                                    <Alert severity="success" sx={{ mt: 1 }}>
                                        <AlertTitle>New Alarm</AlertTitle>
                                        {alarm.groupby ? `[${alarm.groupby}] | ` : ''}
                                        {alarm.result}
                                    </Alert>
                                ))}
                            </MainCard>
                        )}
                    </ComponentLoader>
                </Grid>
            </Grid>
            <RuleATTACKDialog
                open={attackDialog}
                close={() => setATTACKDialog(false)}
                tactics={attackTactics}
                techniques={attackTechniques}
                updateTactic={handleTacticSel}
                updateTechnique={handleTechniqueSel}
                isSelected={isSelected}
            />
            <RuleProfilerDialog
                open={profiler}
                close={() => setProfiler(false)}
                title={profilerName}
                ruleType={ruleData.type}
                fields={fields}
                ds={ruleData.datasources}
                filters={filters}
                conditions={conditions}
                query={ruleEQLQuery}
            />
            <ConfirmationDialog
                title={ruleData?.name}
                content="Are you sure you want to delete this rule?"
                btn="Delete"
                color="error"
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={removeRule}
            />
            <AlertDialog alert={selectedAlert} open={alertDialog} close={() => setAlertDialog(false)} />
            <Fab color="primary" onClick={() => setProfiler(true)} sx={fabStyle}>
                <TroubleshootIcon />
            </Fab>
        </ComponentSkeleton>
    );
}

export default Rule;
