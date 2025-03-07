import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
    Box,
    Link,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Switch,
    IconButton,
    CircularProgress,
    Pagination,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';
import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { AlertRisk } from 'common/Status';
import { capitalizeWord, datetimeToStr, setError, setSuccess } from 'utils';
import { runRule } from 'api';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: false,
        label: 'Name'
    },
    {
        id: 'risk',
        align: 'left',
        disablePadding: true,
        label: 'Risk Score'
    },
    {
        id: 'type',
        align: 'left',
        disablePadding: false,
        label: 'Type'
    },
    {
        id: 'datasources',
        align: 'left',
        disablePadding: false,
        label: 'Datasources'
    },
    {
        id: 'attack-ttps',
        align: 'left',
        disablePadding: false,
        label: 'ATT&CK'
    },
    {
        id: 'timeframe',
        align: 'right',
        disablePadding: false,
        label: 'Timeframe'
    },
    {
        id: 'run',
        align: 'left',
        disablePadding: false,
        label: 'Run'
    },
    {
        id: 'last-execution',
        align: 'right',
        disablePadding: false,
        label: 'Last Execution'
    },
    {
        id: 'active',
        align: 'right',
        disablePadding: false,
        label: 'Active'
    }
];

export default function RuleTable(props) {
    const { rules, stateUpdate, remove, page, pages, hChange } = props;

    const [running, setRunning] = useState([]);
    const [order] = useState('asc');
    const [orderBy] = useState('name');

    const executeRule = async (e, id) => {
        e.stopPropagation();
        try {
            setRunning([...running, id]);
            await runRule(id);
            setSuccess('Rule run completed.');
        } catch (error) {
            setError(error);
        } finally {
            setRunning([...running].filter((e) => e != id));
        }
    };

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(rules, getComparator(order, orderBy)).map((rule, index) => {
                            const isRunning = running.includes(rule.uuid);

                            return (
                                <TableRow sx={TableRowStyle} tabIndex={-1} key={rule.name}>
                                    <TableCell align="left">
                                        <Link component={RouterLink} to={`/rules/${rule.uuid}`}>
                                            {rule.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell align="left">
                                        <AlertRisk status={rule.risk} title={rule.risk} />
                                    </TableCell>
                                    <TableCell align="left">{rule.type == 'eql' ? 'EQL' : 'Threshold'}</TableCell>
                                    <TableCell align="left">{rule.datasources.join(', ')}</TableCell>
                                    <TableCell align="left">
                                        {rule.attack.tactics.map((t, i) => (
                                            <Chip key={t.name} label={capitalizeWord(t.name)} sx={{ ml: i != 0 && 1 }} />
                                        ))}
                                    </TableCell>
                                    <TableCell align="right">{rule.timeframe}</TableCell>
                                    <TableCell align="left">
                                        <IconButton color="primary" onClick={(e) => executeRule(e, rule.uuid)}>
                                            {isRunning ? <CircularProgress size={24} /> : <PlayArrowIcon />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell align="right">{datetimeToStr(rule.last_execution)}</TableCell>
                                    <TableCell align="right">
                                        <Switch
                                            defaultChecked={rule.active ? true : false}
                                            onChange={() => stateUpdate(rule.uuid, !rule.active)}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton aria-label="delete" onClick={() => remove(rule)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center" spacing={2}>
                <Pagination sx={{ mt: 1, mb: 1 }} count={pages} page={page} onChange={hChange} />
            </Box>
        </Box>
    );
}
