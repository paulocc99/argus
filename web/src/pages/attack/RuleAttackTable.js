import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';
import { capitalizeWord } from 'utils';

export default function AttackTable(props) {
    const { data, click, isSelected, type } = props;
    const [order] = useState('asc');
    const [orderBy] = useState('id');

    const headCells = [
        {
            id: type,
            align: 'left',
            disablePadding: true,
            label: capitalizeWord(type)
        }
    ];

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(data, getComparator(order, orderBy)).map((row, index) => {
                            const isItemSelected = isSelected(row.id);
                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={row.id}
                                    selected={isItemSelected}
                                    onClick={() => click(row)}
                                >
                                    <TableCell align="left">{`${row.name}(${row.id})`}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
