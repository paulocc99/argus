import { useState } from 'react';

import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Pagination, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'description',
        align: 'left',
        disablePadding: true,
        label: 'Description'
    },
    {
        id: 'processors',
        align: 'left',
        disablePadding: true,
        label: 'Processors'
    },
    {
        id: 'action',
        align: 'right',
        disablePadding: false,
        label: 'Action'
    }
];

export default function IngestPipelineTable(props) {
    const { pipelines, select, page, pagesNumber, hChange, del, show } = props;

    const [order] = useState('asc');
    const [orderBy] = useState('id');
    const [selected, setSelected] = useState({});
    const isSelected = (name) => selected == name;

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(pipelines, getComparator(order, orderBy)).map((pipe, index) => {
                            const isItemSelected = isSelected(pipe.id);
                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={pipe.id}
                                    selected={isItemSelected}
                                    onClick={() => {
                                        select(pipe);
                                        setSelected(pipe.name);
                                    }}
                                >
                                    <TableCell align="left">{pipe.id}</TableCell>
                                    <TableCell align="left">{pipe.description}</TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <MiscellaneousServicesIcon />
                                            <Typography>{pipe.processors.length}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => show(pipe)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => del(pipe.id)}>
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
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={hChange} />
            </Box>
        </Box>
    );
}
