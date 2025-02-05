import { useState, useEffect } from 'react';

import {
    Box,
    Stack,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Select,
    Chip,
    OutlinedInput,
    MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import RuleExternalTable from './RuleExternalTable';
import { HTypography } from 'common/Typography';
import { capitalizeWord, capitalizeWords, setError } from 'utils';
import { getATTACKTactics, getDatasources, getExternalRules } from 'api';

const boxStyle = { display: 'flex', flexWrap: 'wrap', gap: 0.5 };

function RuleExternalDialog(props) {
    const { open, handleClose, batchImport } = props;

    const [rules, setRules] = useState([]);
    const [rulesPage, setRulesPage] = useState(1);
    const [rulesPages, setRulesPages] = useState(1);

    const [dataSources, setDataSources] = useState([]);
    const [attackTactics, setAttackTactics] = useState([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [tacticsFilter, setTacticsFilter] = useState([]);
    const [dataSourceFilter, setDataSourceFilter] = useState([]);

    // API
    const fetchDataSources = async () => {
        try {
            const response = await getDatasources();
            const ds = response.data.map((e) => e.name).filter((e) => e !== 'baseline');
            setDataSources(ds);
        } catch (error) {
            setError("Couldn't retrieve datasources", error.message);
        }
    };

    const fetchExternalRules = async () => {
        try {
            let dsFilter = dataSourceFilter.map((d) => d.toLowerCase()).join(', ');
            const tFilter = tacticsFilter.map((t) => t.name.toLowerCase()).join(', ');
            const params = {
                page: rulesPage,
                search: searchFilter,
                datasource: dsFilter,
                tactics: tFilter
            };
            const response = await getExternalRules(params);
            const { rules, pages } = response.data;
            setRules(rules.reverse());
            setRulesPages(pages);
        } catch (error) {
            setError("Couln't retrieve external rules", error.message);
        }
    };

    const fetchATTACKTactics = async () => {
        try {
            const response = await getATTACKTactics('ics', false);
            setAttackTactics(response.data.tactics);
        } catch (error) {
            setError("Couln't retrieve ATT&CK tactics", error.message);
        }
    };

    // Hooks
    useEffect(() => {
        if (!open) return;
        fetchExternalRules();
    }, [open, rulesPage]);

    useEffect(() => {
        if (!open) return;
        if (rulesPage !== 1) {
            setRulesPage(1);
            return;
        }
        fetchExternalRules();
    }, [tacticsFilter, dataSourceFilter]);

    useEffect(() => {
        fetchATTACKTactics();
        fetchDataSources();
    }, []);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xl">
            <DialogContent sx={{ minHeight: '400px' }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <div>
                        <Grid container alignItems="center">
                            <Grid item xs={5}>
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
                                    <Button variant="outlined" startIcon={<SearchIcon />} onClick={fetchExternalRules} sx={{ ml: 2 }}>
                                        Search
                                    </Button>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} sx={{ ml: 4 }}>
                                <Stack direction="row" spacing={2}>
                                    <Grid>
                                        <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>
                                            Datasource
                                        </Typography>
                                        <Select
                                            sx={{ minWidth: '150px' }}
                                            labelId="attack-datasource"
                                            id="attack-datasource"
                                            multiple
                                            size="small"
                                            value={dataSourceFilter}
                                            input={<OutlinedInput id="datasource-chip" label="Datasource" />}
                                            onChange={(event) => setDataSourceFilter(event.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={boxStyle}>
                                                    {selected.map((datasource) => (
                                                        <Chip size="small" key={datasource} label={capitalizeWords(datasource)} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {dataSources.map((ds) => (
                                                <MenuItem key={ds} value={ds}>
                                                    {capitalizeWord(ds)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid>
                                        <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>
                                            ATT&CK Tactics
                                        </Typography>
                                        <Select
                                            sx={{ minWidth: '150px' }}
                                            labelId="attack-tactic"
                                            id="attack-tactic"
                                            multiple
                                            size="small"
                                            value={tacticsFilter}
                                            input={<OutlinedInput id="tactics-chip" label="Tactics" />}
                                            onChange={(event) => setTacticsFilter(event.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={boxStyle}>
                                                    {selected.map((tactic) => (
                                                        <Chip size="small" key={tactic.id} label={capitalizeWords(tactic.name)} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {attackTactics.map((t) => (
                                                <MenuItem key={t} value={t}>
                                                    {capitalizeWords(t.name)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                </Stack>
                            </Grid>
                        </Grid>
                        <RuleExternalTable
                            rules={rules}
                            page={rulesPage}
                            pagesNumber={rulesPages}
                            pChange={(event, value) => setRulesPage(value)}
                            importRule={(id) => batchImport([id])}
                        />
                    </div>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => batchImport(rules.map((r) => r.uuid))}>Import All</Button>
            </DialogActions>
        </Dialog>
    );
}

export default RuleExternalDialog;
