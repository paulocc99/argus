import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Chip, IconButton, CircularProgress, Pagination } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';
import { capitalizeWord } from 'utils';

const headCells = [
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
    }
];

export default function AnalyticsImportTable(props) {
    const { analytics, page, pagesNumber, pChange, callImport } = props;

    const [running, setRunning] = useState([]);
    const [order] = useState('asc');
    const [orderBy] = useState('code');

    const importAnalytic = async (e, code) => {
        e.stopPropagation();

        setRunning([...running, code]);
        await callImport([code]);
        setRunning([...running].filter((e) => e != code));
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
                                <TableRow hover sx={TableRowStyle} tabIndex={-1} key={analytic.code}>
                                    <TableCell align="left">{analytic.name}</TableCell>
                                    <TableCell align="left">{analytic.code}</TableCell>
                                    <TableCell align="left">{analytic.datasources.join(', ')}</TableCell>
                                    <TableCell align="left">{capitalizeWord(analytic.category)}</TableCell>
                                    <TableCell align="left">
                                        {analytic.origin == 'native' ? (
                                            <Chip label="NATIVE" color="primary" variant="outlined" />
                                        ) : (
                                            <Chip label="CUSTOM" color="primary" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={(e) => importAnalytic(e, analytic.code)}>
                                            {isRunning ? <CircularProgress size={24} /> : <CloudDownloadIcon />}
                                        </IconButton>
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
