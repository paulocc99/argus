import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import {
    Box,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Pagination,
    IconButton
} from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { datetimeToStr } from 'utils';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'time',
        align: 'left',
        disablePadding: false,
        label: 'Time'
    },
    {
        id: 'category',
        align: 'left',
        disablePadding: true,
        label: 'Category'
    },
    {
        id: 'action',
        align: 'left',
        disablePadding: true,
        label: 'Action'
    },
    {
        id: 'module',
        align: 'left',
        disablePadding: true,
        label: 'Module'
    }
];

const showCategory = (category) => {
    if (typeof category === 'string') {
        return category;
    } else if (Array.isArray(category)) {
        return category.join(', ');
    } else {
        return 'N/A';
    }
};

export default function EventTable(props) {
    const { events, page, pagesNumber, pChange, showEvent } = props;

    const [order] = useState('asc');
    const [orderBy] = useState('');
    const [selected, setSelected] = useState(-1);

    return (
        <Box>
            <TableContainer
                sx={{
                    width: '100%',
                    overflowX: 'hidden',
                    position: 'relative',
                    display: 'block',
                    width: '600px',
                    maxHeight: '600px',
                    '& td, & th': { whiteSpace: 'nowrap' }
                }}
            >
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(events, getComparator(order, orderBy)).map((event, index) => {
                            //const isItemSelected = isSelected(index);
                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={index}
                                    selected={selected == index}
                                    onClick={() => {
                                        setSelected(index);
                                        showEvent(event);
                                    }}
                                >
                                    <TableCell align="left">{datetimeToStr(event['@timestamp'])}</TableCell>
                                    <TableCell align="left">{showCategory(event?.event?.category)}</TableCell>
                                    <TableCell align="left">{event?.event?.action}</TableCell>
                                    <TableCell align="left">{event?.event?.module}</TableCell>
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
