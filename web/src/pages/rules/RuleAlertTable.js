import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Pagination } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { AlertStatus } from 'common/Status';
import { datetimeToStr, capitalizeWord } from 'utils';
import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'time',
        align: 'left',
        disablePadding: false,
        label: 'Time'
    },
    {
        id: 'type',
        align: 'left',
        disablePadding: true,
        label: 'Type'
    },
    {
        id: 'asset',
        align: 'right',
        disablePadding: true,
        label: 'Asset'
    },
    {
        id: 'status',
        align: 'left',
        disablePadding: false,
        label: 'Status'
    }
];

function RuleAlertTable(props) {
    const { alerts, page, pages, pChange, select } = props;
    const [order] = useState('desc');
    const [orderBy] = useState('created_at');
    const [selected, setSelected] = useState({});

    const isSelected = (uuid) => selected == uuid;

    const handleSelect = (alert) => {
        select(alert);
        setSelected(alert.uuid);
    };

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table aria-labelledby="tableTitle" sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(alerts, getComparator(order, orderBy)).map((alert, index) => {
                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={alert.uuid}
                                    onClick={() => handleSelect(alert)}
                                    selected={isSelected(alert.uuid)}
                                >
                                    <TableCell align="left">{datetimeToStr(alert.created_at)}</TableCell>
                                    <TableCell align="left">{capitalizeWord(alert.type)}</TableCell>
                                    <TableCell align="right">{alert.assets?.join(', ')}</TableCell>
                                    <TableCell align="left">
                                        <AlertStatus status={alert.status} title={alert.status} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center" spacing={2}>
                <Pagination sx={{ mt: 1, mb: 1 }} count={pages} page={page} onChange={pChange} />
            </Box>
        </Box>
    );
}

export default RuleAlertTable;
