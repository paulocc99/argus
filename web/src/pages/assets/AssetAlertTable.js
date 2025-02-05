import { useState } from 'react';

import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Pagination } from '@mui/material';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';

import Vertical from 'components/@extended/Vertical';
import { capitalizeWord, datetimeToStr } from 'utils';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';
import SortedTableHead, { stableSort, getComparator } from 'common/SortedTableHead';
import { AlertStatus } from 'common/Status';

const headCells = [
    {
        id: 'type',
        align: 'left',
        disablePadding: true,
        label: 'Type'
    },
    {
        id: 'time',
        align: 'left',
        disablePadding: false,
        label: 'Time'
    },
    {
        id: 'rule',
        align: 'left',
        disablePadding: true,
        label: 'Rule'
    },
    {
        id: 'status',
        align: 'left',
        disablePadding: false,
        label: 'Status'
    }
];

const AlertType = ({ type, panic }) => {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Vertical color={type == 'alert' ? 'warning' : 'error'} />
            <Typography>{capitalizeWord(type)}</Typography>
            {type == 'alarm' && panic && <CrisisAlertIcon />}
        </Stack>
    );
};

export default function AssetAlertTable(props) {
    const { alerts, page, pagesNumber, pChange } = props;
    const [order] = useState('asc');
    const [orderBy] = useState('');
    const [selected, setSelected] = useState({});
    const isSelected = (uuid) => selected == uuid;

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(alerts, getComparator(order, orderBy)).map((alert, index) => {
                            const isItemSelected = isSelected(alert.uuid);

                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        bgcolor: alert.type == 'alarm' && alert.panic && 'rgba(255, 0, 0, 0.2) !important'
                                    }}
                                    aria-checked={isItemSelected}
                                    tabIndex={-1}
                                    key={alert.uuid}
                                    selected={isItemSelected}
                                    onClick={() => {
                                        setSelected(alert.uuid);
                                    }}
                                >
                                    <TableCell align="left">
                                        <AlertType type={alert.type} panic={alert.panic} />
                                    </TableCell>
                                    <TableCell align="left">{datetimeToStr(alert.created_at)}</TableCell>
                                    <TableCell align="left">{alert.rule.name}</TableCell>
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
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={pChange} />
            </Box>
        </Box>
    );
}
