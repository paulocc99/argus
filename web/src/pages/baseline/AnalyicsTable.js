import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Chip, IconButton, CircularProgress, Switch } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';
import { capitalizeWord, setError, setSuccess } from 'utils';
import { runBaselineAnalytic } from 'api';

const headCells = [
    // {
    //     id: 'select',
    //     align: 'left',
    //     disablePadding: true,
    //     label: ''
    // },
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'category',
        align: 'left',
        disablePadding: true,
        label: 'Code'
    },
    {
        id: 'datasources',
        align: 'left',
        disablePadding: false,
        label: 'Datasources'
    },
    {
        id: 'type',
        align: 'left',
        disablePadding: false,
        label: 'Type'
    },
    {
        id: 'origin',
        align: 'left',
        disablePadding: false,
        label: 'Origin'
    },
    {
        id: 'timeframe',
        align: 'left',
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
        id: 'active',
        align: 'right',
        disablePadding: false,
        label: 'Active'
    }
];

export default function AnalyticsTable(props) {
    const { analytics, show, updateState } = props;

    const [running, setRunning] = useState([]);
    const [order] = useState('asc');
    const [orderBy] = useState('code');

    const handleStateUpdate = (e, analytic) => {
        const { code, active } = analytic;
        e.stopPropagation();
        updateState(code, !active);
    };

    const runAnalytic = async (e, id) => {
        e.stopPropagation();
        try {
            setRunning([...running, id]);
            await runBaselineAnalytic(id);
            setSuccess('Analytic run completed.');
        } catch (error) {
            setError("Couldn't run analytic", error.message);
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
                        {stableSort(analytics, getComparator(order, orderBy)).map((analytic, index) => {
                            const isRunning = running.includes(analytic.code);
                            return (
                                <TableRow hover sx={TableRowStyle} tabIndex={-1} onClick={() => show(analytic)} key={analytic.code}>
                                    {/*                                    <TableCell align="left">
                                        <Checkbox checked={analytic.active} onClick={(e) => handleStateUpdate(e, analytic.code)} />
                                    </TableCell>*/}
                                    <TableCell align="left">{analytic.name}</TableCell>
                                    <TableCell align="left">{analytic.code}</TableCell>
                                    <TableCell align="left">{analytic.datasources.join(', ')}</TableCell>
                                    <TableCell align="left">{capitalizeWord(analytic.category)}</TableCell>
                                    <TableCell align="left">
                                        {analytic.origin ? (
                                            <Chip label="CUSTOM" color="primary" />
                                        ) : (
                                            <Chip label="NATIVE" color="primary" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="left">{analytic.timeframe}</TableCell>
                                    <TableCell align="left">
                                        <IconButton color="primary" onClick={(e) => runAnalytic(e, analytic.code)}>
                                            {isRunning ? <CircularProgress size={24} /> : <PlayArrowIcon />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Switch defaultChecked={analytic.active} onClick={(e) => handleStateUpdate(e, analytic)} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
