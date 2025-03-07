import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { capitalizeWord } from 'utils';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';

export default function DynamicTable(props) {
    const { data, cells } = props;
    const [order] = useState('asc');
    const [orderBy] = useState('id');

    let headCells = [];
    cells.forEach((cell) => {
        headCells.push({
            id: cell,
            align: 'left',
            disablePadding: true,
            label: capitalizeWord(cell)
        });
    });

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(data, getComparator(order, orderBy)).map((row, index) => {
                            return (
                                <TableRow hover role="checkbox" sx={TableRowStyle} tabIndex={-1} key={index}>
                                    {Object.values(row)?.map((value) => (
                                        <TableCell
                                            align="left"
                                            style={{
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word'
                                            }}
                                        >
                                            {Array.isArray(value) ? value.join(', ') : value}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
