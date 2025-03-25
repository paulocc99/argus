import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Stack,
    Button,
    FormControl,
    TextField,
    Grid,
    Select,
    MenuItem,
    Autocomplete,
    InputLabel,
    Typography
} from '@mui/material';

import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

import BasicPopover from 'components/BasicPopover';
import { getFieldSuggestions, getRules } from 'api';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { condOperList, functionList, operatorsList } from 'common/List';

const alertTypeList = [
    { value: 'alert', preview: 'Alert' },
    { value: 'alarm', preview: 'Alarm' }
];
const eqlSelValueModifiers = ['contains', 'all', 'endswith', 'startswith'];

export function RuleEQLBuilder(props) {
    const { type, builder, query, updateQuery } = props;

    const [alertType, setAlertType] = useState('alert');

    if (type != 'eql') return <></>;

    if (builder == 'Raw')
        return (
            <>
                <TextField id="eql-raw-query" label="Raw Query" multiline maxRows={20} defaultValue={query} onChange={updateQuery} />
                <Typography variant="h6">Actions</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <p>A match will trigger a</p>
                    <Grid item xs={2}>
                        <FormControl fullWidth>
                            <Select id="rule-type" size="small" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                                {alertTypeList.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.preview}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Stack>
            </>
        );
    if (builder == 'Custom')
        return (
            <>
                <FormControl fullWidth>
                    <Typography variant="h6">Group by</Typography>
                    <Autocomplete
                        multiple
                        id="eql-groupby"
                        size="small"
                        options={[...fields].splice(1).map((o) => o.field)}
                        getOptionLabel={(option) => option}
                        defaultValue={[]}
                        value={groupings}
                        onChange={handleGroupByChange}
                        renderInput={(params) => <TextField {...params} label="" placeholder="Fields" />}
                    />
                </FormControl>
                <FormControl fullWidth>
                    <Typography variant="h6">Selections</Typography>
                    {selections.map((s, index, sel) => (
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Typography sx={{ mt: 1 }} variant="h6">{`S${index}`}</Typography>
                            <Grid item xs={4}>
                                <Autocomplete
                                    disablePortal
                                    id="eql-sel-field"
                                    size="small"
                                    options={[...fields].splice(1)}
                                    getOptionLabel={(option) => option.field}
                                    value={sel}
                                    onChange={(sel, value) => updateSelField('field', value.field, index)}
                                    renderInput={(params) => <TextField {...params} label="Field" placeholder="field" />}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <FormControl fullWidth>
                                    <Select
                                        id="operation"
                                        size="small"
                                        value={sel.operator} /*  */
                                        onChange={(event) => updateSelField('operator', event.target.value, index)}
                                    >
                                        {eqlSelValueModifiers.map((oper) => (
                                            <MenuItem value={oper}>{oper}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <FormControl fullWidth>
                                    <TextField
                                        size="small"
                                        label="Value"
                                        multiline
                                        maxRows={10}
                                        defaultValue={sel.value}
                                        onBlur={(event) => updateSelField('value', event.target.value, index)}
                                    />
                                </FormControl>
                            </Grid>
                            {index + 1 == size ? (
                                <>
                                    <IconButton aria-label="remove" onClick={() => removeFilter(index)}>
                                        <RemoveCircleIcon fontSize="small" />
                                    </IconButton>
                                    <BasicPopover func={addNewSel} />
                                </>
                            ) : (
                                <IconButton aria-label="remove" onClick={() => removeFilter(index)}>
                                    <RemoveCircleIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Stack>
                    ))}
                    {selections.length == 0 ? (
                        <Grid container direction="row" justifyContent="center" alignItems="center">
                            <BasicPopover func={addNewSel} />
                        </Grid>
                    ) : null}
                </FormControl>
            </>
        );
}

export function RuleThresholdBuilder(props) {
    const {
        type,
        fields,
        filters,
        addFilter,
        updateFilter,
        removeFilter,
        groupings,
        updateGroupings,
        conditions,
        addCondition,
        updateCondition,
        removeCondition
    } = props;

    const [alertTab, setAlertTab] = useState(0);

    const handleTab = (e, value) => {
        setAlertTab(value);
    };

    if (type != 'threshold') return <></>;

    return (
        <>
            <FormControl fullWidth>
                <Typography variant="h6">Filters</Typography>
                {filters.map((f, index, filters) => (
                    <Filter
                        key={`f-${index}`}
                        filter={f}
                        index={index}
                        fields={[...fields].splice(1)}
                        handleUpdate={updateFilter}
                        handleRemove={removeFilter}
                    />
                ))}

                <Grid container direction="row" justifyContent="center" alignItems="center">
                    <BasicPopover func={addFilter} />
                </Grid>
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="h6">Group by</Typography>
                <Autocomplete
                    multiple
                    id="rule-groupings"
                    size="small"
                    options={[...fields].splice(1).map((o) => o.field)}
                    getOptionLabel={(option) => option}
                    defaultValue={[]}
                    value={groupings}
                    onChange={updateGroupings}
                    renderInput={(params) => <TextField {...params} label="" placeholder="Fields" />}
                />
            </FormControl>
            <Typography variant="h5">Conditions</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={alertTab} onChange={handleTab} aria-label="basic tabs example">
                    <Tab label="Alert" {...a11yProps(0)} />
                    <Tab label="Alarm" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <TabPanel value={alertTab} index={0}>
                {conditions.alert?.map((cond, index, conditions) => (
                    <ConditionGroup
                        key={`cond-alert-${index}`}
                        conditions={conditions}
                        condition={cond}
                        index={index}
                        type="alert"
                        fields={fields}
                        update={(p, value, i) => updateCondition(p, value, i, 'alert')}
                        remove={(i) => removeCondition(index, 'alert')}
                    />
                ))}
                <Grid container direction="row" justifyContent="center" alignItems="center">
                    <IconButton aria-label="add" color="success" onClick={() => addCondition('alert')}>
                        <AddCircleIcon />
                    </IconButton>
                </Grid>
            </TabPanel>
            <TabPanel value={alertTab} index={1}>
                {conditions.alarm?.map((cond, index, conditions) => (
                    <ConditionGroup
                        conditions={conditions}
                        condition={cond}
                        index={index}
                        type="alarm"
                        fields={fields}
                        update={(p, value, i) => updateCondition(p, value, i, 'alarm')}
                        remove={(i) => removeCondition(i, 'alarm')}
                    />
                ))}
                <Grid container direction="row" justifyContent="center" alignItems="center">
                    <IconButton aria-label="add" color="success" onClick={() => addCondition('alarm')}>
                        <AddCircleIcon />
                    </IconButton>
                </Grid>
            </TabPanel>
        </>
    );
}

export function Filter(props) {
    const { filter, index, fields, handleUpdate, handleRemove } = props;

    const [suggestions, setSuggestions] = useState([]);

    // const handleFieldSelection = (field) => {
    //     getFieldSuggestions(field)
    //         .then((response) => {
    //             const sugg = { ...suggestions };
    //             sugg[field] = response.data;
    //             console.log(sugg);
    //             setSuggestions({ ...suggestions, field: response.data });
    //         })
    //         .catch((e) => console.log(e.message));
    // };

    const handleFieldSelection = (field) => {
        getFieldSuggestions(field)
            .then((response) => {
                setSuggestions(response.data);
            })
            .catch((e) => console.log(e.message));
    };

    return (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {filter.type == 'simple' ? (
                <>
                    <Grid item xs={5}>
                        <Autocomplete
                            id="filter-field"
                            size="small"
                            disablePortal
                            options={[...fields].splice(1)}
                            getOptionLabel={(option) => option.field}
                            value={filter}
                            onChange={(event, value) => handleUpdate('field', value.field, index)}
                            renderInput={(params) => <TextField {...params} label="Field" placeholder="field" />}
                        />
                    </Grid>
                    <Grid item xs={1}>
                        <Select
                            id="filter-operation"
                            size="small"
                            value={filter.operator}
                            onChange={(event) => handleUpdate('operator', event.target.value, index)}
                        >
                            {condOperList.map((oper) => (
                                <MenuItem key={oper} value={oper}>
                                    {oper}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth>
                            <Autocomplete
                                id="filter-value"
                                size="small"
                                freeSolo
                                options={suggestions || []}
                                onOpen={() => handleFieldSelection(filter.field)}
                                onBlur={(event) => handleUpdate('value', event.target.value, index)}
                                value={filter.value}
                                renderInput={(params) => <TextField {...params} label="Value" />}
                            />
                        </FormControl>
                    </Grid>
                </>
            ) : (
                <Grid item xs={9}>
                    <FormControl fullWidth>
                        <TextField
                            defaultValue={filter.value}
                            label="Script"
                            size="small"
                            onBlur={(event) => handleUpdate('value', event.target.value, index)}
                        />
                    </FormControl>
                </Grid>
            )}
            <IconButton aria-label="remove" onClick={() => handleRemove(index)}>
                <RemoveCircleIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
}

export const Trigger = (props) => {
    const { trigger, update } = props;

    const [rules, setRules] = useState([]);

    const fetchRules = async () => {
        const response = await getRules();
        setRules(response.data);
    };

    useEffect(() => {
        if (trigger && trigger.type == 'rule' && rules.length == 0) {
            fetchRules();
        }
    }, [trigger]);

    switch (trigger.type) {
        case 'periodic':
            return (
                <Grid item xs={2}>
                    <FormControl fullWidth>
                        <TextField
                            label="Period"
                            size="small"
                            defaultValue={trigger.value}
                            onChange={(e) => update({ ...trigger, value: e.target.value })}
                        />
                    </FormControl>
                </Grid>
            );
        case 'rule':
            return (
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel id="trigger-rule" sx={{ overflow: 'visible' }}>
                            Rule
                        </InputLabel>
                        <Select
                            labelId="trigger-rule"
                            id="trigger-rule-sel"
                            size="small"
                            value={trigger.value}
                            onChange={(e) => update({ ...trigger, value: e.target.value })}
                        >
                            {rules &&
                                rules.map((r) => (
                                    <MenuItem key={r.uuid} value={r.uuid}>
                                        {r.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </Grid>
            );
        default:
            return <></>;
    }
};

export const ConditionGroup = (props) => {
    const { conditions, condition, index, fields, update, remove } = props;

    const options = useMemo(
        () =>
            condition.function.length > 0 && condition.function != 'count'
                ? [...fields].filter((f) => ['long', 'double'].indexOf(f.type) != -1)
                : [...fields],
        [fields]
    );

    return (
        <>
            <Stack direction="row" spacing={2}>
                <Grid item xs={3}>
                    <FormControl fullWidth>
                        <InputLabel id="function-label" sx={{ overflow: 'visible' }}>
                            Function
                        </InputLabel>
                        <Select
                            labelId="function-label"
                            id="cond-function"
                            size="small"
                            value={condition.function}
                            onChange={(event) => update('function', event.target.value, index)}
                        >
                            {functionList.map((func) => (
                                <MenuItem key={func} value={func}>
                                    {func}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <Autocomplete
                        disablePortal
                        id="cond-field"
                        size="small"
                        options={options}
                        getOptionLabel={(option) => option.field}
                        value={condition}
                        onChange={(event, value) => update('field', value.field, index)}
                        renderInput={(params) => <TextField {...params} label="Field" placeholder="field" />}
                    />
                </Grid>
                <Grid item xs={1}>
                    <Select
                        id="cond-operation"
                        size="small"
                        value={condition.operator}
                        onChange={(event) => update('operator', event.target.value, index)}
                    >
                        {operatorsList.map((oper) => (
                            <MenuItem key={oper} value={oper}>
                                {oper}
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={2}>
                    <TextField
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        // defaultValue={condition.threshold | condition.limit}
                        value={condition.limit}
                        label="Limit"
                        size="small"
                        onChange={(event) => update('limit', event.target.value, index)}
                    />
                </Grid>
                <IconButton aria-label="remove" onClick={() => remove(index)}>
                    <RemoveCircleIcon fontSize="small" />
                </IconButton>
            </Stack>
            {conditions.length > index + 1 ? (
                <Grid container direction="row" justifyContent="center" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => update('logic', conditions[index + 1].logic == 'OR' ? 'AND' : 'OR', index + 1)}
                    >
                        {conditions[index + 1] && conditions[index + 1].logic}
                    </Button>
                </Grid>
            ) : null}
        </>
    );
};
