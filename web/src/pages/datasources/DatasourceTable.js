import { useState } from 'react';

import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Pagination, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';
import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { eventsNumberPretty } from 'utils';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'indices',
        align: 'left',
        disablePadding: true,
        label: 'Indices'
    },
    {
        id: 'events',
        align: 'left',
        disablePadding: true,
        label: 'Events'
    }
];

export default function DatasourceTable(props) {
    const { datasources, page, pagesNumber, pChange, show, del } = props;

    const [order] = useState('asc');
    const [orderBy] = useState('name');
    const [selected, setSelected] = useState('');

    const isSelected = (name) => selected == name;

    // Handlers
    const handleClick = (ds) => {
        setSelected(ds.name);
        show(ds);
    };

    const handleDel = (e, name) => {
        e.stopPropagation();
        del(name);
    };

    // API
    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(datasources, getComparator(order, orderBy)).map((ds, index) => {
                            const isItemSelected = isSelected(ds.name);

                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={ds.name}
                                    selected={isItemSelected}
                                    onClick={() => handleClick(ds)}
                                >
                                    <TableCell align="left">{ds.name}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                            {ds.indices.map((r) => (
                                                <Chip key={r} label={r} sx={{ ml: 1 }} />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <ReceiptLongIcon color="primary" />
                                            <Typography>{eventsNumberPretty(ds.events)}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        {ds.name !== 'baseline' && (
                                            <IconButton color="error" onClick={(e) => handleDel(e, ds.name)}>
                                                <DeleteIcon />
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
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={pChange} />
            </Box>
        </Box>
    );
}
