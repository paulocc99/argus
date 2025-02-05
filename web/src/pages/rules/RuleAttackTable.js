import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'id',
        align: 'left',
        disablePadding: false,
        label: 'ID'
    },
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    }
];

function AttackTable(props) {
    const { data, click, isSelected } = props;
    const [order] = useState('asc');
    const [orderBy] = useState('id');

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(data, getComparator(order, orderBy)).map((ttp, index) => {
                            const isItemSelected = isSelected(ttp.id);
                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={ttp.id}
                                    selected={isItemSelected}
                                    onClick={() => click(ttp)}
                                >
                                    <TableCell align="left">{ttp.id}</TableCell>
                                    <TableCell align="left">{ttp.name}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default AttackTable;
