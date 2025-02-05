import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Pagination, IconButton, Tooltip } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { AlertStatus, AlertRisk, AlertType } from 'common/Status';
import { TableContainerStyle, TableStyle } from 'themes/overrides/Table';
import { datetimeToStr } from 'utils';

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
        id: 'assets',
        align: 'right',
        disablePadding: true,
        label: 'Assets'
    },
    {
        id: 'risk',
        align: 'left',
        disablePadding: false,
        label: 'Risk Score'
    },
    {
        id: 'status',
        align: 'left',
        disablePadding: false,
        label: 'Status'
    },
    {
        id: 'action',
        align: 'right',
        disablePadding: false,
        label: 'Action'
    }
];

export default function RuleTable(props) {
    const { rules, updateSelected, page, pagesNumber, hChange, updateState } = props;
    const [order] = useState('asc');
    const [orderBy] = useState('trackingNo');
    const [selected, setSelected] = useState({});
    const isSelected = (uuid) => selected == uuid;

    const handleStatusUpdate = (e, alert) => {
        e.stopPropagation();
        updateState(alert.uuid, alert.status == 'open' ? 'processing' : 'resolved');
    };

    const alertName = (alert) => (alert.rule ? alert.rule.name : alert.analytic?.name ? alert.analytic.name : alert.custom_msg);

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(rules, getComparator(order, orderBy)).map((alert, index) => {
                            const isItemSelected = isSelected(alert.uuid);

                            return (
                                <TableRow
                                    hover
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        cursor: 'pointer',
                                        bgcolor: alert.type == 'alarm' && alert.panic && 'rgba(255, 0, 0, 0.2) !important'
                                    }}
                                    tabIndex={-1}
                                    key={alert.uuid}
                                    selected={isItemSelected}
                                    onClick={() => {
                                        updateSelected(alert);
                                        setSelected(alert.uuid);
                                    }}
                                >
                                    <TableCell align="left">
                                        <AlertType type={alert.type} panic={alert.panic} />
                                    </TableCell>
                                    <TableCell align="left">{datetimeToStr(alert.created_at)}</TableCell>
                                    <TableCell align="left">{alertName(alert)}</TableCell>
                                    <TableCell align="right">{alert.assets.join(', ')}</TableCell>
                                    <TableCell align="left">
                                        <AlertRisk status={alert.rule?.risk} title={alert.rule?.risk} />
                                    </TableCell>
                                    <TableCell align="left">
                                        <AlertStatus status={alert.status} title={alert.status} />
                                    </TableCell>
                                    <TableCell align="right">
                                        {alert.status != 'resolved' && (
                                            <IconButton color="primary" aria-label="action" onClick={(e) => handleStatusUpdate(e, alert)}>
                                                {alert.status == 'open' ? (
                                                    <Tooltip title="Start analysis" placement="right">
                                                        <PlayArrowIcon />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="Resolve alert" placement="right">
                                                        <AssignmentTurnedInIcon />
                                                    </Tooltip>
                                                )}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center" spacing={2}>
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={hChange} />
            </Box>
        </Box>
    );
}
